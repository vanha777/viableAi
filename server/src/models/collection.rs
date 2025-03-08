use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNFTRequest {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub collection_mint: String, // The mint address of the collection this NFT belongs to
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CollectionResponse {
    pub address: String,
    pub uri: String,
}

