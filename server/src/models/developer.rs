use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardLoginRequest {
    pub session_id: String
}

#[derive(Deserialize, Serialize, sqlx::FromRow)]
pub struct DevelopersInfo {
    pub referal: Option<String>,
    pub wallet: Option<String>,
    pub studio_name: Option<String>,
    pub email: Option<String>,
    pub name: Option<String>,
}