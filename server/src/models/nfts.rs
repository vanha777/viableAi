use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct NFT {
    pub interface: String,
    pub id: String,
    pub content: NFTContent,
    pub ownership: NFTOwnership,
    pub token_info: NFTTokenInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTTokenInfo {
    pub supply: i32,
    pub decimals: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTOwnership {
    pub owner: String,
    pub ownership_model: String,
    pub delegated: bool,
    pub frozen: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTContent {
    pub metadata: NFTMetadata,
    pub links: NFTLink,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTLink {
    pub image: String,
    pub external_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTMetadata {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub attributes: Vec<Option<NFTAttribute>>,
    pub token_standard: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTAttribute {
    pub value: String,
    pub trait_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTRawResponse {
    pub jsonrpc: String,
    pub result: NFTRawResponseResult,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTRawResponseResult {
    pub total: i32,
    pub limit: i32,
    pub page: i32,
    pub items: Vec<Option<NFT>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFTResponse {
    pub address: String,
    pub name: String,
    pub description: String,
    pub symbol: String,
    pub image: String,
    pub external_link: String,
    pub owner: String,
    pub supply: i32,
    pub decimals: i32,
}
