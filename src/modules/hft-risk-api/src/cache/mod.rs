//! Redis Cache - High-performance Redis integration with connection pooling
//!
//! Features:
//! - Connection pooling for concurrent access
//! - Pipeline-based batch operations
//! - TTL-based caching with automatic expiration
//! - Binary serialization with MessagePack

use std::sync::Arc;
use std::time::Duration;

use redis::{aio::MultiplexedConnection, AsyncCommands, Client};
use serde::{Serialize};

use crate::models::{RiskAssessmentResponse};

/// Redis cache configuration
#[derive(Debug, Clone)]
pub struct RedisConfig {
    /// Redis connection URL
    pub url: String,
    /// Connection pool size
    pub pool_size: usize,
    /// Default TTL for cached entries (seconds)
    pub default_ttl_secs: u64,
    /// Maximum batch size for pipeline operations
    pub max_batch_size: usize,
    /// Connection timeout
    pub connection_timeout_secs: u64,
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            url: "redis://127.0.0.1:6379".to_string(),
            pool_size: 10,
            default_ttl_secs: 300, // 5 minutes
            max_batch_size: 100,
            connection_timeout_secs: 5,
        }
    }
}

/// Redis cache manager with connection pooling
pub struct RedisCache {
    /// Redis client
    client: Client,
    /// Connection pool
    connections: Arc<tokio::sync::Semaphore>,
    /// Configuration
    config: RedisConfig,
}

/// Cache key generator for risk assessments
pub fn risk_cache_key(chain: &str, contract_address: &str) -> String {
    format!("risk:{}:{}", chain, contract_address.to_lowercase())
}

/// Cache key for batch operations
pub fn batch_cache_key(request_id: &str) -> String {
    format!("batch:{}", request_id)
}

impl RedisCache {
    /// Create a new Redis cache manager
    pub async fn new(config: RedisConfig) -> Result<Self, redis::RedisError> {
        let client = Client::open(config.url.clone())?;
        
        // Test connection
        let _: MultiplexedConnection = client.get_multiplexed_async_connection().await?;

        Ok(Self {
            client,
            connections: Arc::new(tokio::sync::Semaphore::new(config.pool_size)),
            config,
        })
    }

    /// Get a connection from the pool
    async fn get_connection(&self) -> Result<MultiplexedConnection, redis::RedisError> {
        let _permit = self
            .connections
            .clone()
            .acquire_owned()
            .await
            .map_err(|_| redis::RedisError::from((
                redis::ErrorKind::IoError,
                "Failed to acquire connection from pool"
            )))?;

        self.client.get_multiplexed_async_connection().await
    }

    /// Get a cached risk assessment
    pub async fn get_risk_assessment(
        &self,
        chain: &str,
        contract_address: &str,
    ) -> Result<Option<RiskAssessmentResponse>, redis::RedisError> {
        let key = risk_cache_key(chain, contract_address);
        let mut conn = self.get_connection().await?;

        match conn.get::<&str, Option<Vec<u8>>>(&key).await? {
            Some(data) => {
                match rmp_serde::from_slice::<CachedRiskResponse>(&data) {
                    Ok(cached) => Ok(Some(cached.to_response())),
                    Err(_) => Ok(None),
                }
            }
            None => Ok(None),
        }
    }

    /// Cache a risk assessment
    pub async fn set_risk_assessment(
        &self,
        chain: &str,
        contract_address: &str,
        response: &RiskAssessmentResponse,
        ttl_secs: Option<u64>,
    ) -> Result<(), redis::RedisError> {
        let key = risk_cache_key(chain, contract_address);
        let ttl = ttl_secs.unwrap_or(self.config.default_ttl_secs);
        let mut conn = self.get_connection().await?;

        let cached = CachedRiskResponse::from_response(response);
        let data = rmp_serde::to_vec(&cached).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::IoError,
                "Serialization error",
                e.to_string(),
            ))
        })?;

        conn.set_ex(key, data, ttl).await
    }

    /// Delete a cached risk assessment
    pub async fn delete_risk_assessment(
        &self,
        chain: &str,
        contract_address: &str,
    ) -> Result<(), redis::RedisError> {
        let key = risk_cache_key(chain, contract_address);
        let mut conn = self.get_connection().await?;
        conn.del(key).await
    }

    /// Batch get risk assessments using pipeline
    pub async fn batch_get_risk_assessments(
        &self,
        keys: &[(String, String)], // Vec of (chain, contract_address)
    ) -> Result<Vec<Option<RiskAssessmentResponse>>, redis::RedisError> {
        if keys.is_empty() {
            return Ok(vec![]);
        }

        let mut conn = self.get_connection().await?;
        let mut pipeline = redis::pipe();

        for (chain, address) in keys {
            let key = risk_cache_key(chain, address);
            pipeline.get(&key);
        }

        let results: Vec<Option<Vec<u8>>> = pipeline.query_async(&mut conn).await?;

        let responses: Vec<Option<RiskAssessmentResponse>> = results
            .into_iter()
            .map(|data| {
                data.and_then(|d| {
                    rmp_serde::from_slice::<CachedRiskResponse>(&d)
                        .ok()
                        .map(|c| c.to_response())
                })
            })
            .collect();

        Ok(responses)
    }

    /// Batch set risk assessments using pipeline
    pub async fn batch_set_risk_assessments(
        &self,
        items: &[(String, String, RiskAssessmentResponse)], // (chain, address, response)
        ttl_secs: Option<u64>,
    ) -> Result<(), redis::RedisError> {
        if items.is_empty() {
            return Ok(());
        }

        let ttl = ttl_secs.unwrap_or(self.config.default_ttl_secs);
        let mut conn = self.get_connection().await?;
        let mut pipeline = redis::pipe();

        for (chain, address, response) in items {
            let key = risk_cache_key(chain, address);
            let cached = CachedRiskResponse::from_response(response);
            
            if let Ok(data) = rmp_serde::to_vec(&cached) {
                pipeline.set_ex(key, data, ttl);
            }
        }

        pipeline.query_async(&mut conn).await
    }

    /// Increment rate limit counter
    pub async fn increment_rate_limit(
        &self,
        key: &str,
        window_secs: u64,
    ) -> Result<i64, redis::RedisError> {
        let mut conn = self.get_connection().await?;
        
        let count: i64 = conn.incr(key, 1).await?;
        
        // Set expiry on first increment
        if count == 1 {
            let _: () = conn.expire(key, window_secs as i64).await?;
        }
        
        Ok(count)
    }

    /// Check if rate limit is exceeded
    pub async fn check_rate_limit(
        &self,
        key: &str,
        max_requests: i64,
    ) -> Result<bool, redis::RedisError> {
        let mut conn = self.get_connection().await?;
        let count: Option<i64> = conn.get(key).await?;
        
        match count {
            Some(c) => Ok(c >= max_requests),
            None => Ok(false),
        }
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> Result<RedisStats, redis::RedisError> {
        let mut conn = self.get_connection().await?;
        
        let info: String = redis::cmd("INFO").query_async(&mut conn).await?;
        
        // Parse basic info
        let used_memory = info
            .lines()
            .find(|l| l.starts_with("used_memory:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(0);

        let connected_clients = info
            .lines()
            .find(|l| l.starts_with("connected_clients:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|v| v.parse::<u32>().ok())
            .unwrap_or(0);

        let keyspace_hits = info
            .lines()
            .find(|l| l.starts_with("keyspace_hits:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(0);

        let keyspace_misses = info
            .lines()
            .find(|l| l.starts_with("keyspace_misses:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(0);

        Ok(RedisStats {
            used_memory_bytes: used_memory,
            connected_clients,
            keyspace_hits,
            keyspace_misses,
            hit_rate: if keyspace_hits + keyspace_misses > 0 {
                keyspace_hits as f64 / (keyspace_hits + keyspace_misses) as f64
            } else {
                0.0
            },
        })
    }

    /// Ping Redis server
    pub async fn ping(&self) -> Result<String, redis::RedisError> {
        let mut conn = self.get_connection().await?;
        redis::cmd("PING").query_async(&mut conn).await
    }

    /// Flush all cached data (use with caution)
    pub async fn flush_all(&self) -> Result<(), redis::RedisError> {
        let mut conn = self.get_connection().await?;
        redis::cmd("FLUSHALL").query_async(&mut conn).await
    }
}

/// Cached risk response for serialization
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct CachedRiskResponse {
    pub contract_address: String,
    pub risk_score: f32,
    pub risk_level: String,
    pub findings: Vec<crate::models::RiskFinding>,
    pub timestamp: String,
    pub cached_at: i64,
}

impl CachedRiskResponse {
    fn from_response(response: &RiskAssessmentResponse) -> Self {
        Self {
            contract_address: response.contract_address.clone(),
            risk_score: response.risk_score,
            risk_level: format!("{:?}", response.risk_level).to_lowercase(),
            findings: response.findings.clone(),
            timestamp: response.timestamp.clone(),
            cached_at: chrono::Utc::now().timestamp(),
        }
    }

    fn to_response(&self) -> RiskAssessmentResponse {
        use crate::models::RiskLevel;
        
        RiskAssessmentResponse {
            contract_address: self.contract_address.clone(),
            risk_score: self.risk_score,
            risk_level: match self.risk_level.as_str() {
                "low" => RiskLevel::Low,
                "medium" => RiskLevel::Medium,
                "high" => RiskLevel::High,
                _ => RiskLevel::Critical,
            },
            findings: self.findings.clone(),
            processing_time_ms: 0.0, // Cached response doesn't include processing time
            timestamp: self.timestamp.clone(),
        }
    }
}

/// Redis statistics
#[derive(Debug, Clone)]
pub struct RedisStats {
    pub used_memory_bytes: u64,
    pub connected_clients: u32,
    pub keyspace_hits: u64,
    pub keyspace_misses: u64,
    pub hit_rate: f64,
}
