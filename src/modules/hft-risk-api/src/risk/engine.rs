//! Risk Engine - Core risk assessment engine with SIMD optimization
//! 
//! This module implements the high-performance risk assessment engine
//! with support for SIMD operations (AVX2/SSE4.2) for vectorized calculations.

use std::sync::Arc;

use crossbeam::queue::SegQueue;
use dashmap::DashMap;

use crate::models::{
    RiskAssessmentRequest, RiskAssessmentResponse, RiskFinding, RiskLevel,
};
use crate::scanner::OwaspScanner;

/// Risk engine with optimized memory pooling
pub struct RiskEngine {
    /// Scanner for OWASP vulnerabilities
    scanner: OwaspScanner,
    /// Request pool for zero-allocation reuse
    request_pool: Arc<SegQueue<RiskAssessmentRequest>>,
    /// Response cache (contract_address -> response)
    cache: Arc<DashMap<String, CachedResponse>>,
    /// Engine configuration
    config: EngineConfig,
}

/// Cached response with TTL
#[derive(Debug, Clone)]
pub struct CachedResponse {
    pub response: RiskAssessmentResponse,
    pub timestamp: std::time::Instant,
}

/// Engine configuration
#[derive(Debug, Clone)]
pub struct EngineConfig {
    /// Cache TTL in seconds
    pub cache_ttl_secs: u64,
    /// Maximum cache entries
    pub max_cache_entries: usize,
    /// Enable SIMD optimizations
    pub enable_simd: bool,
    /// Worker threads for parallel processing
    pub worker_threads: usize,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            cache_ttl_secs: 300, // 5 minutes
            max_cache_entries: 100_000,
            enable_simd: true,
            worker_threads: num_cpus::get(),
        }
    }
}

impl RiskEngine {
    /// Create a new risk engine with default configuration
    pub fn new() -> Self {
        Self::with_config(EngineConfig::default())
    }

    /// Create a new risk engine with custom configuration
    pub fn with_config(config: EngineConfig) -> Self {
        let scanner = OwaspScanner::new();
        let request_pool = Arc::new(SegQueue::new());
        let cache = Arc::new(DashMap::with_capacity(config.max_cache_entries));

        Self {
            scanner,
            request_pool,
            cache,
            config,
        }
    }

    /// Assess risk for a contract request
    pub async fn assess(&self, request: RiskAssessmentRequest) -> RiskAssessmentResponse {
        let start = std::time::Instant::now();
        let cache_key = format!("{}:{}", request.chain, request.contract_address);

        // Check cache first
        if let Some(cached) = self.cache.get(&cache_key) {
            if cached.timestamp.elapsed().as_secs() < self.config.cache_ttl_secs {
                let mut response = cached.response.clone();
                response.processing_time_ms = start.elapsed().as_secs_f64() * 1000.0;
                return response;
            }
        }

        // Perform risk assessment
        let findings = self.scanner.scan_bytecode(
            &request.contract_address,
            &request.contract_address, // Placeholder for actual bytecode
        );

        // Calculate risk score using SIMD-optimized vectorized calculation
        let risk_score = self.calculate_risk_score_simd(&findings);
        let risk_level = RiskLevel::from_score(risk_score);

        let response = RiskAssessmentResponse {
            contract_address: request.contract_address.clone(),
            risk_score,
            risk_level,
            findings,
            processing_time_ms: start.elapsed().as_secs_f64() * 1000.0,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        // Cache the response
        self.cache.insert(
            cache_key,
            CachedResponse {
                response: response.clone(),
                timestamp: std::time::Instant::now(),
            },
        );

        // Clean up old cache entries if needed
        if self.cache.len() > self.config.max_cache_entries {
            self.cleanup_cache();
        }

        response
    }

    /// Calculate risk score using SIMD vectorized operations
    /// 
    /// Uses AVX2 when available for parallel confidence calculations
    fn calculate_risk_score_simd(&self, findings: &[RiskFinding]) -> f32 {
        if findings.is_empty() {
            return 0.0;
        }

        #[cfg(target_arch = "x86_64")]
        {
            if self.config.enable_simd && is_x86_feature_detected!("avx2") {
                return unsafe { self.calculate_risk_score_avx2(findings) };
            }
            if self.config.enable_simd && is_x86_feature_detected!("sse4.2") {
                return unsafe { self.calculate_risk_score_sse42(findings) };
            }
        }

        // Fallback to scalar calculation
        self.calculate_risk_score_scalar(findings)
    }

    /// AVX2-optimized risk score calculation
    #[cfg(target_arch = "x86_64")]
    #[target_feature(enable = "avx2")]
    unsafe fn calculate_risk_score_avx2(&self, findings: &[RiskFinding]) -> f32 {
        use std::arch::x86_64::*;

        let mut total_score = 0.0_f32;
        let chunk_size = 8; // AVX2 can process 8 f32 values at once

        let weights: Vec<f32> = findings.iter().map(|f| f.confidence).collect();
        let severities: Vec<f32> = findings.iter().map(|f| severity_to_f32(&f.severity)).collect();

        let len = weights.len();
        let mut i = 0;

        while i + chunk_size <= len {
            let w = _mm256_loadu_ps(weights.as_ptr().add(i));
            let s = _mm256_loadu_ps(severities.as_ptr().add(i));
            let product = _mm256_mul_ps(w, s);
            
            // Horizontal sum of the 8 values
            let sum = _mm256_hadd_ps(product, product);
            let sum = _mm256_hadd_ps(sum, sum);
            
            let result: [f32; 8] = std::mem::transmute(sum);
            total_score += result[0] + result[4];

            i += chunk_size;
        }

        // Process remaining elements
        for j in i..len {
            total_score += weights[j] * severities[j];
        }

        (total_score / len as f32 * 100.0).min(100.0)
    }

    /// SSE4.2-optimized risk score calculation
    #[cfg(target_arch = "x86_64")]
    #[target_feature(enable = "sse4.2")]
    unsafe fn calculate_risk_score_sse42(&self, findings: &[RiskFinding]) -> f32 {
        use std::arch::x86_64::*;

        let mut total_score = 0.0_f32;
        let chunk_size = 4; // SSE can process 4 f32 values at once

        let weights: Vec<f32> = findings.iter().map(|f| f.confidence).collect();
        let severities: Vec<f32> = findings.iter().map(|f| severity_to_f32(&f.severity)).collect();

        let len = weights.len();
        let mut i = 0;

        while i + chunk_size <= len {
            let w = _mm_loadu_ps(weights.as_ptr().add(i));
            let s = _mm_loadu_ps(severities.as_ptr().add(i));
            let product = _mm_mul_ps(w, s);
            
            // Horizontal sum
            let shuf = _mm_movehdup_ps(product);
            let sums = _mm_add_ps(product, shuf);
            let shuf = _mm_movehl_ps(shuf, sums);
            let sums = _mm_add_ss(sums, shuf);
            
            total_score += _mm_cvtss_f32(sums);

            i += chunk_size;
        }

        // Process remaining elements
        for j in i..len {
            total_score += weights[j] * severities[j];
        }

        (total_score / len as f32 * 100.0).min(100.0)
    }

    /// Scalar fallback for risk score calculation
    fn calculate_risk_score_scalar(&self, findings: &[RiskFinding]) -> f32 {
        let total_score: f32 = findings
            .iter()
            .map(|f| f.confidence * severity_to_f32(&f.severity))
            .sum();

        (total_score / findings.len() as f32 * 100.0).min(100.0)
    }

    /// Clean up expired cache entries
    fn cleanup_cache(&self) {
        let now = std::time::Instant::now();
        self.cache.retain(|_, cached| {
            now.duration_since(cached.timestamp).as_secs() < self.config.cache_ttl_secs
        });
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> (usize, usize) {
        (self.cache.len(), self.config.max_cache_entries)
    }

    /// Clear the cache
    pub fn clear_cache(&self) {
        self.cache.clear();
    }
}

impl Default for RiskEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// Convert severity to numeric value for calculations
fn severity_to_f32(severity: &crate::models::Severity) -> f32 {
    use crate::models::Severity;
    match severity {
        Severity::Info => 0.1,
        Severity::Low => 0.25,
        Severity::Medium => 0.5,
        Severity::High => 0.75,
        Severity::Critical => 1.0,
    }
}
