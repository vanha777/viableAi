use axum::{
    extract::{Extension, Path},
    response::IntoResponse,
    Json,
};
use borsh::BorshDeserialize;
use serde_json::{json, Value};
use solana_client::{
    client_error::{ClientError, ClientErrorKind},
    nonblocking::rpc_client::RpcClient,
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{keypair_from_seed, read_keypair_file, Keypair},
    signer::Signer,
    system_program,
    transaction::Transaction,
};
use std::{env, fs, rc::Rc, sync::Arc};
use tokio::sync::Mutex;

use crate::{
    models::{
        collection::CollectionResponse, error::MetalootError, game::{CreateGameRequest, GameRegistryOnChainData}
    },
    ultilites::{
        convert_client_error, fetch_and_parse_token_uri, fetch_metadata, get_anchor_discriminator,
        send_transaction,
    },
};

use super::collection::State;
use sha2::{Digest, Sha256}; // Add sha2 = "0.10.8" to your Cargo.toml

pub async fn get_all_games_registry(
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> impl IntoResponse {
    // let state = state.lock().await;
    Json("200")
}

pub async fn get_game_resgistry(
    Path(username): Path<String>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> Result<impl IntoResponse, MetalootError> {
    println!("debug 0");
    let rpc = {
        let state = state.lock().await;
        (state.rpc_client.clone(), state.metaloot_program_id.clone())
    };

    let rpc_client = rpc.0.as_ref();
    let program_id = rpc.1;
    println!("debug 1");
    // Create the same entry_seed_pubkey as in create_game
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes()); // Assuming password isn't needed for lookup
    let seed = hasher.finalize();
    let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let entry_seed_pubkey = entry_seed.pubkey();
    println!("debug 2");
    // Generate the same PDA
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], &program_id);
    println!("debug 3");
    // Fetch the account data
    let account = rpc_client
        .get_account(&pda)
        .await
        .map_err(|e| convert_client_error(e))?;

    // Create a cursor to read only the data we need
    let mut data_slice = &account.data[8..];
    let game_registry =
        GameRegistryOnChainData::deserialize(&mut &data_slice[..]).map_err(|e| {
            println!("Deserialization error details: {:?}", e);
            MetalootError::Error(format!(
                "Failed to deserialize account data: {}. Data length: {}",
                e,
                data_slice.len()
            ))
        })?;
    println!("debug 4");
    // Fetch the token metadata
    let mut token_name = String::new();
    let mut token_symbol = String::new();
    let mut token_metadata_image = String::new();
    let mut token_uri = String::new();

    match game_registry.native_token {
        x if x == Pubkey::default() => {}
        _ => {
            println!("debug 5");
            // Fetch the token metadata
            let token_metadata = fetch_metadata(&rpc_client, &game_registry.native_token).await?;
            token_name = token_metadata.name.trim_end_matches('\0').to_string();
            token_symbol = token_metadata.symbol.trim_end_matches('\0').to_string();
            token_metadata_image = fetch_and_parse_token_uri(&token_metadata.uri)
                .await?
                .image
                .trim_end_matches('\0')
                .to_string();
            token_uri = token_metadata.uri.trim_end_matches('\0').to_string();
        }
    };

    // match game_registry.nft_collection {
    //     x if x == Pubkey::default() => {}
    //     _ => {}
    // };

    // Convert the nft_collection Vec<Pubkey> to Vec<String>
    let nft_collection_strings: Vec<CollectionResponse> = futures::future::join_all(
        game_registry
            .nft_collection
            .iter()
            .map(|pubkey| async move {
                let metadata = fetch_metadata(&rpc_client, pubkey).await?;
                Ok(CollectionResponse {
                    address: pubkey.to_string(),
                    uri: metadata.uri.trim_end_matches('\0').to_string(),
                })
            }),
    )
    .await
    .into_iter()
    .filter_map(Result::<CollectionResponse, MetalootError>::ok)
    .collect::<Vec<CollectionResponse>>();
    println!("debug 6");
    // Return the structured data including all fields
    Ok(Json(json!({
        "status": "success",
        "account": {
            "pubkey": pda.to_string(),
            "data": {
                "token_uri": token_uri,
                "name": game_registry.name,
                "symbol": game_registry.symbol,
                "game_uri": game_registry.uri,
                "authority": game_registry.authority.to_string(),
                "native_token": game_registry.native_token.to_string(),
                "token_symbol": token_symbol,
                // "token_uri": token_metadata.uri.trim_end_matches('\0').to_string(),
                "token_name": token_name,
                "token_image": token_metadata_image,
                "nft_collection": nft_collection_strings,
                "bump": game_registry.bump,

            },
            "lamports": account.lamports,
            "owner": account.owner.to_string(),
        }
    })))
}

pub async fn create_game(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreateGameRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    let rpc = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.metaloot_program_id.clone(),
            state.admin.clone(),
        )
    }; // Lock is released here
       // Initialize RPC client
    let rpc_client = rpc.0.as_ref();
    let program_id = rpc.1;
    let payer = rpc.2.as_ref();

    // Create a new keypair for the entry seeds
    // If user login with wallet, use wallet address as entry seed
    // If user login with username+password, create publickey from combined hash
    let entry_seed_pubkey = match payload.developer_wallet {
        Some(x) => Pubkey::from_str_const(&x),
        None => match payload.game_id {
            Some(username) => {
                let mut hasher = Sha256::new();
                // Combine username and password for the seed
                hasher.update(username.as_bytes());
                let seed = hasher.finalize();
                let entry_seed =
                    keypair_from_seed(&seed).expect("Failed to create keypair from seed");
                entry_seed.pubkey()
            }
            _ => {
                return Err(MetalootError::Error(
                    "Either user_wallet or both username and password must be provided".to_string(),
                ));
            }
        },
    };
    // Generate PDA for the game studio - just to pass anchor validations - anchor will create the PDA with specific bumps
    let (pda, bump) = Pubkey::find_program_address(
        &[
            b"registry",                // seed prefix
            entry_seed_pubkey.as_ref(), // using payer's pubkey as part of the seed
        ],
        &program_id,
    );

    // Check if account already exists
    match rpc_client.get_account(&pda).await {
        Ok(_) => {
            return Err(MetalootError::Error(
                "Game registry already exists for this developer".to_string(),
            ));
        }
        _ => (),
    };
    // Calculate discriminator
    let discriminator = get_anchor_discriminator("create_game_studio");
    let mut instruction_data = discriminator;
    // For strings, first add the length (4 bytes) then the string bytes
    instruction_data.extend_from_slice(&(payload.name.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.name.as_bytes());

    instruction_data.extend_from_slice(&(payload.symbol.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.symbol.as_bytes());

    instruction_data.extend_from_slice(&(payload.uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.uri.as_bytes());
    // Pubkeys are just 32 bytes each
    instruction_data.extend_from_slice(&payer.pubkey().to_bytes());

    match payload.native_token {
        Some(x) => {
            if let Err(_) = std::panic::catch_unwind(|| Pubkey::from_str_const(&x)) {
                return Err(MetalootError::Error(
                    "Invalid native_token format: must be a valid Solana public key".to_string(),
                ));
            }
            instruction_data.extend_from_slice(&Pubkey::from_str_const(&x).to_bytes());
        }
        None => {
            instruction_data.extend_from_slice(&Pubkey::default().to_bytes());
        }
    }

    match payload.nft_collection {
        Some(collections) => {
            if collections.len() > 5 {
                return Err(MetalootError::Error(
                    "nft_collection can contain at most 5 collection addresses".to_string(),
                ));
            }

            // Add the length of the vector first
            instruction_data.extend_from_slice(&(collections.len() as u32).to_le_bytes());

            // Process each collection address
            for collection in collections {
                if let Err(_) = std::panic::catch_unwind(|| Pubkey::from_str_const(&collection)) {
                    return Err(MetalootError::Error(
                        "Invalid nft_collection format: must be a valid Solana public key"
                            .to_string(),
                    ));
                }
                // Add each Pubkey as 32 bytes
                instruction_data.extend_from_slice(&Pubkey::from_str_const(&collection).to_bytes());
            }
        }
        None => {
            // If no collections, write 0 as the vector length
            instruction_data.extend_from_slice(&(1u32).to_le_bytes());
            instruction_data.extend_from_slice(&Pubkey::default().to_bytes());
        }
    }

    // Create accounts vector
    let accounts = vec![
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new(pda, false),
        AccountMeta::new(entry_seed_pubkey, false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];

    // Send and confirm transaction
    let signature = send_transaction(&rpc_client, program_id, accounts, instruction_data, payer)
        .await
        .map_err(|e| convert_client_error(e))?;
    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string(),
        "address": pda.to_string()
    }))
    .into_response())
}

pub async fn update_game(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreateGameRequest>,
) -> Result<impl IntoResponse, MetalootError> {
    let rpc = {
        let state = state.lock().await;
        (
            state.rpc_client.clone(),
            state.metaloot_program_id.clone(),
            state.admin.clone(),
        )
    };

    let rpc_client = rpc.0.as_ref();
    let program_id = rpc.1;
    let payer = rpc.2.as_ref();

    // Get the entry_seed_pubkey the same way as in create_game
    let entry_seed_pubkey = match payload.developer_wallet {
        Some(x) => Pubkey::from_str_const(&x),
        None => match payload.game_id {
            Some(username) => {
                let mut hasher = Sha256::new();
                hasher.update(username.as_bytes());
                let seed = hasher.finalize();
                let entry_seed =
                    keypair_from_seed(&seed).expect("Failed to create keypair from seed");
                entry_seed.pubkey()
            }
            _ => {
                return Err(MetalootError::Error(
                    "Either user_wallet or both username and password must be provided".to_string(),
                ));
            }
        },
    };

    // Find the PDA - same as in create_game
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], &program_id);

    // Calculate discriminator for update instruction
    let discriminator = get_anchor_discriminator("update_game_studio");
    let mut instruction_data = discriminator;

    // Pack the instruction data same as create_game
    instruction_data.extend_from_slice(&(payload.name.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.name.as_bytes());

    instruction_data.extend_from_slice(&(payload.symbol.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.symbol.as_bytes());

    instruction_data.extend_from_slice(&(payload.uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.uri.as_bytes());

    // Handle optional fields
    match payload.native_token {
        Some(x) => {
            if let Err(_) = std::panic::catch_unwind(|| Pubkey::from_str_const(&x)) {
                return Err(MetalootError::Error(
                    "Invalid native_token format: must be a valid Solana public key".to_string(),
                ));
            }
            instruction_data.extend_from_slice(&Pubkey::from_str_const(&x).to_bytes());
        }
        None => {
            instruction_data.extend_from_slice(&Pubkey::default().to_bytes());
        }
    }
    match payload.nft_collection {
        Some(collections) => {
            if collections.len() > 5 {
                return Err(MetalootError::Error(
                    "nft_collection can contain at most 5 collection addresses".to_string(),
                ));
            }

            // Add the length of the vector first
            instruction_data.extend_from_slice(&(collections.len() as u32).to_le_bytes());

            // Process each collection address
            for collection in collections {
                if let Err(_) = std::panic::catch_unwind(|| Pubkey::from_str_const(&collection)) {
                    return Err(MetalootError::Error(
                        "Invalid nft_collection format: must be a valid Solana public key"
                            .to_string(),
                    ));
                }
                // Add each Pubkey as 32 bytes
                instruction_data.extend_from_slice(&Pubkey::from_str_const(&collection).to_bytes());
            }
        }
        None => {
            // If no collections, write 0 as the vector length
            instruction_data.extend_from_slice(&(1u32).to_le_bytes());
            instruction_data.extend_from_slice(&Pubkey::default().to_bytes());
        }
    }

    // Create accounts vector - similar to create_game but might not need system_program
    let accounts = vec![
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new(pda, false),
        AccountMeta::new(entry_seed_pubkey, false),
    ];

    // Send and confirm transaction
    let signature = send_transaction(&rpc_client, program_id, accounts, instruction_data, payer)
        .await
        .map_err(|e| convert_client_error(e))?;

    Ok(Json(json!({
        "status": "success",
        "signature": signature.to_string()
    }))
    .into_response())
}

pub async fn create_tokenomic(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // let state = state.lock().await;
    Json("200")
}

pub async fn create_collection(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // let state = state.lock().await;
    Json("200")
}

pub async fn create_nft(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // let state = state.lock().await;
    Json("200")
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
        Pubkey::find_program_address(&[b"registry", player_seed_pubkey.as_ref()], &program_id);

    // Create the request body
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": "text",
        "method": "getAssetsByOwner",
        "params": {
            "ownerAddress": pda.to_string(),
            "options": {
                "showCollectionMetadata": true,
                "showFungible":true,
                // "showInscription":true
            }
          },
          "sortBy":{
            "sortDirection":"desc",
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
