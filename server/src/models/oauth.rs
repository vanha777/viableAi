use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct SingleSignOnQuery {
    pub redirect_uri: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AppleClaims {
    pub iss: String,
    pub iat: u64,
    pub exp: u64,
    pub aud: String,
    pub sub: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AppleOAuthResponse {
    pub code: String,
    pub id_token: String,
    pub state: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AppleOAuthTokenResponse {
    pub access_token: String,
    pub expires_in: u64,
    pub id_token: String,
    pub refresh_token: String,
    pub token_type: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AppleOAuthClaims {
    pub at_hash: String,
    pub aud: String,
    pub auth_time: u64,
    pub email: String,
    pub email_verified: bool,
    pub exp: u64,
    pub iat: u64,
    pub iss: String,
    pub nonce_supported: bool,
    pub sub: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

// Implementing std::fmt::Display for GoogleProfile
impl std::fmt::Display for AppleOAuthClaims {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "{{ email: {}, name: {:?}, picture: {:?} }}",
            self.email, self.name, self.picture
        )
    }
}
