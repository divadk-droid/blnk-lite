//! Risk Engine Benchmarks
//!
//! Performance benchmarks for the risk assessment engine

use criterion::{black_box, criterion_group, criterion_main, Criterion, BatchSize};

/// Benchmark SIMD operations
fn benchmark_simd_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("simd_operations");

    // Scalar vs SIMD comparison
    let data: Vec<f32> = (0..10000).map(|i| i as f32 * 0.001).collect();

    group.bench_function("scalar_sum", |b| {
        b.iter(|| {
            let sum: f32 = data.iter().map(|x| x * x).sum();
            black_box(sum);
        });
    });

    #[cfg(target_arch = "x86_64")]
    group.bench_function("avx2_sum", |b| {
        use std::arch::x86_64::*;
        
        b.iter(|| {
            unsafe {
                let mut sum_vec = _mm256_setzero_ps();
                for chunk in data.chunks_exact(8) {
                    let vec = _mm256_loadu_ps(chunk.as_ptr());
                    sum_vec = _mm256_add_ps(sum_vec, vec);
                }
                
                // Horizontal sum
                let sum = _mm256_hadd_ps(sum_vec, sum_vec);
                let sum = _mm256_hadd_ps(sum, sum);
                let arr: [f32; 8] = std::mem::transmute(sum);
                black_box(arr[0] + arr[4]);
            }
        });
    });

    group.finish();
}

/// Benchmark memory pool operations
fn benchmark_memory_pool(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_pool");

    // Standard allocation vs pool allocation
    group.bench_function("standard_alloc", |b| {
        b.iter_batched(
            || {},
            |_| {
                let vec: Vec<u8> = vec![0; 1024];
                black_box(vec);
            },
            BatchSize::SmallInput,
        );
    });

    group.bench_function("pooled_alloc", |b| {
        use crossbeam::queue::SegQueue;
        
        let pool: SegQueue<Vec<u8>> = SegQueue::new();
        
        // Pre-populate pool
        for _ in 0..100 {
            pool.push(vec![0; 1024]);
        }
        
        b.iter_batched(
            || {},
            |_| {
                let vec = pool.pop().unwrap_or_else(|| vec![0; 1024]);
                black_box(vec);
            },
            BatchSize::SmallInput,
        );
    });

    group.finish();
}

/// Benchmark risk score calculations
fn benchmark_risk_calculation(c: &mut Criterion) {
    let mut group = c.benchmark_group("risk_calculation");

    // Generate test findings
    let findings: Vec<(f32, f32)> = (0..1000)
        .map(|i| ((i % 100) as f32 / 100.0, (i % 5) as f32 / 5.0))
        .collect();

    group.bench_function("weighted_average", |b| {
        b.iter(|| {
            let total: f32 = findings.iter().map(|(w, s)| w * s).sum();
            let avg = total / findings.len() as f32;
            black_box(avg);
        });
    });

    // Parallel calculation using chunks
    group.bench_function("parallel_chunks", |b| {
        use rayon::prelude::*;
        
        b.iter(|| {
            let sum: f32 = findings
                .par_chunks(100)
                .map(|chunk| chunk.iter().map(|(w, s)| w * s).sum::<f32>())
                .sum();
            let avg = sum / findings.len() as f32;
            black_box(avg);
        });
    });

    group.finish();
}

/// Benchmark serialization
fn benchmark_serialization(c: &mut Criterion) {
    let mut group = c.benchmark_group("serialization");

    // Test data
    let data = vec![
        ("ethereum", "0x1234...", 45.5_f32),
        ("solana", "ABC123...", 23.0_f32),
        ("bsc", "0x5678...", 78.5_f32),
    ];

    group.bench_function("json_serialize", |b| {
        b.iter(|| {
            let json = serde_json::to_string(&data).unwrap();
            black_box(json);
        });
    });

    group.bench_function("msgpack_serialize", |b| {
        b.iter(|| {
            let packed = rmp_serde::to_vec(&data).unwrap();
            black_box(packed);
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    benchmark_simd_operations,
    benchmark_memory_pool,
    benchmark_risk_calculation,
    benchmark_serialization
);
criterion_main!(benches);
