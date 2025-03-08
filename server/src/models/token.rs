use serde::Deserialize;
use solana_sdk::pubkey::Pubkey;

#[derive(Debug, Deserialize)]
pub struct CreateTokenRequest {
    pub game_id: String,
    pub metadata: TokenMetadata,
}

#[derive(Debug, Deserialize)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

#[derive(Debug, Deserialize)]
pub struct MintTokenRequest {
    pub game_id: String,
    pub amount: u64,
    pub token: String,
}

#[derive(Deserialize)]
pub struct RewardTokenRequest {
    pub game_id: String,
    pub player_username: String,
    pub token: String,
    pub amount: u64,
}

#[derive(Debug, Deserialize)]
pub struct TokenMetadataOnChain {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image: String,
}