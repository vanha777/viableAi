use axum::response::IntoResponse;
use base64::{alphabet::URL_SAFE, engine::GeneralPurpose, Engine};
use borsh::BorshDeserialize;
use mpl_token_metadata::accounts::Metadata;
use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID;
use sha2::{Digest, Sha256}; // Add sha2 = "0.10.8" to your Cargo.toml
use solana_client::{
    client_error::{ClientError, ClientErrorKind},
    nonblocking::rpc_client::RpcClient,
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{keypair_from_seed, Keypair},
    signer::Signer,
    transaction::Transaction,
};
use std::{
    str::FromStr,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use crate::models::{
    error::MetalootError,
    game::{GameRegistryAccount, GameRegistryData, GameRegistryOnChainData, GameRegistryResponse},
    oauth::AppleClaims,
    player::GoogleProfile,
    token::TokenMetadataOnChain,
};

use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};

pub async fn send_transaction(
    rpc_client: &RpcClient,
    program_id: Pubkey,
    accounts: Vec<AccountMeta>,
    instruction_data: Vec<u8>,
    payer: &Keypair,
) -> Result<String, ClientError> {
    let instruction = Instruction {
        program_id,
        accounts,
        data: instruction_data,
    };
    let recent_blockhash = rpc_client.get_latest_blockhash().await?;
    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&payer.pubkey()),
        &[payer],
        recent_blockhash,
    );
    let signature = rpc_client
        .send_and_confirm_transaction(&transaction)
        .await?;
    Ok(signature.to_string())
}

pub fn get_anchor_discriminator(name: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(format!("global:{}", name).as_bytes());
    let result = hasher.finalize();
    result[..8].to_vec() // Take first 8 bytes
}

pub fn convert_client_error(error: ClientError) -> MetalootError {
    match error.kind {
        ClientErrorKind::TransactionError(tx_error) => {
            MetalootError::TransactionError(format!("{:?}", tx_error))
        }
        ClientErrorKind::RpcError(rpc_error) => MetalootError::RpcError(format!("{:?}", rpc_error)),
        ClientErrorKind::SigningError(msg) => MetalootError::SigningError(format!("{:?}", msg)),
        ClientErrorKind::SerdeJson(msg) => MetalootError::SerializationError(format!("{:?}", msg)),
        _ => MetalootError::UnknownError(format!("Unexpected error: {:?}", error)),
    }
}

pub fn get_jwt_payload<T: serde::de::DeserializeOwned>(jwt: &str) -> Result<T, MetalootError> {
    // 1. Split the JWT by '.'
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() != 3 {
        return Err(MetalootError::Error(
            "Invalid JWT format. Expected 3 parts.".to_owned(),
        ));
    }

    // 2. The payload is the second segment
    let payload_b64 = parts[1];

    // 3. Decode base64 (URL-safe)
    let engine = GeneralPurpose::new(&URL_SAFE, base64::engine::general_purpose::NO_PAD);
    let payload_bytes = engine
        .decode(payload_b64)
        .map_err(|e| MetalootError::Error(e.to_string()))?;

    // 4. Convert bytes to a UTF-8 string
    let payload_json =
        String::from_utf8(payload_bytes).map_err(|e| MetalootError::Error(e.to_string()))?;

    // 5. Parse the payload into the specified struct
    let profile: T =
        serde_json::from_str(&payload_json).map_err(|e| MetalootError::Error(e.to_string()))?;

    Ok(profile)
}

pub fn generate_apple_client_secret(
    team_id: &str,
    client_id: &str,
    private_key: &str,
    key_id: &str,
) -> Result<String, MetalootError> {
    let private_key = EncodingKey::from_ec_pem(private_key.as_bytes())
        .map_err(|e| MetalootError::Error(format!("Failed to parse apple client_secret{}", e)))?;

    let mut header = Header::new(Algorithm::ES256);
    header.kid = Some(key_id.to_string());

    let claims = AppleClaims {
        iss: team_id.to_string(),
        iat: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        exp: (SystemTime::now() + Duration::from_secs(15777000))
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        aud: "https://appleid.apple.com".to_string(),
        sub: client_id.to_string(),
    };

    let client_secret =
        encode(&header, &claims, &private_key).map_err(|e| MetalootError::Error(e.to_string()))?;
    Ok(client_secret)
}

pub async fn game_resgistry(
    username: String,
    rpc_client: &RpcClient,
    program_id: Pubkey,
) -> Result<GameRegistryOnChainData, MetalootError> {
    // Create the same entry_seed_pubkey as in create_game
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes()); // Assuming password isn't needed for lookup
    let seed = hasher.finalize();
    let entry_seed = keypair_from_seed(&seed).expect("Failed to create keypair from seed");
    let entry_seed_pubkey = entry_seed.pubkey();

    // Generate the same PDA
    let (pda, _bump) =
        Pubkey::find_program_address(&[b"registry", entry_seed_pubkey.as_ref()], &program_id);

    // Fetch the account data
    let account = rpc_client
        .get_account(&pda)
        .await
        .map_err(|e| convert_client_error(e))?;

    // Create a cursor to read only the data we need
    let mut data_slice = &account.data[8..];
    let game_registry: GameRegistryOnChainData =
        GameRegistryOnChainData::deserialize(&mut &data_slice[..]).map_err(|e| {
            println!("Deserialization error details: {:?}", e);
            MetalootError::Error(format!(
                "Failed to deserialize account data: {}. Data length: {}",
                e,
                data_slice.len()
            ))
        })?;

    // Return the structured data including all fields
    Ok(game_registry)
}

// This is the standard Metaplex Token Metadata program ID

/// Derive the PDA for the metadata account of a given mint.
pub fn find_metadata_pda(mint: &Pubkey) -> Pubkey {
    let (pda, _bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            &TOKEN_METADATA_PROGRAM_ID.as_ref(),
            mint.as_ref(),
        ],
        &TOKEN_METADATA_PROGRAM_ID,
    );
    pda
}

/// Fetch and deserialize the metadata for a given mint.
pub async fn fetch_metadata(
    rpc_client: &RpcClient,
    mint: &Pubkey,
) -> Result<Metadata, MetalootError> {
    let metadata_pda = find_metadata_pda(mint);
    let account = rpc_client
        .get_account(&metadata_pda)
        .await
        .map_err(|e| convert_client_error(e))?;
    let metadata = Metadata::safe_deserialize(&account.data)
        .map_err(|e| MetalootError::Error(format!("Failed to deserialize metadata: {}", e)))?;
    Ok(metadata)
}

/// Fetch and parse the JSON content from the token URI.
pub async fn fetch_and_parse_token_uri(
    token_uri: &str,
) -> Result<TokenMetadataOnChain, MetalootError> {
    let client = reqwest::Client::new();
    // Make an HTTP GET request to the token URI.
    let response = client.get(token_uri).send().await.map_err(|e| {
        MetalootError::Error(format!("Failed to send request to {}: {}", token_uri, e))
    })?;

    // Check if the response status is success.
    if !response.status().is_success() {
        return Err(MetalootError::Error(format!(
            "Non-success status code {} received from {}",
            response.status(),
            token_uri
        )));
    }

    // Parse the response body as JSON.
    let json_value: TokenMetadataOnChain =
        response.json::<TokenMetadataOnChain>().await.map_err(|e| {
            MetalootError::Error(format!("Failed to parse JSON from {}: {}", token_uri, e))
        })?;

    Ok(json_value)
}

pub async fn get_game_resgistry_ultilities(
    rpc_client: &RpcClient,
    pda: Pubkey,
) -> Result<GameRegistryResponse, MetalootError> {
    // Fetch the account data
    let account = rpc_client.get_account(&pda).await.map_err(|_e| {
        MetalootError::Error("Game registry does not exist for this developer".to_string())
    })?;

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
    // Fetch the token metadata
    let mut token_name = String::new();
    let mut token_symbol = String::new();
    let mut token_metadata_image = String::new();

    match game_registry.native_token {
        x if x == Pubkey::default() => {}
        _ => {
            // Fetch the token metadata
            let token_metadata = fetch_metadata(&rpc_client, &game_registry.native_token).await?;
            token_name = token_metadata.name.trim_end_matches('\0').to_string();
            token_symbol = token_metadata.symbol.trim_end_matches('\0').to_string();
            token_metadata_image = fetch_and_parse_token_uri(&token_metadata.uri)
                .await?
                .image
                .trim_end_matches('\0')
                .to_string();
        }
    };

    // match game_registry.nft_collection {
    //     x if x == Pubkey::default() => {}
    //     _ => {}
    // };

    // Convert the nft_collection Vec<Pubkey> to Vec<String>
    let nft_collection_strings: Vec<String> = game_registry
        .nft_collection
        .iter()
        .map(|pubkey| pubkey.to_string())
        .collect();
    // Return the structured data including all fields
    Ok(GameRegistryResponse {
        status: "success".to_string(),
        account: GameRegistryAccount {
            pubkey: pda.to_string(),
            data: GameRegistryData {
                name: game_registry.name,
                symbol: game_registry.symbol,
                game_uri: game_registry.uri,
                authority: game_registry.authority.to_string(),
                native_token: game_registry.native_token.to_string(),
                token_symbol,
                token_name,
                token_image: token_metadata_image,
                nft_collection: nft_collection_strings,
                bump: game_registry.bump,
            },
            lamports: account.lamports,
            owner: account.owner.to_string(),
        },
    })
}
