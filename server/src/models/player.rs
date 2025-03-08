use borsh::BorshDeserialize;
use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlayerRequest {
    pub user_username: String,
    pub uri: String,
}

// Add this struct for deserialization
#[derive(BorshDeserialize)]
pub struct PlayerOnChainData {
    pub authority: Pubkey,
    pub username: String,
    pub created_at: i64,
    pub uri: String,
    pub bump: u8,
}

#[derive(Clone,Debug, Serialize, Deserialize)]
pub struct GetPlayerDataItemsQuery {
    pub token: Option<String>,
    pub collection: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlayerRequest {
    pub new_uri: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GoogleProfile {
    pub iss: Option<String>,
    pub azp: Option<String>,
    pub aud: Option<String>,
    pub sub: Option<String>,
    pub email: String,
    pub email_verified: Option<bool>,
    pub at_hash: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub iat: Option<i64>,
    pub exp: Option<i64>,
}

// Implementing std::fmt::Display for GoogleProfile
impl std::fmt::Display for GoogleProfile {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "{{ email: {}, name: {:?}, picture: {:?} }}",
            self.email, self.name, self.picture
        )
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerMetaData {
    pub name: String,
    pub attributes: Vec<Option<Attribute>>,
    pub properties: Option<Properties>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlayerDataResponse {
    pub username: String,
    pub wallet: String,
    pub profile_picture: Option<String>,
    pub attributes: Option<serde_json::Value>,
    pub assets: Option<Vec<Assets>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Value {
    pub address: String,
    pub balance: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Assets {
    pub game_id: Option<String>,
    pub tokens: Option<Value>,
    pub collections: Option<Vec<NFT>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NFT {
    //todo: fix me ......
    pub tokens: String,
    pub collections: Option<Vec<NFT>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Properties {
    pub category: String,
    pub files: Vec<File>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub uri: String,
    pub type_: String,
}
