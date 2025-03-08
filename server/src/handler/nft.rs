use axum::{
    extract::{Extension, Path, Query},
    response::IntoResponse,
    Json,
};
use reqwest;
use serde_json::json;
use sha2::{Digest, Sha256};
use solana_client::nonblocking::rpc_client::{self, RpcClient};
use std::{str::FromStr, sync::Arc};
use tokio::sync::Mutex; // Add sha2 = "0.10.8" to your Cargo.toml

use crate::{
    models::{
        collection::{CreateCollectionRequest, CreateNFTRequest},
        error::MetalootError,
        nfts::{NFTRawResponse, NFTResponse},
        token::RewardTokenRequest,
    },
    AuthError, Claims,
};

use super::collection::State;

pub async fn get_nfts(
    claims: Claims,
    Extension(state): Extension<Arc<Mutex<State>>>,
    Path(collection_address): Path<String>,
) -> Result<impl IntoResponse, MetalootError> {
    // Get RPC client and admin from state
    let rpc_url = {
        let state = state.lock().await;
        state.rpc_url.clone()
    };
    // Prepare request body
    let request_body = json!({
        "jsonrpc": "2.0",
        "id": "text",
        "method": "searchAssets",
        "params": {
            "page": 1,
            "limit": 20,
            "sortBy": {
                "sortBy": "created",
                "sortDirection": "desc"
            },
            "compressed": false,
            "compressible": false,
            "grouping": [
                "collection",
                    collection_address
            ],
            "options": {
                "showUnverifiedCollections": false,
                "showCollectionMetadata": false,
                "showGrandTotal": false,
                "showNativeBalance": false,
                "showInscription": false,
                "showZeroBalance": false
            }
        }
    });
    // Make POST request to RPC URL
    let client = reqwest::Client::new();
    let response = client
        .post(&rpc_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| MetalootError::Error(e.to_string()))?;
    // Parse response
    let nfts = response
        .json::<NFTRawResponse>()
        .await
        .map_err(|e| MetalootError::Error(e.to_string()))?;
    let res = nfts
        .result
        .items
        .iter()
        .map(|nft| match nft {
            Some(nft) => Some(NFTResponse {
                address: nft.id.clone(),
                name: nft.content.metadata.name.clone(),
                description: nft.content.metadata.description.clone(),
                symbol: nft.content.metadata.symbol.clone(),
                image: nft.content.links.image.clone(),
                external_link: nft.content.links.external_url.clone(),
                owner: nft.ownership.owner.clone(),
                supply: nft.token_info.supply,
                decimals: nft.token_info.decimals,
            }),
            _ => None,
        })
        .collect::<Vec<Option<NFTResponse>>>();

    Ok(Json(res))
}
