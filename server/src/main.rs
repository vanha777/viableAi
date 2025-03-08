use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post, put},
    Extension, Json, RequestPartsExt, Router,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use handler::{
    collection::{self, State},
    developer, game, nft, player, token,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use serde_json::json;
use shuttle_runtime::SecretStore;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair},
};
use sqlx::{
    postgres::{PgConnectOptions, PgPoolOptions},
    PgPool,
};

use std::time::SystemTime;
use std::{fmt::Display, sync::Arc};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
pub mod handler;
pub mod models;
pub mod ultilites;
static KEYS: Lazy<Keys> = Lazy::new(|| {
    // note that in production, you will probably want to use a random SHA-256 hash or similar
    let secret = "JWT_SECRET".to_string();
    Keys::new(secret.as_bytes())
});

#[shuttle_runtime::main]
async fn main(#[shuttle_runtime::Secrets] secrets: SecretStore) -> shuttle_axum::ShuttleAxum {
    // get secret defined in `Secrets.toml` file.
    let rpc_url = secrets
        .get("RPC_URL")
        .unwrap_or("https://api.devnet.solana.com".to_string());
    let rpc_client = Arc::new(RpcClient::new(rpc_url.clone()));
    let mtl_program_id = secrets
        .get("MTL_PROGRAM_ID")
        .unwrap_or("v3MbKaZSQJrwZWUz81cQ3kc8XvMsiNNxZjM3vN5BB32".to_string());
    let mtl_program_pubkey = Pubkey::from_str_const(&mtl_program_id);
    let google_client_id = secrets
        .get("GOOGLE_CLIENT_ID")
        .unwrap_or("https://metaloot-cloud-d4ec.shuttle.app".to_string());
    let apple_client_id = secrets.get("APPLE_CLIENT_ID").unwrap_or("".to_string());
    let apple_team_id = secrets.get("APPLE_TEAM_ID").unwrap_or("".to_string());
    let apple_private_key = secrets.get("APPLE_PRIVATE_KEY").unwrap_or("".to_string());
    let apple_key_id = secrets.get("APPLE_KEY_ID").unwrap_or("".to_string());
    let server_url = secrets
        .get("SERVER_URL")
        .unwrap_or("http://127.0.0.1:8010".to_string());
    let google_client_secret = secrets
        .get("GOOGLE_CLIENT_SECRET")
        .unwrap_or("".to_string());
    let supabase_db_url = secrets.get("SUPABASE_DB_URL").unwrap_or("".to_string());
    let supabase_storage_url = secrets
        .get("SUPABASE_STORAGE_URL")
        .unwrap_or("".to_string());
    let supabase_api_key = secrets.get("SUPABASE_API_KEY").unwrap_or("".to_string());
    // Create connection pool
    let supabase_postgres = PgPoolOptions::new()
        .connect(&supabase_db_url)
        .await
        .expect("Failed to create pool");
    let admin_keypair = secrets.get("ADMIN_KEYPAIR").unwrap_or(String::new());
    // Convert string to bytes for Keypair
    // Parse the string "[66,186,80,...]" into a Vec<u8>
    let admin_keypair_bytes: Vec<u8> = admin_keypair
        .trim_matches(|c| c == '[' || c == ']') // Remove brackets
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();
    let admin = Arc::new(Keypair::from_bytes(&admin_keypair_bytes).unwrap());

    // Building Global State Accessible to all routes
    let state = Arc::new(Mutex::new(State {
        rpc_client,
        metaloot_program_id: mtl_program_pubkey,
        admin,
        google_client_id,
        server_url,
        google_client_secret,
        apple_client_id,
        apple_team_id,
        apple_key_id,
        apple_private_key,
        rpc_url,
        supabase_postgres,
    }));

    // Create the CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any) // Relaxed CORS: Allow any origin
        .allow_methods(Any) // Allow all HTTP methods
        .allow_headers(Any); // Allow all headers

    let app = Router::new()
        .route("/public", get(public))
        .route("/private", get(private))
        .route("/login", post(login))
        .route("/oauth/google/callback", get(player::oauth_google_callback))
        .route("/oauth/apple/callback", post(player::oauth_apple_callback))
        .nest(
            "/v1",
            Router::new()
                // ==========================================
                // ============ DEVELOPER ROUTES ==============
                // ==========================================
                .nest(
                    "/api/dashboard",
                    Router::new().route("/login", post(developer::dashboard_login)),
                )
                // ==========================================
                // ============ GAMES ROUTES ==============
                // ==========================================
                .nest(
                    "/api/game",
                    Router::new()
                        .route(
                            "/",
                            get(game::get_all_games_registry)
                                .post(game::create_game)
                                .put(game::update_game),
                        )
                        .route("/:username", get(game::get_game_resgistry))
                        // .route("/tokenomic", post(game::create_tokenomic))
                        // .route("/collection", post(game::create_collection))
                        .route("/nft", post(game::create_nft))
                        .route("/:owner/assets", get(game::get_asset)),
                )
                // ==========================================
                // ============ PLAYER ROUTES ==============
                // ==========================================
                .nest(
                    "/api/player",
                    Router::new()
                        .route("/", post(player::register_player))
                        .route(
                            "/:username",
                            put(player::update_player).get(player::get_player_data_items),
                        )
                        .route("/oauth/google", get(player::oauth_google))
                        .route("/oauth/apple", get(player::oauth_apple))
                        .route("/:owner/assets", get(player::get_asset)),
                )
                // ==========================================
                // ============ TOKENS ROUTES ==============
                // ==========================================
                .nest(
                    "/api/token",
                    Router::new()
                        .route("/:token", get(token::get_token_data))
                        .route("/create", post(token::create_token))
                        // this username should have authority to mint the token - the payer of token creations
                        .route("/mint", post(token::mint_token))
                        .route("/transfer", post(token::transfer_token))
                        .route("/reward", post(token::reward_token)),
                )
                // ==========================================
                // ============ NFT ROUTES ==============
                // ==========================================
                .nest(
                    "/api/collection",
                    Router::new()
                        .route(
                            "/",
                            post(collection::create_collection).get(collection::get_asset),
                        )
                        .route("/:collection/nfts", get(nft::get_nfts))
                        .route("/nft", post(collection::create_nft))
                        .route("/nft/reward", post(collection::reward_nft))
                        .route("/nft/transfer", post(collection::transfer_nft)),
                )
                // ==========================================
                // ============ TOKENS ROUTES ==============
                // ==========================================
                .nest(
                    "/api/challenge",
                    Router::new()
                        .route("/", get(challenge::get_challenge).post(challenge::create_challenge))
                        .route("/:challenge_uuid", put(challenge::stake_challenge).post(challenge::claim_challenge))
                ),
        )
        // .nest_service("/", ServeDir::new("static"))
        .layer(cors) // Apply the CORS layer globally
        .layer(Extension(state));
    Ok(app.into())
}

async fn public() -> &'static str {
    // A public endpoint that anyone can access
    "Welcome to the public area :)"
}

async fn private(claims: Claims) -> Result<String, AuthError> {
    // Send the protected data to the user
    Ok(format!(
        "Welcome to the protected area :)\nYour data:\n{claims}",
    ))
}

async fn login(Json(payload): Json<AuthPayload>) -> Result<Json<AuthBody>, AuthError> {
    // Check if the user sent the credentials
    if payload.client_id.is_empty() || payload.client_secret.is_empty() {
        return Err(AuthError::MissingCredentials);
    }
    // Here you can check the user credentials from a database
    if payload.client_secret != "metalootfreetier" {
        return Err(AuthError::WrongCredentials);
    }

    // add 5 minutes to current unix epoch time as expiry date/time
    let exp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + 3000;

    let claims = Claims {
        sub: "Devnet".to_owned(),
        developer: payload.client_id,
        // Mandatory expiry time as UTC timestamp - takes unix epoch
        exp: usize::try_from(exp).unwrap(),
    };
    // Create the authorization token
    let token = encode(&Header::default(), &claims, &KEYS.encoding)
        .map_err(|_| AuthError::TokenCreation)?;

    // Send the authorized token
    Ok(Json(AuthBody::new(token)))
}

// allow us to print the claim details for the private route
impl Display for Claims {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Developer: {}\nEnviroment: {}", self.developer, self.sub,)
    }
}

// implement a method to create a response type containing the JWT
impl AuthBody {
    fn new(access_token: String) -> Self {
        Self {
            access_token,
            token_type: "Bearer".to_string(),
        }
    }
}

// implement FromRequestParts for Claims (the JWT struct)
// FromRequestParts allows us to use Claims without consuming the request
#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the token from the authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::InvalidToken)?;
        // Decode the user data
        let token_data = decode::<Claims>(bearer.token(), &KEYS.decoding, &Validation::default())
            .map_err(|_| AuthError::InvalidToken)?;

        Ok(token_data.claims)
    }
}

// implement IntoResponse for AuthError so we can use it as an Axum response type
impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::WrongCredentials => (StatusCode::UNAUTHORIZED, "Wrong credentials"),
            AuthError::MissingCredentials => (StatusCode::BAD_REQUEST, "Missing credentials"),
            AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "Token creation error"),
            AuthError::InvalidToken => (StatusCode::BAD_REQUEST, "Invalid token"),
        };
        let body = Json(json!({
            "error": error_message,
        }));
        (status, body).into_response()
    }
}

// encoding/decoding keys - set in the static `once_cell` above
struct Keys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl Keys {
    fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

// the JWT claim
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub developer: String,
    pub exp: usize,
}

// the response that we pass back to HTTP client once successfully authorised
#[derive(Debug, Serialize)]
struct AuthBody {
    access_token: String,
    token_type: String,
}

// the request type - "client_id" is analogous to a username, client_secret can also be interpreted as a password
#[derive(Debug, Deserialize)]
struct AuthPayload {
    client_id: String,
    client_secret: String,
}

// error types for auth errors
#[derive(Debug)]
pub enum AuthError {
    WrongCredentials,
    MissingCredentials,
    TokenCreation,
    InvalidToken,
}
