use axum::{
    extract::{Extension, Path, Query},
    response::IntoResponse,
    Json,
};
use mpl_token_metadata::{
    accounts::{MasterEdition, Metadata},
    instructions::{
        CreateMasterEditionV3Builder, CreateMetadataAccountV3, CreateMetadataAccountV3Builder,
        CreateMetadataAccountV3InstructionArgs, CreateV1InstructionArgs, VerifyCollection,
        VerifyCollectionBuilder, VerifySizedCollectionItemBuilder,
    },
    types::{Collection, CollectionDetails, Creator, DataV2},
};
use reqwest;
use serde_json::json;
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::{self, RpcClient};
use solana_sdk::{
    instruction::AccountMeta,
    pubkey::Pubkey,
    signature::{keypair_from_seed, Keypair, Signature},
    signer::Signer,
    system_instruction,
    transaction::Transaction,
};
use spl_token::{
    instruction::{initialize_account, initialize_mint, AuthorityType},
    solana_program::program_pack::Pack,
    state::Mint,
};
use sqlx::PgPool;
use std::{str::FromStr, sync::Arc};
use tokio::sync::Mutex; // Add sha2 = "0.10.8" to your Cargo.toml

use crate::{
    models::{
        collection::{CreateCollectionRequest, CreateNFTRequest},
        error::MetalootError,
        token::RewardTokenRequest,
    },
    ultilites::{
        convert_client_error, get_anchor_discriminator, get_game_resgistry_ultilities,
        send_transaction,
    },
    AuthError, Claims,
};

use super::token::TransferTokenRequest;
pub struct State {
    pub rpc_client: Arc<RpcClient>,
    pub metaloot_program_id: Pubkey,
    pub admin: Arc<Keypair>,
    pub server_url: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    pub apple_client_id: String,
    pub apple_team_id: String,
    pub apple_key_id: String,
    pub apple_private_key: String,
    pub rpc_url: String,
    pub supabase_postgres: PgPool,
}

pub async fn create_collection(
    claims: Claims,
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreateCollectionRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Get RPC client and admin from state
    let (rpc_client, program_id, payer) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.metaloot_program_id,
            state.admin.clone(),
        )
    };

    // First Transaction: Create Collection NFT
    let mint_keypair = Keypair::new();
    let signature = create_collection_nft(rpc_client.as_ref(), payer.as_ref(), &mint_keypair, &payload).await?;

    // Clone values for background task
    let rpc_client_bg = rpc_client.clone();
    let mint_pubkey = mint_keypair.pubkey();
    let developer = claims.developer.clone();

    // Spawn background task for registry update
    tokio::spawn(async move {
        match update_game_registry(
            rpc_client_bg.as_ref(),
            &program_id,
            payer.as_ref(),
            &developer,
            &mint_pubkey
        ).await {
            Ok(update_signature) => println!("Registry update successful: {}", update_signature),
            Err(e) => eprintln!("Registry update failed: {}", e),
        }
    });

    Ok(Json(json!({
        "status": "success",
        "collection_signature": signature.to_string(),
        "address": mint_keypair.pubkey().to_string()
    }))
    .into_response())
}

async fn create_collection_nft(
    rpc_client: &RpcClient,
    payer: &Keypair,
    mint_keypair: &Keypair,
    payload: &CreateCollectionRequest,
) -> Result<Signature, MetalootError> {
    let mut instructions: Vec<solana_sdk::instruction::Instruction> = vec![];

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

    // Initialize mint
    instructions.push(
        initialize_mint(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &payer.pubkey(),
            Some(&payer.pubkey()),
            0,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?
        .into(),
    );

    // Create token account
    // let token_account = Keypair::new();
    let token_account = spl_associated_token_account::get_associated_token_address(
        &payer.pubkey(), // collection authority
        &mint_keypair.pubkey(),
    );
    instructions.push(
        spl_associated_token_account::instruction::create_associated_token_account(
            &payer.pubkey(),
            &payer.pubkey(),
            &mint_keypair.pubkey(),
            &spl_token::id(),
        ),
    );

    let metadata_pda = Metadata::find_pda(&mint_keypair.pubkey()).0;
    let data = DataV2 {
        name: payload.name.clone(),
        symbol: payload.symbol.clone(),
        uri: payload.uri.clone(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: payer.pubkey(),
            verified: true,
            share: 100,
        }]),
        collection: None,
        uses: None,
    };

    let mut create_metadata = CreateMetadataAccountV3Builder::new();
    create_metadata.metadata(metadata_pda);
    create_metadata.mint(mint_keypair.pubkey());
    create_metadata.mint_authority(payer.pubkey());
    create_metadata.payer(payer.pubkey());
    create_metadata.update_authority(payer.pubkey(), true);
    create_metadata.system_program(solana_sdk::system_program::ID);
    create_metadata.rent(Some(solana_sdk::sysvar::rent::ID));
    create_metadata.data(data);
    create_metadata.is_mutable(true);
    create_metadata.collection_details(CollectionDetails::V1 {
        size: payload.size.unwrap_or(0),
    });
    instructions.push(create_metadata.instruction());
    // Add mint_to instruction to mint 1 token
    instructions.push(
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &token_account,
            &payer.pubkey(),
            &[],
            1,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?
        .into(),
    );
    // Create Master Edition
    let master_edition_pda = MasterEdition::find_pda(&mint_keypair.pubkey()).0;
    let mut create_master_edition = CreateMasterEditionV3Builder::new();
    create_master_edition.edition(master_edition_pda);
    create_master_edition.mint(mint_keypair.pubkey());
    create_master_edition.update_authority(payer.pubkey());
    create_master_edition.mint_authority(payer.pubkey());
    create_master_edition.payer(payer.pubkey());
    create_master_edition.metadata(metadata_pda);
    create_master_edition.token_program(spl_token::id());
    create_master_edition.system_program(solana_sdk::system_program::ID);
    create_master_edition.rent(Some(solana_sdk::sysvar::rent::ID));
    create_master_edition.max_supply(0); // 0 are standard for collection
    instructions.push(create_master_edition.instruction());

    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer, mint_keypair],
        recent_blockhash,
    );

    rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))
}

async fn update_game_registry(
    rpc_client: &RpcClient,
    program_id: &Pubkey,
    payer: &Keypair,
    developer: &str,
    collection_mint: &Pubkey,
) -> Result<Signature, MetalootError> {
    let mut instructions: Vec<solana_sdk::instruction::Instruction> = vec![];

    // Generate entry_seed_pubkey
    let entry_seed_pubkey = {
        let mut hasher = Sha256::new();
        hasher.update(developer.as_bytes());
        let seed = hasher.finalize();
        let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
        entry_seed.pubkey()
    };

    // Find the PDA
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], program_id);

    // Build instruction data
    let discriminator = get_anchor_discriminator("update_game_studio");
    let mut instruction_data = discriminator;
    let game_data = get_game_resgistry_ultilities(rpc_client, pda).await?;

    // Pack the instruction data
    instruction_data.extend_from_slice(&(game_data.account.data.name.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.name.as_bytes());
    instruction_data.extend_from_slice(&(game_data.account.data.symbol.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.symbol.as_bytes());
    instruction_data
        .extend_from_slice(&(game_data.account.data.game_uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(game_data.account.data.game_uri.as_bytes());

    // Add token
    instruction_data.extend_from_slice(
        &Pubkey::from_str_const(&game_data.account.data.native_token).to_bytes(),
    );

    // Handle collections
    let mut collections = game_data.account.data.nft_collection;
    if collections.len() >= 5 {
        return Err(MetalootError::Error(
            "nft_collection can contain at most 5 collection addresses".to_string(),
        ));
    }
    collections.push(collection_mint.to_string());

    instruction_data.extend_from_slice(&(collections.len() as u32).to_le_bytes());
    for collection in collections {
        if let Err(_) = std::panic::catch_unwind(|| Pubkey::from_str_const(&collection)) {
            return Err(MetalootError::Error(
                "Invalid nft_collection format: must be a valid Solana public key".to_string(),
            ));
        }
        instruction_data.extend_from_slice(&Pubkey::from_str_const(&collection).to_bytes());
    }

    // Create and add instruction
    let update_registry_ix = solana_sdk::instruction::Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(pda, false),
            AccountMeta::new(entry_seed_pubkey, false),
        ],
        data: instruction_data,
    };
    instructions.push(update_registry_ix);

    // Send transaction
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

    rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))
}

pub async fn get_asset(
    Path(username): Path<String>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> Result<impl IntoResponse, MetalootError> {
    let (rpc_url, program_id) = {
        let state = state.lock().await;
        (state.rpc_url.clone(), state.metaloot_program_id.clone())
    };

    // Create player seed from username (same as in register_player)
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes());
    let seed = hasher.finalize();
    let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    let player_seed_pubkey = player_seed.pubkey();

    // Generate PDA for the player (same as in register_player)
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

    // Create the request body
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": "text",
        "method": "getAssetsByOwner",
        "params": {
            "ownerAddress": pda.to_string(),
            "options": {
                "showCollectionMetadata": true,
                // "showFungible":true
            }
          },
          "sortBy":{
            "sortDirection":"desc"
          }
    });

    // Make the POST request
    let client = reqwest::Client::new();
    let response = client
        .post(&rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| MetalootError::Error(format!("Failed to make request: {}", e)))?;

    // Get the response body
    let response_body = response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| MetalootError::Error(format!("Failed to parse response: {}", e)))?;

    Ok(Json(response_body).into_response())
}

pub async fn create_nft(
    claims: Claims,
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreateNFTRequest>,
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

    // Recipient address
    let entry_seed_pubkey = {
        let mut hasher = Sha256::new();
        hasher.update(claims.developer.as_bytes());
        let seed = hasher.finalize();
        let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
        entry_seed.pubkey()
    };
    // Find the PDA - same as in create_game
    let (developer_recipient_pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], &program_id);

    // Initialize instructions vector and create mint keypair
    let mut instructions: Vec<solana_sdk::instruction::Instruction> = vec![];
    let mint_keypair = Keypair::new();

    // Parse collection mint address
    let collection_mint = Pubkey::from_str(&payload.collection_mint)
        .map_err(|e| MetalootError::Error(format!("Invalid collection mint address: {}", e)))?;

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

    // Initialize mint
    instructions.push(
        initialize_mint(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &payer.pubkey(),
            Some(&payer.pubkey()),
            0,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?
        .into(),
    );

    // Create token account for recipient using ATA
    let token_account = spl_associated_token_account::get_associated_token_address(
        &developer_recipient_pda,
        &mint_keypair.pubkey(),
    );

    // Only create ATA if it doesn't exist
    if rpc_client.get_account(&token_account).await.is_err() {
        instructions.push(
            spl_associated_token_account::instruction::create_associated_token_account(
                &payer.pubkey(),
                &developer_recipient_pda,
                &mint_keypair.pubkey(),
                &spl_token::id(),
            ),
        );
    }

    // Create metadata PDA
    let metadata_pda = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint_keypair.pubkey().as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
    .0;

    let data = DataV2 {
        name: payload.name,
        symbol: payload.symbol,
        uri: payload.uri,
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: payer.pubkey(),
            verified: true,
            share: 100,
        }]),
        collection: Some(Collection {
            verified: false, // Will be verified in a separate tx
            key: collection_mint,
        }),
        uses: None,
    };

    let mut create_metadata_v3 = CreateMetadataAccountV3Builder::new();
    create_metadata_v3.metadata(metadata_pda);
    create_metadata_v3.mint(mint_keypair.pubkey());
    create_metadata_v3.mint_authority(payer.pubkey());
    create_metadata_v3.payer(payer.pubkey());
    create_metadata_v3.update_authority(payer.pubkey(), true);
    create_metadata_v3.system_program(solana_sdk::system_program::ID);
    create_metadata_v3.rent(Some(solana_sdk::sysvar::rent::ID));
    create_metadata_v3.data(data);
    create_metadata_v3.is_mutable(true);

    instructions.push(create_metadata_v3.instruction());

    // Add mint_to instruction to mint 1 token
    instructions.push(
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &mint_keypair.pubkey(),
            &token_account,
            &payer.pubkey(),
            &[],
            1,
        )
        .map_err(|e| MetalootError::Error(e.to_string()))?
        .into(),
    );

    // Find collection metadata PDA
    let (collection_metadata_pda, _) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            collection_mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    );

    let master_edition_pda = MasterEdition::find_pda(&mint_keypair.pubkey()).0;
    let mut create_master_collection = CreateMasterEditionV3Builder::new();
    create_master_collection.edition(master_edition_pda);
    create_master_collection.mint(mint_keypair.pubkey());
    create_master_collection.update_authority(payer.pubkey());
    create_master_collection.mint_authority(payer.pubkey());
    create_master_collection.payer(payer.pubkey());
    create_master_collection.metadata(metadata_pda);
    create_master_collection.token_program(spl_token::id());
    create_master_collection.system_program(solana_sdk::system_program::ID);
    create_master_collection.rent(Some(solana_sdk::sysvar::rent::ID));
    instructions.push(create_master_collection.instruction());

    // Find master edition PDA for collection
    let master_collection_edition_pda = MasterEdition::find_pda(&collection_mint).0;

    let mut verify_collection = VerifySizedCollectionItemBuilder::new();
    verify_collection.metadata(metadata_pda);
    verify_collection.collection_authority(payer.pubkey());
    verify_collection.payer(payer.pubkey());
    verify_collection.collection_mint(collection_mint);
    verify_collection.collection(collection_metadata_pda);
    verify_collection.collection_master_edition_account(master_collection_edition_pda);
    instructions.push(verify_collection.instruction());

    // Send and confirm transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &[payer, &mint_keypair],
        recent_blockhash,
    );

    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "address": mint_keypair.pubkey().to_string()
    }))
    .into_response())
}

pub async fn verify_nft_collection(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Path((nft_mint, collection_mint)): Path<(String, String)>,
) -> Result<impl IntoResponse, MetalootError> {
    // Get RPC client and admin from state
    let (rpc_client, _, payer) = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.metaloot_program_id.clone(),
            state.admin.clone(),
        )
    };
    let rpc_client = rpc_client.as_ref();
    let payer = payer.as_ref();

    // Parse mint addresses
    let nft_mint = Pubkey::from_str(&nft_mint)
        .map_err(|e| MetalootError::Error(format!("Invalid NFT mint address: {}", e)))?;
    let collection_mint = Pubkey::from_str(&collection_mint)
        .map_err(|e| MetalootError::Error(format!("Invalid collection mint address: {}", e)))?;

    // Find PDAs
    let nft_metadata = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            nft_mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
    .0;

    let collection_metadata = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            collection_mint.as_ref(),
        ],
        &mpl_token_metadata::ID,
    )
    .0;

    // Create verify collection instruction
    let verify_collection_ix = VerifyCollection {
        metadata: nft_metadata,
        collection_authority: payer.pubkey(),
        payer: payer.pubkey(),
        collection_mint,
        collection: collection_metadata,
        collection_master_edition_account: Pubkey::find_program_address(
            &[
                b"metadata",
                mpl_token_metadata::ID.as_ref(),
                collection_mint.as_ref(),
                b"edition",
            ],
            &mpl_token_metadata::ID,
        )
        .0,
        collection_authority_record: None,
    }
    .instruction();

    // Send and confirm transaction
    let recent_blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .map_err(|e| convert_client_error(e))?;

    let transaction = Transaction::new_signed_with_payer(
        &[verify_collection_ix],
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
        "signature": signature.to_string()
    }))
    .into_response())
}

pub async fn reward_nft(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<RewardTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    println!("Rewarding NFT 0");
    // Convert amount to raw units
    let raw_amount = 1u64;
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
    println!("Rewarding NFT 1");
    // Create sender seed from player username
    let mut hasher = Sha256::new();
    hasher.update(payload.player_username.as_bytes());
    let seed = hasher.finalize();
    let recipient_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let recipient_seed_pubkey = recipient_seed.pubkey();
    println!("Rewarding NFT 2");
    // Create sender seed from developer username
    let mut hasher = Sha256::new();
    hasher.update(payload.game_id.as_bytes());
    let seed = hasher.finalize();
    let sender_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let sender_seed_pubkey = sender_seed.pubkey();
    println!("Rewarding NFT 3");
    // Derive PDAs
    let (sender_pda, _) = Pubkey::find_program_address(
        &[b"registry", sender_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );
    let (recipient_pda, _) = Pubkey::find_program_address(
        &[b"player", recipient_seed_pubkey.as_ref()],
        &metaloot_program_id,
    );
    println!("Rewarding NFT 4");
    // Get ATAs
    let sender_token_account =
        spl_associated_token_account::get_associated_token_address(&sender_pda, &mint_pubkey);
    let recipient_token_account =
        spl_associated_token_account::get_associated_token_address(&recipient_pda, &mint_pubkey);

    let mut instructions = vec![];
    println!("Rewarding NFT 5");
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
    println!("Rewarding NFT 6");
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
    println!("Rewarding NFT 7");

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
    println!("Rewarding NFT 8");
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

pub async fn transfer_nft(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<TransferTokenRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    // Convert amount to raw units
    let raw_amount = 1u64;

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
