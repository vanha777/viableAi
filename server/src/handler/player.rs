use crate::{
    models::{
        error::MetalootError,
        oauth::{AppleOAuthClaims, AppleOAuthResponse, AppleOAuthTokenResponse, SingleSignOnQuery},
        player::{
            Assets, CreatePlayerRequest, File, GetPlayerDataItemsQuery, GoogleProfile,
            PlayerDataResponse, PlayerMetaData, PlayerOnChainData, Properties, UpdatePlayerRequest,
        },
        GoogleOAuthCallbackQuery, GoogleOAuthTokenResponse,
    },
    ultilites::{
        convert_client_error, game_resgistry, generate_apple_client_secret,
        get_anchor_discriminator, get_jwt_payload, send_transaction,
    },
};
use axum::{
    extract::{Extension, Path, Query},
    response::{Html, IntoResponse, Redirect},
    Form, Json,
};
use borsh::{BorshDeserialize, BorshSerialize};
use bs58;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256}; // Add sha2 = "0.10.8" to your Cargo.toml
use solana_client::{nonblocking::rpc_client::RpcClient, rpc_request::TokenAccountsFilter};
use solana_sdk::{
    instruction::AccountMeta, program_pack::Pack, pubkey::Pubkey, signature::keypair_from_seed,
    signer::Signer, system_program,
};
use std::sync::Arc;
use tokio::sync::Mutex;

use super::collection::State;

pub async fn register_player(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<CreatePlayerRequest>,
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

    // Create player seed from username
    let mut hasher = Sha256::new();
    hasher.update(payload.user_username.as_bytes());
    let seed = hasher.finalize();
    let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    let player_seed_pubkey = player_seed.pubkey();

    // Generate PDA for the player
    let (pda, _bump) = Pubkey::find_program_address(
        &[
            b"player",                   // seed prefix
            player_seed_pubkey.as_ref(), // player's pubkey as part of seed
        ],
        &program_id,
    );

    // Build instruction data
    let discriminator = get_anchor_discriminator("create_player_account");
    let mut instruction_data = discriminator;

    instruction_data.extend_from_slice(&(payload.user_username.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.user_username.as_bytes());

    instruction_data.extend_from_slice(&(payload.uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.uri.as_bytes());

    // Create accounts vector
    let accounts = vec![
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new(pda, false),
        AccountMeta::new(player_seed_pubkey, false),
        AccountMeta::new_readonly(system_program::id(), false),
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

pub async fn update_player(
    Path(playername): Path<String>,
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<UpdatePlayerRequest>,
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

    // Create player seed from username
    let mut hasher = Sha256::new();
    hasher.update(playername.as_bytes());
    let seed = hasher.finalize();
    let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    let player_seed_pubkey = player_seed.pubkey();

    // Generate PDA for the player
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

    // Build instruction data
    let discriminator = get_anchor_discriminator("update_player_account");
    let mut instruction_data = discriminator;

    instruction_data.extend_from_slice(&(payload.new_uri.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(payload.new_uri.as_bytes());

    // Create accounts vector
    let accounts = vec![
        AccountMeta::new(payer.pubkey(), true),
        AccountMeta::new(pda, false),
        AccountMeta::new(player_seed_pubkey, false),
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

pub async fn get_player_data_items(
    Path(username): Path<String>,
    Query(query): Query<GetPlayerDataItemsQuery>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> Result<impl IntoResponse, MetalootError> {
    // Get RPC client and program ID from state
    let rpc = {
        let state = state.lock().await;
        (state.rpc_client.clone(), state.metaloot_program_id.clone())
    };

    let rpc_client = rpc.0.as_ref();
    let program_id = rpc.1;

    // Create player seed from username (same as in register_player)
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes());
    let seed = hasher.finalize();
    let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    let player_seed_pubkey = player_seed.pubkey();

    // Generate PDA for the player (same as in register_player)
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

    // Fetch the account data
    let account = rpc_client
        .get_account(&pda)
        .await
        .map_err(|e| convert_client_error(e))?;

    // Deserialize player data
    let mut data_slice = &account.data[8..];
    let player_data = PlayerOnChainData::deserialize(&mut &data_slice[..]).map_err(|e| {
        MetalootError::Error(format!(
            "Failed to deserialize account data: {}. Data length: {}",
            e,
            data_slice.len()
        ))
    })?;

    // Get token balance if token address is provided
    let token_balance = if let Some(token_address) = query.token {
        match token_address.parse::<Pubkey>() {
            Ok(token_pubkey) => {
                // get ATA
                let token_account =
                    spl_associated_token_account::get_associated_token_address(&pda, &token_pubkey);

                // get balance
                match rpc_client.get_token_account_balance(&token_account).await {
                    Ok(balance) => Some(balance.ui_amount.unwrap_or(0.0)),
                    Err(_) => None,
                }
            }
            Err(_) => None,
        }
    } else {
        None
    };

    // Get NFT count if collection address is provided
    // TokenAccountsFilter::Mint(collection_pubkey) directly won't filter NFTs by collection.
    // It filters token accounts for a specific mint address, which is not equivalent to
    // checking for all NFTs in a collection.
    // let nft_count = if let Some(collection_address) = query.collection {
    //     let collection_pubkey = collection_address
    //         .parse::<Pubkey>()
    //         .map_err(|e| MetalootError::Error(format!("Invalid collection address: {}", e)))?;

    //     // Get all token accounts owned by the player that belong to this collection
    //     let nft_accounts = rpc_client
    //         .get_token_accounts_by_owner(
    //             &pda,  // Use PDA instead of player_seed_pubkey
    //             TokenAccountsFilter::Mint(collection_pubkey),
    //         )
    //         .await
    //         .map_err(|e| convert_client_error(e))?;

    //     // Count all NFTs where balance > 0
    //     let count = nft_accounts.len() as u64;
    //     Some(count)
    // } else {
    //     None
    // };

    Ok(Json(json!({
        "status": "success",
        "account": {
            "pubkey": pda.to_string(),
            "data": {
                "username": player_data.username,
                "authority": player_data.authority.to_string(),
                "uri": player_data.uri,
                "token_balance": token_balance,
                // "nft_count": nft_count
            },
        }
    }))
    .into_response())
}

pub async fn get_player_data_items_inner(
    username: String,
    query: GetPlayerDataItemsQuery,
    rpc_client: &RpcClient,
    program_id: Pubkey,
) -> Result<PlayerDataResponse, MetalootError> {
    // Create player seed from username (same as in register_player)
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes());
    let seed = hasher.finalize();
    let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    let player_seed_pubkey = player_seed.pubkey();

    // Generate PDA for the player (same as in register_player)
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

    // Fetch the account data
    let account = rpc_client
        .get_account(&pda)
        .await
        .map_err(|e| convert_client_error(e))?;

    // Deserialize player data
    let mut data_slice = &account.data[8..];
    let player_data = PlayerOnChainData::deserialize(&mut &data_slice[..]).map_err(|e| {
        MetalootError::Error(format!(
            "Failed to deserialize account data: {}. Data length: {}",
            e,
            data_slice.len()
        ))
    })?;

    // Get token balance if token address is provided
    let token_balance = if let Some(token_address) = query.token.clone() {
        match token_address.parse::<Pubkey>() {
            Ok(token_pubkey) => {
                // get ATA
                let token_account =
                    spl_associated_token_account::get_associated_token_address(&pda, &token_pubkey);

                // get balance
                match rpc_client.get_token_account_balance(&token_account).await {
                    Ok(balance) => Some(balance.ui_amount.unwrap_or(0.0)),
                    Err(_) => None,
                }
            }
            Err(_) => None,
        }
    } else {
        None
    };

    // Get NFT count if collection address is provided
    // TokenAccountsFilter::Mint(collection_pubkey) directly won't filter NFTs by collection.
    // It filters token accounts for a specific mint address, which is not equivalent to
    // checking for all NFTs in a collection.
    // let nft_count = if let Some(collection_address) = query.collection {
    //     let collection_pubkey = collection_address
    //         .parse::<Pubkey>()
    //         .map_err(|e| MetalootError::Error(format!("Invalid collection address: {}", e)))?;

    //     // Get all token accounts owned by the player that belong to this collection
    //     let nft_accounts = rpc_client
    //         .get_token_accounts_by_owner(
    //             &pda,  // Use PDA instead of player_seed_pubkey
    //             TokenAccountsFilter::Mint(collection_pubkey),
    //         )
    //         .await
    //         .map_err(|e| convert_client_error(e))?;

    //     // Count all NFTs where balance > 0
    //     let count = nft_accounts.len() as u64;
    //     Some(count)
    // } else {
    //     None
    // };

    Ok(PlayerDataResponse {
        username,
        wallet: pda.to_string(),
        profile_picture: None,
        attributes: None,
        assets: Some(vec![Assets {
            game_id: Some(player_data.authority.to_string()),
            tokens: Some(crate::models::player::Value {
                address: query.token.unwrap_or_default(),
                balance: token_balance,
            }),
            collections: None,
        }]),
    })
}

pub async fn oauth_google(
    Query(query): Query<SingleSignOnQuery>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> impl IntoResponse {
    let (client_id, server_url) = {
        let state = state.lock().await; // Acquire the lock
        (state.google_client_id.clone(), state.server_url.clone()) // Clone the values
    }; // Lock is released here
    let client_redirect_uri = query.redirect_uri.clone();
    // Now you can use client_id and server_url without holding the lock
    let redirect_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={server_url}/oauth/google/callback&response_type=code&scope=openid%20email%20profile&state={client_redirect_uri}"
    );
    Redirect::to(redirect_url.as_str()).into_response()
}

// this is should return data as json for game developer to use
pub async fn oauth_google_callback(
    Query(query): Query<GoogleOAuthCallbackQuery>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> Result<impl IntoResponse, MetalootError> {
    // HAVE TO SAVE A SESSIONS OF THE CLIENT -> SO AFTER SUCCESS LOGIN WE CALL BACK TO THE CLIENT
    // OR MAY BE A REDIRECT URL OF THE CLIENT GAME IT SELFS
    let (client_id, client_secret, server_url) = {
        let state = state.lock().await; // Acquire the lock
        (
            state.google_client_id.clone(),
            state.google_client_secret.clone(),
            state.server_url.clone(),
            // state.metaloot_program_id.clone(),
            // state.rpc_client.clone(),
        ) // Clone the values
    }; // Lock is released here
       // let rpc_client = rpc_client.as_ref();
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", query.code.as_str()),
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("grant_type", "authorization_code"),
            (
                "redirect_uri",
                format!("{server_url}/oauth/google/callback").as_str(),
            ),
        ])
        .send()
        .await
        .map_err(|_e| {
            MetalootError::Error("Failed to identify user with google, ref 1".to_owned())
        })?;
    let res = res.json::<GoogleOAuthTokenResponse>().await.map_err(|_e| {
        MetalootError::Error("Failed to identify user with google, ref 2".to_owned())
    })?;
    let token_data = get_jwt_payload::<GoogleProfile>(&res.id_token)?;
    // check if token_data.email seeds PDA account exists ?
    // let email = token_data.email.clone(); // Unwrap the Option<String> to a String
    // let mut hasher = Sha256::new();
    // hasher.update(email.as_bytes()); // Use the String's as_bytes method
    // let seed = hasher.finalize();
    // let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    // let player_seed_pubkey = player_seed.pubkey();
    // Generate PDA for the player
    // let (pda, _bump) =
    //     Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);
    // Build Player Query and Request
    // let game_registry =
    //     game_resgistry("developer@gmail.com".to_string(), &rpc_client, program_id).await?;
    // let find_player_query = GetPlayerDataItemsQuery {
    //     token: Some(game_registry.native_token.to_string()),
    //     collection: Some(
    //         game_registry
    //             .nft_collection
    //             .iter()
    //             .map(|p| p.to_string())
    //             .collect(),
    //     ),
    // };
    let client_redirect_uri = &query.state.clone();
    let token_data_str = serde_json::to_string(&token_data).unwrap();
    let encoded_data = urlencoding::encode(&token_data_str);
    let redirect_url = format!("{}?token={}", client_redirect_uri, encoded_data);
    Ok(Redirect::to(redirect_url.as_str()).into_response())
    // Check if the account exists
    // match rpc_client.get_account(&pda).await {
    //     Ok(_) => {
    //         // if yes return token_data
    //         let mut player_data = get_player_data_items_inner(
    //             token_data.email,
    //             find_player_query,
    //             rpc_client,
    //             program_id,
    //         )
    //         .await?;
    //         player_data.profile_picture = token_data.picture;
    //         let player_data_value = match serde_json::to_value(&player_data) {
    //             Ok(x) => x,
    //             Err(_) => {
    //                 return Err(MetalootError::Error(
    //                     "Failed to serialize player data, Ref: 07".to_owned(),
    //                 ))
    //             }
    //         };
    //         let player_data_value_str = player_data_value.to_string();
    //         let encoded_data = urlencoding::encode(&player_data_value_str);
    //         let redirect_url = format!("{}?token={}", client_redirect_uri, encoded_data);
    //         Ok(Redirect::to(redirect_url.as_str()).into_response())
    //     }
    //     Err(_) => {
    //         // create a metadata file and upload to supabase
    //         let metadata_file = PlayerMetaData {
    //             name: token_data.name.clone().unwrap_or_default(),
    //             attributes: vec![None], // needed game developer to predefine game attributes
    //             properties: match token_data.picture {
    //                 Some(ref x) => Some(Properties {
    //                     category: "image".to_string(),
    //                     files: vec![File {
    //                         uri: x.clone(),
    //                         type_: "image/jpeg".to_string(),
    //                     }],
    //                 }),
    //                 None => None,
    //             },
    //         };
    //         //upload ......
    //         // Create a new player account if it doesn't exist
    //         let create_player_request = CreatePlayerRequest {
    //             user_username: token_data.email.clone(),
    //             uri: "default_uri".to_string(), // Set a default URI or modify as needed
    //         };
    //         let http_response =
    //             register_player(Extension(state.clone()), Json(create_player_request)).await;
    //         if http_response.is_err() {
    //             return Err(MetalootError::Error("Failed to register player".to_owned()));
    //         }
    //         let player_data = get_player_data_items_inner(
    //             token_data.email,
    //             find_player_query,
    //             rpc_client,
    //             program_id,
    //         )
    //         .await?;
    //         let player_data_value = match serde_json::to_value(&player_data) {
    //             Ok(x) => x,
    //             Err(_) => {
    //                 return Err(MetalootError::Error(
    //                     "Failed to serialize player data, Ref: 07".to_owned(),
    //                 ))
    //             }
    //         };
    //         let player_data_value_str = player_data_value.to_string();
    //         let encoded_data = urlencoding::encode(&player_data_value_str);
    //         let redirect_url = format!("{}?token={}", client_redirect_uri, encoded_data);
    //         Ok(Redirect::to(redirect_url.as_str()).into_response())
    //     }
    // }
}

// pub async fn oauth_google_callback(
//     Query(query): Query<GoogleOAuthCallbackQuery>,
//     Extension(state): Extension<Arc<Mutex<State>>>,
// ) -> Result<Html<String>, MetalootError> {
//     // HAVE TO SAVE A SESSIONS OF THE CLIENT -> SO AFTER SUCCESS LOGIN WE CALL BACK TO THE CLIENT
//     // OR MAY BE A REDIRECT URL OF THE CLIENT GAME IT SELFS
//     let (client_id, client_secret, server_url, program_id, rpc_client) = {
//         let state = state.lock().await; // Acquire the lock
//         (
//             state.google_client_id.clone(),
//             state.google_client_secret.clone(),
//             state.server_url.clone(),
//             state.metaloot_program_id.clone(),
//             state.rpc_client.clone(),
//         ) // Clone the values
//     }; // Lock is released here
//     let rpc_client = rpc_client.as_ref();
//     let client = reqwest::Client::new();
//     let res = client
//         .post("https://oauth2.googleapis.com/token")
//         .form(&[
//             ("code", query.code.as_str()),
//             ("client_id", client_id.as_str()),
//             ("client_secret", client_secret.as_str()),
//             ("grant_type", "authorization_code"),
//             (
//                 "redirect_uri",
//                 format!("{server_url}/oauth/google/callback").as_str(),
//             ),
//         ])
//         .send()
//         .await
//         .map_err(|_e| {
//             MetalootError::Error("Failed to identify user with google, ref 1".to_owned())
//         })?;
//     let res = res.json::<GoogleOAuthTokenResponse>().await.map_err(|_e| {
//         MetalootError::Error("Failed to identify user with google, ref 2".to_owned())
//     })?;
//     let token_data = get_jwt_payload::<GoogleProfile>(&res.id_token)?;
//     // check if token_data.email seeds PDA account exists ?
//     let email = token_data.email.clone(); // Unwrap the Option<String> to a String
//     let mut hasher = Sha256::new();
//     hasher.update(email.as_bytes()); // Use the String's as_bytes method
//     let seed = hasher.finalize();
//     let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
//     let player_seed_pubkey = player_seed.pubkey();
//     // Generate PDA for the player
//     let (pda, _bump) =
//         Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);
//     // Build Player Query and Request
//     let game_registry =
//         game_resgistry("developer@gmail.com".to_string(), &rpc_client, program_id).await?;
//     let find_player_query = GetPlayerDataItemsQuery {
//         token: Some(game_registry.native_token.to_string()),
//         collection: Some(game_registry.nft_collection.iter().map(|p| p.to_string()).collect()),
//     };
//     let client_redirect_uri = &query.state.clone();
//     // Check if the account exists
//     match rpc_client.get_account(&pda).await {
//         Ok(_) => {
//             // if yes return token_data
//             let mut player_data = get_player_data_items_inner(
//                 token_data.email,
//                 find_player_query,
//                 rpc_client,
//                 program_id,
//             )
//             .await?;
//             player_data.profile_picture = token_data.picture;
//             let player_data_value = match serde_json::to_value(&player_data) {
//                 Ok(x) => x,
//                 Err(_) => {
//                     return Err(MetalootError::Error(
//                         "Failed to serialize player data, Ref: 07".to_owned(),
//                     ))
//                 }
//             };
//             let response = format!(
//                 r#"
//                 <html>
//                     <head></head>
//                     <body>
//                         <h1>Success!</h1>
//                         <p>Your operation was successful.</p>
//                         <script>
//                                   // Check if the opener (main client window) exists
//                     if (window.opener) {{
//                         // Send the message to the opener window
//                         window.opener.postMessage({token_data}, "{client_redirect_uri}");
//                     }} else {{
//                         console.error("No opener window found.");
//                     }}
//                     // Optionally, close the popup window after sending the message
//                     window.close();
//                         </script>
//                         <button onclick="window.close()">OK</button>
//                     </body>
//                 </html>
//                 "#,
//                 token_data = player_data_value,
//                 client_redirect_uri = client_redirect_uri
//             );
//             Ok(Html(response)) // Use the variable directly
//         }
//         Err(_) => {
//             // create a metadata file and upload to supabase
//             let metadata_file = PlayerMetaData {
//                 name: token_data.name.clone().unwrap_or_default(),
//                 attributes: vec![None], // needed game developer to predefine game attributes
//                 properties: match token_data.picture {
//                     Some(ref x) => Some(Properties {
//                         category: "image".to_string(),
//                         files: vec![File {
//                             uri: x.clone(),
//                             type_: "image/jpeg".to_string(),
//                         }],
//                     }),
//                     None => None,
//                 },
//             };
//             //upload ......
//             // Create a new player account if it doesn't exist
//             let create_player_request = CreatePlayerRequest {
//                 user_username: token_data.email.clone(),
//                 uri: "default_uri".to_string(), // Set a default URI or modify as needed
//             };
//             let http_response =
//                 register_player(Extension(state.clone()), Json(create_player_request)).await;
//             if http_response.is_err() {
//                 return Err(MetalootError::Error("Failed to register player".to_owned()));
//             }
//             let player_data = get_player_data_items_inner(
//                 token_data.email,
//                 find_player_query,
//                 rpc_client,
//                 program_id,
//             )
//             .await?;
//             let player_data_value = match serde_json::to_value(&player_data) {
//                 Ok(x) => x,
//                 Err(_) => {
//                     return Err(MetalootError::Error(
//                         "Failed to serialize player data, Ref: 07".to_owned(),
//                     ))
//                 }
//             };
//             let response = format!(
//                 r#"
//                 <html>
//                     <head></head>
//                     <body>
//                         <h1>Success!</h1>
//                         <p>Your operation was successful.</p>
//                         <script>
//                                   // Check if the opener (main client window) exists
//                     if (window.opener) {{
//                         // Send the message to the opener window
//                         window.opener.postMessage({token_data}, "{client_redirect_uri}");
//                     }} else {{
//                         console.error("No opener window found.");
//                     }}
//                     // Optionally, close the popup window after sending the message
//                     window.close();
//                         </script>
//                         <button onclick="window.close()">OK</button>
//                     </body>
//                 </html>
//                 "#,
//                 token_data = player_data_value,
//                 client_redirect_uri = client_redirect_uri
//             );
//             Ok(Html(response)) // Use the variable directly
//         }
//     }
// }

pub async fn oauth_apple(
    Query(query): Query<SingleSignOnQuery>,
    Extension(state): Extension<Arc<Mutex<State>>>,
) -> impl IntoResponse {
    let (apple_client_id, server_url) = {
        let state = state.lock().await; // Acquire the lock
        (state.apple_client_id.clone(), state.server_url.clone()) // Clone the values
    }; // Lock is released here
    let client_redirect_uri = query.redirect_uri.clone();
    // Now you can use client_id and server_url without holding the lock
    let redirect_url = format!(
        "https://appleid.apple.com/auth/authorize?client_id={apple_client_id}&redirect_uri={server_url}/oauth/apple/callback&response_type=code%20id_token&state={client_redirect_uri}&scope=name%20email&response_mode=form_post"
    );
    Redirect::to(redirect_url.as_str()).into_response()
}

pub async fn oauth_apple_callback(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Form(form): Form<AppleOAuthResponse>,
) -> Result<impl IntoResponse, MetalootError> {
    let (apple_client_id, apple_team_id, apple_key_id, apple_private_key, server_url) = {
        let state = state.lock().await; // Acquire the lock
        (
            state.apple_client_id.clone(),
            state.apple_team_id.clone(),
            state.apple_key_id.clone(),
            state.apple_private_key.clone(),
            state.server_url.clone(),
        ) // Clone the values
    }; // Lock is released here

    let client_secret = generate_apple_client_secret(
        &apple_team_id,
        &apple_client_id,
        &apple_private_key,
        &apple_key_id,
    )?;

    // Add code to get token access
    let client = reqwest::Client::new();
    let token_response = client
        .post("https://appleid.apple.com/auth/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&[
            ("client_id", &apple_client_id),
            ("client_secret", &client_secret),
            ("code", &form.code),
            ("grant_type", &"authorization_code".to_string()),
            (
                "redirect_uri",
                &format!("{server_url}/oauth/apple/callback"),
            ),
        ])
        .send()
        .await
        .map_err(|e| {
            MetalootError::Error(format!("Failed to validate user, Ref: Access Token {}", e))
        })?;

    let token: AppleOAuthTokenResponse = token_response
        .json()
        .await
        .map_err(|e| MetalootError::Error(format!("Failed to parse token response: {}", e)))?;

    let data = get_jwt_payload::<AppleOAuthClaims>(&token.id_token)?;
    let token_data = GoogleProfile {
        iss: None,
        azp: None,
        aud: None,
        sub: None,
        email: data.email,
        email_verified: None,
        at_hash: None,
        name: data.name,
        picture: data.picture,
        given_name: None,
        family_name: None,
        iat: None,
        exp: None,
    };
    let client_redirect_uri = &form.state.clone();
    let token_data_str = serde_json::to_string(&token_data).unwrap();
    let encoded_data = urlencoding::encode(&token_data_str);
    let redirect_url = format!("{}?token={}", client_redirect_uri, encoded_data);
    Ok(Redirect::to(redirect_url.as_str()).into_response())
    // check if token_data.email seeds PDA account exists ?
    // let email = token_data.email.clone(); // Unwrap the Option<String> to a String
    // let mut hasher = Sha256::new();
    // hasher.update(email.as_bytes()); // Use the String's as_bytes method
    // let seed = hasher.finalize();
    // let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
    // let player_seed_pubkey = player_seed.pubkey();
    // // Generate PDA for the player
    // let (pda, _bump) =
    //     Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

    // Build Player Query and Request
    // let game_registry =
    //     game_resgistry("developer@gmail.com".to_string(), &rpc_client, program_id).await?;
    // let find_player_query = GetPlayerDataItemsQuery {
    //     token: Some(game_registry.native_token.to_string()),
    //     collection: Some(
    //         game_registry
    //             .nft_collection
    //             .iter()
    //             .map(|p| p.to_string())
    //             .collect(),
    //     ),
    // };

    // Check if the account exists
    // match rpc_client.as_ref().get_account(&pda).await {
    //     Ok(_) => {
    //         println!("Account Existed");
    //         let player_data = get_player_data_items_inner(
    //             token_data.email.clone(),
    //             find_player_query.clone(),
    //             rpc_client.as_ref(),
    //             program_id,
    //         )
    //         .await?;
    //         let player_data_value = match serde_json::to_value(&player_data) {
    //             Ok(x) => x,
    //             Err(_) => {
    //                 return Err(MetalootError::Error(
    //                     "Failed to serialize player data, Ref: 07".to_owned(),
    //                 ))
    //             }
    //         };
    //         let response = format!(
    //             r#"
    //             <html>
    //                 <head></head>
    //                 <body>
    //                     <h1>Success!</h1>
    //                     <p>Your operation was successful.</p>
    //                     <script>
    //                               // Check if the opener (main client window) exists
    //                 if (window.opener) {{
    //                     // Send the message to the opener window
    //                     window.opener.postMessage({token_data}, "{client_redirect_uri}");
    //                 }} else {{
    //                     console.error("No opener window found.");
    //                 }}
    //                 // Optionally, close the popup window after sending the message
    //                 window.close();
    //                     </script>
    //                     <button onclick="window.close()">OK</button>
    //                 </body>
    //             </html>
    //             "#,
    //             token_data = player_data_value,
    //             client_redirect_uri = client_redirect_uri
    //         );
    //         Ok(Html(response)) // Use the variable directly
    //     }
    //     Err(_) => {
    //         println!("Account Not Existed");
    //         // create a metadata file and upload to supabase
    //         let metadata_file = PlayerMetaData {
    //             name: token_data.email.clone(),
    //             attributes: vec![None], // needed game developer to predefine game attributes
    //             properties: None,
    //         };
    //         //upload ......
    //         // Create a new player account if it doesn't exist
    //         let create_player_request = CreatePlayerRequest {
    //             user_username: token_data.email.clone(),
    //             uri: "default_uri".to_string(), // Set a default URI or modify as needed
    //         };
    //         let http_response =
    //             register_player(Extension(state.clone()), Json(create_player_request)).await;
    //         if http_response.is_err() {
    //             return Err(MetalootError::Error("Failed to register player".to_owned()));
    //         }
    //         let player_data = get_player_data_items_inner(
    //             token_data.email,
    //             find_player_query,
    //             rpc_client.as_ref(),
    //             program_id,
    //         )
    //         .await?;
    //         let player_data_value = match serde_json::to_value(&player_data) {
    //             Ok(x) => x,
    //             Err(_) => {
    //                 return Err(MetalootError::Error(
    //                     "Failed to serialize player data, Ref: 07".to_owned(),
    //                 ))
    //             }
    //         };
    //         let response = format!(
    //             r#"
    //             <html>
    //                 <head></head>
    //                 <body>
    //                     <h1>Success!</h1>
    //                     <p>Your operation was successful.</p>
    //                     <script>
    //                               // Check if the opener (main client window) exists
    //                 if (window.opener) {{
    //                     // Send the message to the opener window
    //                     window.opener.postMessage({token_data}, "{client_redirect_uri}");
    //                 }} else {{
    //                     console.error("No opener window found.");
    //                 }}
    //                 // Optionally, close the popup window after sending the message
    //                 window.close();
    //                     </script>
    //                     <button onclick="window.close()">OK</button>
    //                 </body>
    //             </html>
    //             "#,
    //             token_data = player_data_value,
    //             client_redirect_uri = client_redirect_uri
    //         );
    //         Ok(Html(response)) // Use the variable directly
    //     }
    // }
}

// pub async fn oauth_apple_callback(
//     Extension(state): Extension<Arc<Mutex<State>>>,
//     Form(form): Form<AppleOAuthResponse>,
// ) -> Result<impl IntoResponse, MetalootError> {
//     let (
//         apple_client_id,
//         apple_team_id,
//         apple_key_id,
//         apple_private_key,
//         server_url,
//         rpc_client,
//         program_id,
//     ) = {
//         let state = state.lock().await; // Acquire the lock
//         (
//             state.apple_client_id.clone(),
//             state.apple_team_id.clone(),
//             state.apple_key_id.clone(),
//             state.apple_private_key.clone(),
//             state.server_url.clone(),
//             state.rpc_client.clone(),
//             state.metaloot_program_id.clone(),
//         ) // Clone the values
//     }; // Lock is released here

//     let client_secret = generate_apple_client_secret(
//         &apple_team_id,
//         &apple_client_id,
//         &apple_private_key,
//         &apple_key_id,
//     )?;

//     // Add code to get token access
//     let client = reqwest::Client::new();
//     let token_response = client
//         .post("https://appleid.apple.com/auth/token")
//         .header("Content-Type", "application/x-www-form-urlencoded")
//         .form(&[
//             ("client_id", &apple_client_id),
//             ("client_secret", &client_secret),
//             ("code", &form.code),
//             ("grant_type", &"authorization_code".to_string()),
//             (
//                 "redirect_uri",
//                 &format!("{server_url}/oauth/apple/callback"),
//             ),
//         ])
//         .send()
//         .await
//         .map_err(|e| {
//             MetalootError::Error(format!("Failed to validate user, Ref: Access Token {}", e))
//         })?;

//     let token: AppleOAuthTokenResponse = token_response
//         .json()
//         .await
//         .map_err(|e| MetalootError::Error(format!("Failed to parse token response: {}", e)))?;

//     let token_data = get_jwt_payload::<AppleOAuthClaims>(&token.id_token)?;

//     // check if token_data.email seeds PDA account exists ?
//     let email = token_data.email.clone(); // Unwrap the Option<String> to a String
//     let mut hasher = Sha256::new();
//     hasher.update(email.as_bytes()); // Use the String's as_bytes method
//     let seed = hasher.finalize();
//     let player_seed = keypair_from_seed(&seed).map_err(|e| MetalootError::Error(e.to_string()))?;
//     let player_seed_pubkey = player_seed.pubkey();
//     // Generate PDA for the player
//     let (pda, _bump) =
//         Pubkey::find_program_address(&[b"player", player_seed_pubkey.as_ref()], &program_id);

//     // Build Player Query and Request
//     let game_registry =
//         game_resgistry("developer@gmail.com".to_string(), &rpc_client, program_id).await?;
//     let find_player_query = GetPlayerDataItemsQuery {
//         token: Some(game_registry.native_token.to_string()),
//         collection: Some(
//             game_registry
//                 .nft_collection
//                 .iter()
//                 .map(|p| p.to_string())
//                 .collect(),
//         ),
//     };
//     let client_redirect_uri = &form.state.clone();
//     // Check if the account exists
//     match rpc_client.as_ref().get_account(&pda).await {
//         Ok(_) => {
//             println!("Account Existed");
//             let player_data = get_player_data_items_inner(
//                 token_data.email.clone(),
//                 find_player_query.clone(),
//                 rpc_client.as_ref(),
//                 program_id,
//             )
//             .await?;
//             let player_data_value = match serde_json::to_value(&player_data) {
//                 Ok(x) => x,
//                 Err(_) => {
//                     return Err(MetalootError::Error(
//                         "Failed to serialize player data, Ref: 07".to_owned(),
//                     ))
//                 }
//             };
//             let response = format!(
//                 r#"
//                 <html>
//                     <head></head>
//                     <body>
//                         <h1>Success!</h1>
//                         <p>Your operation was successful.</p>
//                         <script>
//                                   // Check if the opener (main client window) exists
//                     if (window.opener) {{
//                         // Send the message to the opener window
//                         window.opener.postMessage({token_data}, "{client_redirect_uri}");
//                     }} else {{
//                         console.error("No opener window found.");
//                     }}
//                     // Optionally, close the popup window after sending the message
//                     window.close();
//                         </script>
//                         <button onclick="window.close()">OK</button>
//                     </body>
//                 </html>
//                 "#,
//                 token_data = player_data_value,
//                 client_redirect_uri = client_redirect_uri
//             );
//             Ok(Html(response)) // Use the variable directly
//         }
//         Err(_) => {
//             println!("Account Not Existed");
//             // create a metadata file and upload to supabase
//             let metadata_file = PlayerMetaData {
//                 name: token_data.email.clone(),
//                 attributes: vec![None], // needed game developer to predefine game attributes
//                 properties: None,
//             };
//             //upload ......
//             // Create a new player account if it doesn't exist
//             let create_player_request = CreatePlayerRequest {
//                 user_username: token_data.email.clone(),
//                 uri: "default_uri".to_string(), // Set a default URI or modify as needed
//             };
//             let http_response =
//                 register_player(Extension(state.clone()), Json(create_player_request)).await;
//             if http_response.is_err() {
//                 return Err(MetalootError::Error("Failed to register player".to_owned()));
//             }
//             let player_data = get_player_data_items_inner(
//                 token_data.email,
//                 find_player_query,
//                 rpc_client.as_ref(),
//                 program_id,
//             )
//             .await?;
//             let player_data_value = match serde_json::to_value(&player_data) {
//                 Ok(x) => x,
//                 Err(_) => {
//                     return Err(MetalootError::Error(
//                         "Failed to serialize player data, Ref: 07".to_owned(),
//                     ))
//                 }
//             };
//             let response = format!(
//                 r#"
//                 <html>
//                     <head></head>
//                     <body>
//                         <h1>Success!</h1>
//                         <p>Your operation was successful.</p>
//                         <script>
//                                   // Check if the opener (main client window) exists
//                     if (window.opener) {{
//                         // Send the message to the opener window
//                         window.opener.postMessage({token_data}, "{client_redirect_uri}");
//                     }} else {{
//                         console.error("No opener window found.");
//                     }}
//                     // Optionally, close the popup window after sending the message
//                     window.close();
//                         </script>
//                         <button onclick="window.close()">OK</button>
//                     </body>
//                 </html>
//                 "#,
//                 token_data = player_data_value,
//                 client_redirect_uri = client_redirect_uri
//             );
//             Ok(Html(response)) // Use the variable directly
//         }
//     }
// }

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
                "showFungible":true,
                // "showInscription":true
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
