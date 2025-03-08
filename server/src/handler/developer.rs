use axum::{
    extract::{Extension, Path},
    response::IntoResponse,
    Json,
};
use sha2::{Digest, Sha256};
use solana_sdk::{pubkey::Pubkey, signature::keypair_from_seed, signer::Signer};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::models::{
    developer::{DashboardLoginRequest, DevelopersInfo},
    error::MetalootError,
};

use super::collection::State;

pub async fn register_developer(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    // let state = state.lock().await;
    Json("200")
}

pub async fn dashboard_login(
    Extension(state): Extension<Arc<Mutex<State>>>,
    Json(payload): Json<DashboardLoginRequest>,
) -> Result<Json<Vec<DevelopersInfo>>, MetalootError> {
    let state = state.lock().await;
    let pool = &state.supabase_postgres;
    let user_info = sqlx::query_as::<_, DevelopersInfo>("SELECT * FROM subscribers")
        .fetch_all(pool)
        .await
        .map_err(|e| MetalootError::Error(e.to_string()))?;
    Ok(Json(user_info))
}
