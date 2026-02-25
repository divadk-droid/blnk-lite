//! HTTP Request Handlers

pub mod risk_handler;

use std::time::Instant;

use bytes::Bytes;
use http_body_util::Full;
use hyper::{Request, Response};
use serde_json::json;

use crate::models::{RiskAssessmentResponse, RiskFinding, RiskLevel, Severity};

/// Legacy assess risk handler (deprecated, use risk_handler::assess_risk)
pub async fn assess_risk(
    _req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let start = Instant::now();
    
    let response = RiskAssessmentResponse {
        contract_address: "0x1234...".to_string(),
        risk_score: 35.5,
        risk_level: RiskLevel::Medium,
        findings: vec![
            RiskFinding {
                category: "ACCESS_CONTROL".to_string(),
                severity: Severity::Medium,
                description: "Owner privileges detected".to_string(),
                location: None,
                confidence: 0.85,
            },
        ],
        processing_time_ms: start.elapsed().as_secs_f64() * 1000.0,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    let body = serde_json::to_string(&response).unwrap();
    
    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}

/// Legacy assess contract handler (deprecated, use risk_handler::assess_contract)
pub async fn assess_contract(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let path = req.uri().path();
    let parts: Vec<&str> = path.split('/').collect();
    
    let contract_address = parts.last().copied().unwrap_or("unknown");
    
    let response = json!({
        "contract_address": contract_address,
        "status": "assessment_pending",
        "message": "Contract assessment endpoint - implementation in progress"
    });
    
    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(response.to_string())))
        .unwrap())
}
