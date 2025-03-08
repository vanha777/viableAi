use axum::{
    extract::{Extension, Path},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sha2::{Digest, Sha256}; // Add sha2 = "0.10.8" to your Cargo.toml
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{keypair_from_seed, Keypair},
    signer::Signer,
    system_instruction,
    transaction::Transaction,
};
use spl_token::{
    instruction::{initialize_account, initialize_mint},
    solana_program::program_pack::Pack,
    state::Mint,
};
use std::{str::FromStr, sync::Arc};
use tokio::sync::Mutex;
// use spl_token::{instruction, id};
use borsh::BorshDeserialize;
use mpl_token_metadata::accounts::Metadata;
use mpl_token_metadata::instructions;
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::{Creator, DataV2};
use serde::{Deserialize, Serialize};

use crate::{
    models::{
        error::MetalootError,
        token::{CreateTokenRequest, MintTokenRequest, RewardTokenRequest},
    },
    ultilites::{convert_client_error, get_anchor_discriminator, get_game_resgistry_ultilities},
    Claims,
};

use super::collection::State;

pub async fn mint_token(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<MintTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Convert user-friendly token amount to raw amount
    let raw_amount = payload
        .amount
        .checked_mul(10u64.pow(9))
        .ok_or_else(|| MetalootError::Error("Amount overflow".to_string()))?;
    // Get state data
    let (rpc_client, payer, metaloot_program_id) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.admin.clone(),
            state.metaloot_program_id.clone(),
        )
    };
    let rpc_client = rpc_client.as_ref();
    let payer = payer.as_ref();

    // Parse mint address
    let mint_pubkey =
        Pubkey::from_str(&payload.token).map_err(|e| MetalootError::Error(e.to_string()))?;

    // Create the same entry_seed_pubkey as in create_game
    let mut hasher = Sha256::new();
    hasher.update(payload.game_id.as_bytes()); // Assuming password isn't needed for lookup
    let seed = hasher.finalize();
    let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let entry_seed_pubkey = entry_seed.pubkey();

    let (game_registry_pda, _bump) = Pubkey::find_program_address(
        &[b"registry", entry_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );

    if rpc_client.get_account(&game_registry_pda).await.is_err() {
        return Err(MetalootError::Error("Game Registry not found".to_string()));
    }

    // Create ATA for the developer
    let game_registry_ata = spl_associated_token_account::get_associated_token_address(
        &game_registry_pda,
        &mint_pubkey,
    );

    let mut instructions = vec![];

    // Create ATA if it doesn't exist
    if rpc_client.get_account(&game_registry_ata).await.is_err() {
        println!("Creating ATA for game registry");
        instructions.push(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &game_registry_pda,
                &mint_pubkey,
                &spl_token::id(),
            ),
        );
    }

    // Add mint to instruction
    instructions.push(
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &mint_pubkey,
            &game_registry_ata,
            &payer.pubkey(),
            &[&payer.pubkey()],
            raw_amount,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?,
    );

    // Send and confirm transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "message": "Minted token successfully into your game developer account",
        "game_regsitry_account": game_registry_pda.to_string()
    })))
}

pub async fn create_token(
    claims: Claims,
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreateTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Get RPC client and admin from state
    let (rpc_client, program_id, payer) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.metaloot_program_id.clone(),
            state.admin.clone(),
        )
    };
    let rpc_client = rpc_client.as_ref();
    let payer = payer.as_ref();

    // Initialize instructions vector and create mint keypair
    let mut instructions: Vec<solana_sdk::instruction::Instruction> = vec![];
    let mint_keypair = Keypair::new();

    // Create account for mint
    instructions.push(system_instruction::create_account(
        &payer.pubkey(),
        &mint_keypair.pubkey(),
        rpc_client
            .get_minimum_balance_for_rent_exemption(Mint::LEN)
            .await
            .map_err(|e| convert_client_error(e))?,
        Mint::LEN as u64,
        &spl_token::id(),
    ));

    instructions.push(
        initialize_mint(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &payer.pubkey(),
            Some(&payer.pubkey()),
            9,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?
        .into(),
    );

    let metadata_pda = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint_keypair.pubkey().as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
    .0;

    let metadata_args = CreateMetadataAccountV3InstructionArgs {
        data: DataV2 {
            name: payload.metadata.name,
            symbol: payload.metadata.symbol,
            uri: payload.metadata.uri,
            seller_fee_basis_points: 0,
            creators: Some(vec![Creator {
                address: payer.pubkey(),
                verified: true,
                share: 100,
            }]),
            collection: None,
            uses: None,
        },
        is_mutable: true,
        collection_details: None,
    };

    instructions.push(
        CreateMetadataAccountV3 {
            metadata: metadata_pda,
            mint: mint_keypair.pubkey(),
            mint_authority: payer.pubkey(),
            payer: payer.pubkey(),
            update_authority: (payer.pubkey(), true),
            system_program: solana_sdk::system_program::ID,
            rent: Some(solana_sdk::sysvar::rent::ID),
        }
        .instruction(metadata_args),
    );

    // ==========================================
    // Update game registry metadata to include new collection
    // Get the entry_seed_pubkey using same logic as create_game()
    // ==========================================
    let entry_seed_pubkey = {
        let mut hasher = Sha256::new();
        hasher.update(claims.developer.as_bytes());
        let seed = hasher.finalize();
        let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
        entry_seed.pubkey()
    };
    // Find the PDA - same as in create_game
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], &program_id);
    // Calculate discriminator for update instruction
    let discriminator = get_anchor_discriminator("update_game_studio");
    let mut instruction_data = discriminator;
    let game_data = get_game_resgistry_ultilities(rpc_client, pda).await?;
    // Pack the instruction data same as create_game
    instruction_data.extend_from_slice(&(game_data.account.data.name.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.name.as_bytes());
    instruction_data.extend_from_slice(&(game_data.account.data.symbol.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.symbol.as_bytes());
    instruction_data
        .extend_from_slice(&(game_data.account.data.game_uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.game_uri.as_bytes());

    //token
    instruction_data.extend_from_slice(&mint_keypair.pubkey().to_bytes());

    let collections = game_data.account.data.nft_collection;
    instruction_data.extend_from_slice(&(collections.len() as u32).to_le_bytes());
    for collection in collections {
        // Add each Pubkey as 32 bytes
        instruction_data.extend_from_slice(&Pubkey::from_str_const(&collection).to_bytes());
    }
    // Create accounts vector - similar to create_game but might not need system_program
    let accounts = vec![
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new(pda, false),
        AccountMeta::new(entry_seed_pubkey, false),
    ];
    // Create and add the update game registry instruction
    let update_registry_ix = solana_sdk::instruction::Instruction {
        program_id,
        accounts,
        data: instruction_data,
    };
    instructions.push(update_registry_ix);
    // ==========================================
    // ============ END OF INSTRUCTION DATA =====
    // ==========================================

    // Send and confirm metadata transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let metadata_transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer, &mint_keypair],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&metadata_transaction)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "address": mint_keypair.pubkey().to_string()
    }))
    .into_response())
}

pub async fn reward_token(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<RewardTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Convert amount to raw units
    let raw_amount = payload
        .amount
        .checked_mul(10u64.pow(9)) // Multiply by 10^9 for token decimals
        .ok_or_else(|| MetalootError::Error("Amount overflow".to_string()))?;
    // Get state data
    let (rpc_client, payer, metaloot_program_id) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.admin.clone(),
            state.metaloot_program_id.clone(),
        )
    };
    let rpc_client = rpc_client.as_ref();
    let payer = payer.as_ref();

    // Parse addresses
    let mint_pubkey =
        Pubkey::from_str(&payload.token).map_err(|e| MetalootError::Error(e.to_string()))?;

    // Create sender seed from player username
    let mut hasher = Sha256::new();
    hasher.update(payload.player_username.as_bytes());
    let seed = hasher.finalize();
    let recipient_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let recipient_seed_pubkey = recipient_seed.pubkey();

    // Create sender seed from developer username
    let mut hasher = Sha256::new();
    hasher.update(payload.game_id.as_bytes());
    let seed = hasher.finalize();
    let sender_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let sender_seed_pubkey = sender_seed.pubkey();

    // Derive PDAs
    let (sender_pda, _) = Pubkey::find_program_address(
        &[b"registry", sender_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );
    let (recipient_pda, _) = Pubkey::find_program_address(
        &[b"player", recipient_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );

    // Get ATAs
    let sender_token_account =
        spl_associated_token_account::get_associated_token_address(&sender_pda, &mint_pubkey);
    let recipient_token_account =
        spl_associated_token_account::get_associated_token_address(&recipient_pda, &mint_pubkey);

    let mut instructions = vec![];

    // Create recipient ATA if needed
    if rpc_client
        .get_account(&recipient_token_account)
        .await
        .is_err()
    {
        instructions.push(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &recipient_pda,
                &mint_pubkey,
                &spl_token::id(),
            ),
        );
    }

    // Build instruction data
    let discriminator = get_anchor_discriminator("reward_tokens");
    let mut instruction_data = discriminator;
    instruction_data.extend_from_slice(&raw_amount.to_le_bytes());

    // Create the instruction with updated account metas
    instructions.push(solana_sdk::instruction::Instruction {
        program_id: metaloot_program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true), // payer (signer)
            AccountMeta::new_readonly(mint_pubkey, false), // token_mint
            AccountMeta::new_readonly(sender_seed_pubkey, false), // sender_seed
            AccountMeta::new(sender_pda, false),    // sender_pda
            AccountMeta::new(sender_token_account, false), // sender_token_account
            AccountMeta::new_readonly(recipient_seed_pubkey, false), // recipient_seed
            AccountMeta::new(recipient_pda, false), // recipient_pda
            AccountMeta::new(recipient_token_account, false), // recipient_token_account
            AccountMeta::new_readonly(spl_token::id(), false), // token_program
        ],
        data: instruction_data,
    });

    // Add these debug prints after deriving the accounts
    println!("Sender Token Account: {}", sender_token_account.to_string());
    println!("Mint Address: {}", mint_pubkey.to_string());
    println!(
        "Amount to transfer: {} (raw: {})",
        payload.amount, raw_amount
    );

    // Get and print the actual balance before transfer
    let sender_balance = rpc_client
        .get_token_account_balance(&sender_token_account)
        .await
        .map_err(|e| convert_client_error(e))?;

    println!("Sender balance: {}", sender_balance.ui_amount.unwrap());

    // Send and confirm transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "message": "Token reward transferred successfully",
        "amount": payload.amount,
        "recipient": recipient_pda.to_string()
    })))
}

pub async fn transfer_token(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<TransferTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Convert amount to raw units
    let raw_amount = payload
        .amount
        .checked_mul(10u64.pow(9))
        .ok_or_else(|| MetalootError::Error("Amount overflow".to_string()))?;

    // Get state data
    let (rpc_client, payer, metaloot_program_id) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.admin.clone(),
            state.metaloot_program_id.clone(),
        )
    };
    let rpc_client = rpc_client.as_ref();
    let payer = payer.as_ref();

    // Parse token mint address
    let mint_pubkey =
        Pubkey::from_str(&payload.token).map_err(|e| MetalootError::Error(e.to_string()))?;

    // Create sender seed from sender username
    let mut hasher = Sha256::new();
    hasher.update(payload.sender_username.as_bytes());
    let seed = hasher.finalize();
    let sender_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let sender_seed_pubkey = sender_seed.pubkey();

    // Create recipient seed from recipient username
    let mut hasher = Sha256::new();
    hasher.update(payload.recipient_username.as_bytes());
    let seed = hasher.finalize();
    let recipient_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let recipient_seed_pubkey = recipient_seed.pubkey();

    // Derive PDAs
    let (sender_pda, _) = Pubkey::find_program_address(
        &[b"player", sender_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );
    let (recipient_pda, _) = Pubkey::find_program_address(
        &[b"player", recipient_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );

    // Get ATAs
    let sender_token_account =
        spl_associated_token_account::get_associated_token_address(&sender_pda, &mint_pubkey);
    let recipient_token_account =
        spl_associated_token_account::get_associated_token_address(&recipient_pda, &mint_pubkey);

    let mut instructions = vec![];

    // Create recipient ATA if needed
    if rpc_client
        .get_account(&recipient_token_account)
        .await
        .is_err()
    {
        instructions.push(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &recipient_pda,
                &mint_pubkey,
                &spl_token::id(),
            ),
        );
    }

    // Build instruction data
    let discriminator = get_anchor_discriminator("transfer_tokens");
    let mut instruction_data = discriminator;
    instruction_data.extend_from_slice(&raw_amount.to_le_bytes());

    // Create the instruction
    instructions.push(solana_sdk::instruction::Instruction {
        program_id: metaloot_program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(mint_pubkey, false),
            AccountMeta::new_readonly(sender_seed_pubkey, false),
            AccountMeta::new(sender_pda, false),
            AccountMeta::new(sender_token_account, false),
            AccountMeta::new_readonly(recipient_seed_pubkey, false),
            AccountMeta::new(recipient_pda, false),
            AccountMeta::new(recipient_token_account, false),
            AccountMeta::new_readonly(spl_token::id(), false),
        ],
        data: instruction_data,
    });

    // Debug prints
    println!("Sender Token Account: {}", sender_token_account.to_string());
    println!(
        "Recipient Token Account: {}",
        recipient_token_account.to_string()
    );
    println!(
        "Amount to transfer: {} (raw: {})",
        payload.amount, raw_amount
    );

    // Check sender balance
    let sender_balance = rpc_client
        .get_token_account_balance(&sender_token_account)
        .await
        .map_err(|e| convert_client_error(e))?;

    println!("Sender balance: {}", sender_balance.ui_amount.unwrap());

    // Send and confirm transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "message": "Token transferred successfully",
        "amount": payload.amount,
        "recipient": recipient_pda.to_string()
    })))
}

pub async fn get_token_data(
    Path(mint_address): Path<String>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> Result<impl IntoResponse, MetalootError> {
    let state = state.lock().await;
    let rpc_client = state.rpc_client.clone();

    // Get the token mint address from your registry using username
    // This is placeholder - you'll need to implement the actual lookup
    let mint_pubkey = Pubkey::from_str_const(&mint_address);

    // Find the metadata PDA for this mint
    let metadata_pda = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint_pubkey.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
    .0;

    // Fetch the metadata account
    let metadata_account = rpc_client
        .get_account(&metadata_pda)
        .await
        .map_err(|e| convert_client_error(e))?;

    // Deserialize the metadata
    let metadata = Metadata::safe_deserialize(&mut metadata_account.data.as_slice())
        .map_err(|e| MetalootError::Error(e.to_string()))?;

    Ok(Json(json!({
        "name": metadata.name,
        "symbol": metadata.symbol,
        "uri": metadata.uri,
        "creators": metadata.creators.map(|creators| creators.iter().map(|creator| creator.address.to_string()).collect::<Vec<String>>()),
        "mint": mint_pubkey.to_string(),
    })))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransferTokenRequest {
    pub token: String,
    pub amount: u64,
    pub sender_username: String,
    pub recipient_username: String,
}
