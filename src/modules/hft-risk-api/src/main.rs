use std::convert::Infallible;
use std::net::SocketAddr;
use std::time::Instant;

use bytes::Bytes;
use http_body_util::Full;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;

mod config;
mod handlers;
mod models;
mod risk;
mod scanner;
mod pool;
mod cache;

use crate::config::AppConfig;
use crate::handlers::risk_handler;
use crate::handlers::risk_handler::init_engine;

/// Main entry point
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    // Initialize risk engine
    init_engine();
    
    // Load configuration
    let config = AppConfig::from_env();
    
    // Bind to address
    let addr: SocketAddr = config.bind_address.parse()?;
    let listener = TcpListener::bind(addr).await?;
    
    tracing::info!("HFT Risk API server starting on {}", addr);
    tracing::info!("Target latency: {}ms", config.target_latency_ms);
    
    // Accept incoming connections
    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);
        
        // Spawn a task to handle the connection
        tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(io, service_fn(handle_request))
                .await
            {
                tracing::error!("Error serving connection: {:?}", err);
            }
        });
    }
}

/// Main request handler
async fn handle_request(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<Full<Bytes>>, Infallible> {
    let start = Instant::now();
    
    let response = match req.uri().path() {
        "/health" => health_check(),
        "/api/v1/risk/assess" => risk_handler::assess_risk(req).await,
        "/api/v1/risk/contract" => risk_handler::assess_contract(req).await,
        "/metrics" => metrics_handler(),
        _ => not_found(),
    };
    
    let elapsed = start.elapsed();
    tracing::debug!("Request processed in {:?}", elapsed);
    
    response
}

/// Health check endpoint
fn health_check() -> Result<Response<Full<Bytes>>, Infallible> {
    let body = r#"{"status":"healthy","service":"hft-risk-api"}"#;
    Ok(Response::builder()
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}

/// Metrics endpoint for Prometheus
fn metrics_handler() -> Result<Response<Full<Bytes>>, Infallible> {
    // TODO: Integrate with metrics crate
    let body = "# HFT Risk API Metrics\n";
    Ok(Response::builder()
        .header("Content-Type", "text/plain")
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}

/// 404 Not Found handler
fn not_found() -> Result<Response<Full<Bytes>>, Infallible> {
    let body = r#"{"error":"Not Found"}"#;
    Ok(Response::builder()
        .status(404)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(body)))
        .unwrap())
}
