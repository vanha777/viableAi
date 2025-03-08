use axum::response::{IntoResponse, Response};
use reqwest::StatusCode;
use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum MetalootError {
    #[error("Error: {0}")]
    Error(String),
    #[error("jwt token not valid")]
    JwtTokenError,
    #[error("jwt creation error")]
    JwtCreationError,
    #[error("no auth header")]
    NoAuthHeaderError,
    #[error("invalid auth header")]
    InvalidAuthHeaderError,
    #[error("jwt has expired")]
    JwtExpired,
    #[error("no permissions")]
    NoPermission,
    #[error("no content")]
    NoContent,
    #[error("Jwt cant read public key")]
    JwtPublicKeyError,
    #[error("Jwt cant read private key")]
    JwtPrivateKeyError,

    #[error("{0}")]
    TransactionError(String),
    #[error("{0}")]
    RpcError(String),
    #[error("{0}")]
    InvalidInstruction(String),
    #[error("{0}")]
    SigningError(String),
    #[error("{0}")]
    SerializationError(String),
    #[error("{0}")]
    UnknownError(String),
}

impl IntoResponse for MetalootError {
    fn into_response(self) -> Response {
        let e = self;
        let response = match e {
            MetalootError::Error(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::JwtTokenError => (StatusCode::UNAUTHORIZED, e.to_string()),
            MetalootError::JwtCreationError => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::NoAuthHeaderError => (StatusCode::UNAUTHORIZED, e.to_string()),
            MetalootError::InvalidAuthHeaderError => (StatusCode::UNAUTHORIZED, e.to_string()),
            MetalootError::JwtExpired => (StatusCode::UNAUTHORIZED, e.to_string()),
            MetalootError::NoPermission => (StatusCode::UNAUTHORIZED, e.to_string()),
            MetalootError::NoContent => (StatusCode::NO_CONTENT, "".to_string()),
            MetalootError::JwtPublicKeyError => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::JwtPrivateKeyError => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),

            MetalootError::TransactionError(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::RpcError(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::InvalidInstruction(_) => (StatusCode::BAD_REQUEST, e.to_string()),
            MetalootError::SigningError(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::SerializationError(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            MetalootError::UnknownError(_) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };
        response.into_response()
    }
} //end.