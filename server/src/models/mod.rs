use serde::{Deserialize, Serialize};

pub mod error;
pub mod game;
pub mod player;
pub mod token;
pub mod oauth;
pub mod collection;
pub mod developer;
pub mod nfts;
#[derive(Debug, Deserialize, Serialize)]
pub struct GoogleOAuthCallbackQuery {
    pub code: String,
    pub scope: String,
    pub authuser: String,
    pub hd: Option<String>,
    pub prompt: String,
    pub state: String,
}
#[derive(Debug, Deserialize, Serialize)]
pub struct GoogleOAuthTokenResponse {
    pub access_token: String,
    pub expires_in: u64,
    pub id_token: String,
    pub scope: String,
    pub token_type: String,
}
