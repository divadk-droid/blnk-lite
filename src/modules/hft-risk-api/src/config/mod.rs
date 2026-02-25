use serde::{Deserialize, Serialize};

/// Application configuration
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub bind_address: String,
    pub target_latency_ms: u64,
    pub redis_url: String,
    pub max_concurrent_requests: usize,
    pub worker_threads: usize,
}

impl AppConfig {
    /// Load configuration from environment variables
    pub fn from_env() -> Self {
        Self {
            bind_address: std::env::var("BIND_ADDRESS")
                .unwrap_or_else(|_| "0.0.0.0:8080".to_string()),
            target_latency_ms: std::env::var("TARGET_LATENCY_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(10),
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string()),
            max_concurrent_requests: std::env::var("MAX_CONCURRENT_REQUESTS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(10000),
            worker_threads: std::env::var("WORKER_THREADS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or_else(|| num_cpus::get()),
        }
    }
}
