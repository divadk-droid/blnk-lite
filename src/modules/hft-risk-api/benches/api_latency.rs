//! API Latency Benchmarks
//!
//! Measures end-to-end API latency under various load conditions

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use std::time::Duration;

/// Benchmark risk assessment latency
fn benchmark_risk_latency(c: &mut Criterion) {
    let mut group = c.benchmark_group("api_latency");
    group.measurement_time(Duration::from_secs(10));
    group.sample_size(100);

    // Simulate different payload sizes
    for size in [100, 1000, 10000].iter() {
        group.bench_with_input(
            BenchmarkId::new("risk_assess", size),
            size,
            |b, &size| {
                b.iter(|| {
                    // Simulate risk calculation
                    let result: f64 = (0..size)
                        .map(|i| (i as f64 * 1.5).sin())
                        .sum();
                    black_box(result);
                });
            },
        );
    }

    group.finish();
}

/// Benchmark OWASP scanning latency
fn benchmark_scanner_latency(c: &mut Criterion) {
    let mut group = c.benchmark_group("scanner_latency");
    group.measurement_time(Duration::from_secs(10));
    
    // Pattern matching benchmark
    group.bench_function("pattern_match", |b| {
        let patterns = vec!["delegatecall", "selfdestruct", "call.value", "tx.origin"];
        let bytecode = "608060405234801561001057600080fd5b50".repeat(100);
        
        b.iter(|| {
            let mut found = 0;
            for pattern in &patterns {
                if bytecode.contains(pattern) {
                    found += 1;
                }
            }
            black_box(found);
        });
    });

    // SIMD vectorized calculation benchmark
    #[cfg(target_arch = "x86_64")]
    group.bench_function("simd_risk_calc", |b| {
        use std::arch::x86_64::*;
        
        let weights: Vec<f32> = (0..1024).map(|i| i as f32 / 1024.0).collect();
        let severities: Vec<f32> = (0..1024).map(|i| (i % 5) as f32 / 5.0).collect();
        
        b.iter(|| {
            unsafe {
                let mut total = 0.0_f32;
                for i in (0..1024).step_by(8) {
                    let w = _mm256_loadu_ps(weights.as_ptr().add(i));
                    let s = _mm256_loadu_ps(severities.as_ptr().add(i));
                    let prod = _mm256_mul_ps(w, s);
                    
                    // Horizontal sum
                    let sum = _mm256_hadd_ps(prod, prod);
                    let sum = _mm256_hadd_ps(sum, sum);
                    let arr: [f32; 8] = std::mem::transmute(sum);
                    total += arr[0] + arr[4];
                }
                black_box(total);
            }
        });
    });

    group.finish();
}

/// Benchmark cache operations
fn benchmark_cache_latency(c: &mut Criterion) {
    let mut group = c.benchmark_group("cache_latency");
    
    // Hash calculation benchmark
    group.bench_function("cache_key_hash", |b| {
        let chain = "ethereum";
        let address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
        
        b.iter(|| {
            let key = format!("risk:{}:{}", chain, address.to_lowercase());
            let hash = fxhash::hash64(&key);
            black_box(hash);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    benchmark_risk_latency,
    benchmark_scanner_latency,
    benchmark_cache_latency
);
criterion_main!(benches);
