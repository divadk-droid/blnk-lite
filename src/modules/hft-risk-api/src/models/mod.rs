use serde::{Deserialize, Serialize};

/// Risk assessment request
#[derive(Debug, Clone, Deserialize)]
pub struct RiskAssessmentRequest {
    /// Contract address to assess
    pub contract_address: String,
    /// Blockchain network (ethereum, solana, bsc, etc.)
    pub chain: String,
    /// Optional: Transaction data for context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_data: Option<String>,
    /// Optional: Amount being transacted
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<f64>,
}

/// Risk assessment response
#[derive(Debug, Clone, Serialize)]
pub struct RiskAssessmentResponse {
    /// Contract address
    pub contract_address: String,
    /// Overall risk score (0-100, higher is riskier)
    pub risk_score: f32,
    /// Risk level
    pub risk_level: RiskLevel,
    /// Detailed findings
    pub findings: Vec<RiskFinding>,
    /// Processing time in milliseconds
    pub processing_time_ms: f64,
    /// Timestamp
    pub timestamp: String,
}

/// Risk level classification
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {
    pub fn from_score(score: f32) -> Self {
        match score {
            s if s < 25.0 => RiskLevel::Low,
            s if s < 50.0 => RiskLevel::Medium,
            s if s < 75.0 => RiskLevel::High,
            _ => RiskLevel::Critical,
        }
    }
}

/// Individual risk finding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskFinding {
    /// OWASP category or custom category
    pub category: String,
    /// Severity of the finding
    pub severity: Severity,
    /// Description of the issue
    pub description: String,
    /// Optional: Line number or location
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    /// Confidence level (0-1)
    pub confidence: f32,
}

/// Severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Info,
    Low,
    Medium,
    High,
    Critical,
}

/// Contract metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractMetadata {
    pub address: String,
    pub chain: String,
    pub verified: bool,
    pub compiler_version: Option<String>,
    pub creation_timestamp: Option<i64>,
}
