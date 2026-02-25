//! Risk Handler - HTTP request handlers for risk assessment endpoints

use std::time::Instant;

use bytes::Bytes;
use http_body_util::{BodyExt, Full};
use hyper::{Request, Response};
use serde_json::json;

use crate::models::{RiskAssessmentRequest, RiskAssessmentResponse, RiskLevel};
use crate::risk::engine::RiskEngine;

/// Global risk engine instance (singleton pattern)
use std::sync::OnceLock;
static RISK_ENGINE: OnceLock<RiskEngine> = OnceLock::new();

/// Initialize the risk engine
pub fn init_engine() {
    let _ = RISK_ENGINE.get_or_init(RiskEngine::new);
}

/// Get the risk engine instance
fn get_engine() -> &'static RiskEngine {
    RISK_ENGINE.get().expect("Risk engine not initialized")
}

/// Assess risk for a contract
pub async fn assess_risk(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let start = Instant::now();

    // Parse request body
    let body_bytes = match req.collect().await {
        Ok(body) => body.to_bytes(),
        Err(_) => {
            let error_response = json!({
                "error": "Failed to read request body"
            });
            return Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(error_response.to_string())))
                .unwrap());
        }
    };

    let request: RiskAssessmentRequest = match serde_json::from_slice(&body_bytes) {
        Ok(req) => req,
        Err(e) => {
            let error_response = json!({
                "error": "Invalid request body",
                "details": e.to_string()
            });
            return Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(error_response.to_string())))
                .unwrap());
        }
    };

    // Perform risk assessment
    let engine = get_engine();
    let response = engine.assess(request).await;

    let body = match serde_json::to_string(&response) {
        Ok(json) => json,
        Err(e) => {
            let error_response = json!({
                "error": "Failed to serialize response",
                "details": e.to_string()
            });
            return Ok(Response::builder()
                .status(500)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(error_response.to_string())))
                .unwrap());
        }
    };

    // Add performance headers
    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .header("X-Processing-Time-Ms", format!("{:.3}", response.processing_time_ms))
        .header("X-Cache-Status", if response.processing_time_ms < 1.0 { "HIT" } else { "MISS" })
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}

/// Assess a specific contract by address (GET endpoint)
pub async fn assess_contract(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let start = Instant::now();

    // Extract contract address from query params or path
    let uri = req.uri();
    let query = uri.query().unwrap_or("");
    
    // Parse query parameters
    let params: std::collections::HashMap<String, String> = query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next()?.to_string();
            let value = parts.next()?.to_string();
            Some((key, value))
        })
        .collect();

    let contract_address = params.get("address").cloned().unwrap_or_else(|| {
        // Try to extract from path
        let path = uri.path();
        let parts: Vec<&str> = path.split('/').collect();
        parts.last().copied().unwrap_or("unknown").to_string()
    });

    let chain = params.get("chain").cloned().unwrap_or_else(|| "ethereum".to_string());

    let request = RiskAssessmentRequest {
        contract_address,
        chain,
        transaction_data: None,
        amount: None,
    };

    let engine = get_engine();
    let response = engine.assess(request).await;

    let body = match serde_json::to_string(&response) {
        Ok(json) => json,
        Err(e) => {
            let error_response = json!({
                "error": "Failed to serialize response",
                "details": e.to_string()
            });
            return Ok(Response::builder()
                .status(500)
                .header("Content-Type", "application/json")
                .body(Full::new(Bytes::from(error_response.to_string())))
                .unwrap());
        }
    };

    let total_time = start.elapsed().as_secs_f64() * 1000.0;

    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .header("X-Total-Time-Ms", format!("{:.3}", total_time))
        .header("X-Risk-Score", format!("{:.1}", response.risk_score))
        .header("X-Risk-Level", format!("{:?}", response.risk_level))
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}

/// Get cache statistics
pub async fn cache_stats(
    _req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let engine = get_engine();
    let (current, max) = engine.cache_stats();

    let stats = json!({
        "cache_entries": current,
        "max_entries": max,
        "utilization_percent": (current as f64 / max as f64 * 100.0),
    });

    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(stats.to_string())))
        .unwrap())
}

/// Clear cache endpoint
pub async fn clear_cache(
    _req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, std::convert::Infallible> {
    let engine = get_engine();
    engine.clear_cache();

    let response = json!({
        "status": "success",
        "message": "Cache cleared successfully"
    });

    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(response.to_string())))
        .unwrap())
}
