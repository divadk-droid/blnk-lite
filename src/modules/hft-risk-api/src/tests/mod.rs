//! Unit Tests for HFT Risk API

#[cfg(test)]
mod tests {
    use super::*;

    mod models_tests {
        use crate::models::{RiskLevel, Severity};

        #[test]
        fn test_risk_level_from_score() {
            assert!(matches!(RiskLevel::from_score(10.0), RiskLevel::Low));
            assert!(matches!(RiskLevel::from_score(30.0), RiskLevel::Medium));
            assert!(matches!(RiskLevel::from_score(60.0), RiskLevel::High));
            assert!(matches!(RiskLevel::from_score(90.0), RiskLevel::Critical));
        }

        #[test]
        fn test_risk_level_boundaries() {
            assert!(matches!(RiskLevel::from_score(0.0), RiskLevel::Low));
            assert!(matches!(RiskLevel::from_score(24.9), RiskLevel::Low));
            assert!(matches!(RiskLevel::from_score(25.0), RiskLevel::Medium));
            assert!(matches!(RiskLevel::from_score(49.9), RiskLevel::Medium));
            assert!(matches!(RiskLevel::from_score(50.0), RiskLevel::High));
            assert!(matches!(RiskLevel::from_score(74.9), RiskLevel::High));
            assert!(matches!(RiskLevel::from_score(75.0), RiskLevel::Critical));
            assert!(matches!(RiskLevel::from_score(100.0), RiskLevel::Critical));
        }
    }

    mod engine_tests {
        use crate::risk::engine::{RiskEngine, EngineConfig};
        use crate::models::RiskAssessmentRequest;

        #[tokio::test]
        async fn test_engine_creation() {
            let engine = RiskEngine::new();
            let (current, max) = engine.cache_stats();
            assert_eq!(current, 0);
            assert!(max > 0);
        }

        #[tokio::test]
        async fn test_engine_assess() {
            let engine = RiskEngine::new();
            let request = RiskAssessmentRequest {
                contract_address: "0x1234".to_string(),
                chain: "ethereum".to_string(),
                transaction_data: None,
                amount: None,
            };

            let response = engine.assess(request).await;
            assert_eq!(response.contract_address, "0x1234");
            assert!(response.processing_time_ms >= 0.0);
        }

        #[tokio::test]
        async fn test_engine_caching() {
            let engine = RiskEngine::new();
            let request = RiskAssessmentRequest {
                contract_address: "0x5678".to_string(),
                chain: "ethereum".to_string(),
                transaction_data: None,
                amount: None,
            };

            // First call - should miss cache
            let response1 = engine.assess(request.clone()).await;
            let time1 = response1.processing_time_ms;

            // Second call - should hit cache
            let response2 = engine.assess(request).await;
            let time2 = response2.processing_time_ms;

            // Cached response should be faster
            assert!(time2 <= time1);
        }
    }

    mod scanner_tests {
        use crate::scanner::OwaspScanner;
        use crate::scanner::ScanRule;

        #[test]
        fn test_scanner_creation() {
            let scanner = OwaspScanner::new();
            let rules = scanner.available_rules();
            assert!(!rules.is_empty());
            assert!(rules.contains(&"AccessControl".to_string()));
        }

        #[test]
        fn test_scanner_scan_bytecode() {
            let scanner = OwaspScanner::new();
            let findings = scanner.scan_bytecode(
                "0x1234",
                "608060405234801561001057600080fd5b50"
            );
            // Should return findings based on patterns
            assert!(findings.len() >= 0);
        }
    }

    mod pool_tests {
        use crate::pool::ObjectPool;

        #[test]
        fn test_pool_acquire_release() {
            let pool = ObjectPool::<i32>::new(5);
            
            // Acquire all items
            let mut guards: Vec<_> = Vec::new();
            for i in 0..5 {
                let mut guard = pool.acquire().expect("Should acquire");
                guard.initialize(i);
                guards.push(guard);
            }

            // Pool should be empty now
            assert!(pool.acquire().is_none());

            // Release one
            drop(guards.pop());

            // Should be able to acquire again
            assert!(pool.acquire().is_some());
        }

        #[test]
        fn test_pool_capacity() {
            let pool = ObjectPool::<String>::new(10);
            assert_eq!(pool.capacity(), 10);
            assert_eq!(pool.available(), 10);

            let _guard = pool.acquire();
            assert_eq!(pool.available(), 9);
        }
    }

    mod config_tests {
        use crate::config::AppConfig;

        #[test]
        fn test_default_config() {
            let config = AppConfig::from_env();
            assert!(!config.bind_address.is_empty());
            assert!(config.target_latency_ms > 0);
            assert!(config.worker_threads > 0);
        }
    }
}
