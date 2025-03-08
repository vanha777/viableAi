use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateGameRequest {
    #[serde(skip_serializing)]
    pub developer_wallet: Option<String>,
    #[serde(skip_serializing)] 
    pub game_id: Option<String>,
    #[serde(skip_serializing)]
    pub developer_password: Option<String>,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub native_token: Option<String>,
    pub nft_collection: Option<Vec<String>>,
}

#[derive(BorshDeserialize, Debug)]
pub struct GameRegistryOnChainData {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub authority: Pubkey,
    pub native_token: Pubkey,
    pub nft_collection: Vec<Pubkey>,
    pub bump: u8,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameRegistryResponse {
    pub status: String,
    pub account: GameRegistryAccount,
}

#[derive(Debug, Serialize, Deserialize)] 
pub struct GameRegistryAccount {
    pub pubkey: String,
    pub data: GameRegistryData,
    pub lamports: u64,
    pub owner: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameRegistryData {
    pub name: String,
    pub symbol: String,
    pub game_uri: String,
    pub authority: String,
    pub native_token: String,
    pub token_symbol: String,
    pub token_name: String,
    pub token_image: String,
    pub nft_collection: Vec<String>,
    pub bump: u8,
}

