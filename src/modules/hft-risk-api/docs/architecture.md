# HFT Risk API - Low Latency Architecture Design

## 1. 개요

### 목표
- **API 응답 시간:** 10ms 이하 (p99)
- **처리량:** 100,000+ TPS
- **가용성:** 99.99%

### 핵심 설계 원칙
1. **Zero-Copy:** 데이터 복사 최소화
2. **Lock-Free:** 동기화 오버헤드 제거
3. **Cache-Friendly:** CPU 캐시 최적화
4. **Predictable:** GC 없는 메모리 관리

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HFT Risk API Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  │   Load       │────▶│   API        │────▶│   Risk       │             │
│  │   Balancer   │     │   Gateway    │     │   Engine     │             │
│  │   (L4/L7)    │     │   (Rust)     │     │   (Rust/C++) │             │
│  └──────────────┘     └──────────────┘     └──────┬───────┘             │
│         │                                         │                      │
│         │                                         ▼                      │
│         │                              ┌──────────────────┐             │
│         │                              │  OWASP Scanner   │             │
│         │                              │  (Real-time)     │             │
│         │                              └────────┬─────────┘             │
│         │                                       │                       │
│         ▼                                       ▼                       │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              In-Memory Cache (Redis/AeroSpike)           │           │
│  │         (Contract Metadata, Risk Scores, Rules)          │           │
│  └─────────────────────────────────────────────────────────┘           │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              Message Queue (ZeroMQ/nanomsg)              │           │
│  │              (Async Processing Pipeline)                 │           │
│  └─────────────────────────────────────────────────────────┘           │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              Blockchain Nodes (Multi-chain)              │           │
│  │    (Ethereum, Solana, BSC, Arbitrum, Optimism, etc.)    │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 지연 시간 분석 (Latency Budget)

### 목표: 10ms 이하 (p99)

| 구성 요소 | 예산 (ms) | 비고 |
|-----------|-----------|------|
| 네트워크 수신 | 0.5 | L4 로드밸런서 → API Gateway |
| API Gateway 처리 | 1.0 | 인증, 라우팅, rate limiting |
| Risk Engine | 2.0 | 위험 평가 로직 |
| OWASP Scanner | 3.0 | 실시간 취약점 스캔 |
| 캐시 조회 | 0.5 | Redis/AeroSpike |
| 직렬화/응답 | 1.0 | JSON/MessagePack |
| 네트워크 전송 | 0.5 | 응답 전송 |
| **여유** | **1.5** | 버퍼 |
| **총계** | **10.0** | |

---

## 4. 기술 스택 선정

### 4.1 핵심 언어
| 용도 | 언어 | 이유 |
|------|------|------|
| API Gateway | Rust | 메모리 안전성 + zero-cost abstractions |
| Risk Engine | Rust/C++ | 최고의 성능, 예측 가능한 지연 시간 |
| OWASP Scanner | Rust | 병렬 처리, 메모리 안전성 |
| Benchmarks | Rust/C++ | 정확한 성능 측정 |

### 4.2 네트워크 및 I/O
| 구성 요소 | 기술 | 이유 |
|-----------|------|------|
| HTTP Server | hyper (Rust) | 빠르고 안정적인 async HTTP |
| 직렬화 | MessagePack | JSON 대비 빠른 파싱, 작은 크기 |
| gRPC | tonic (Rust) | 고성능 RPC |
| Message Queue | ZeroMQ | 저지연 메시징 |

### 4.3 데이터 저장
| 용도 | 기술 | 이유 |
|------|------|------|
| 캐시 | Redis | 인메모리, 빠른 조회 |
| 고성능 캐시 | AeroSpike | 예측 가능한 지연 시간 |
| 설정 | etcd | 분산 설정 관리 |

### 4.4 커널 바이패스 (Phase 4)
| 기술 | 용도 | 예상 효과 |
|------|------|-----------|
| DPDK | 패킷 처리 가속 | 네트워크 지연 50% 감소 |
| RDMA | 원격 메모리 접근 | 마이크로초 수준 지연 |
| io_uring | 비동기 I/O | 시스템 콜 오버헤드 제거 |

---

## 5. 메모리 관리 전략

### 5.1 메모리 풀링
```rust
// Object Pool Pattern
pub struct ObjectPool<T> {
    pool: crossbeam::queue::ArrayQueue<T>,
    factory: Box<dyn Fn() -> T>,
}

impl<T> ObjectPool<T> {
    pub fn acquire(&self) -> T {
        self.pool.pop().unwrap_or_else(|| (self.factory)())
    }
    
    pub fn release(&self, obj: T) {
        let _ = self.pool.push(obj);
    }
}
```

### 5.2 Lock-Free 데이터 구조
- `crossbeam` 채널: MPSC 큐
- `parking_lot` 락: 경량 동기화
- `dashmap`: 병렬 해시맵

### 5.3 메모리 레이아웃 최적화
- 구조체 필드 정렬 (cache line: 64 bytes)
- SoA (Structure of Arrays) 패턴
- False sharing 방지

---

## 6. 병렬 처리 아키텍처

### 6.1 스레드 모델
```
┌─────────────────────────────────────────┐
│           Thread Architecture           │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Network │  │ Network │  │ Network │ │  (IO Threads)
│  │ Thread  │  │ Thread  │  │ Thread  │ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       └─────────────┼─────────────┘     │
│                     ▼                   │
│            ┌─────────────┐              │
│            │   Work      │              │  (Disruptor Pattern)
│            │   Queue     │              │
│            └──────┬──────┘              │
│                   │                     │
│       ┌───────────┼───────────┐         │
│       ▼           ▼           ▼         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Worker  │  │ Worker  │  │ Worker  │ │  (CPU-bound)
│  │ Thread  │  │ Thread  │  │ Thread  │ │
│  │ (Core 1)│  │ (Core 2)│  │ (Core N)│ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 CPU 코어 핀닝
- 각 worker thread를 전용 CPU 코어에 바인딩
- NUMA-aware 메모리 할당
- 컨텍스트 스위칭 최소화

---

## 7. OWASP 실시간 스캐너 설계

### 7.1 스캔 파이프라인
```
┌─────────────────────────────────────────────────────────────┐
│              OWASP Real-time Scanner Pipeline               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Input   │──▶│  Parser  │──▶│  Analyzer│──▶│  Scorer  │ │
│  │          │   │          │   │          │   │          │ │
│  │ Contract │   │ Bytecode │   │ Vuln     │   │ Risk     │ │
│  │ Address  │   │ / AST    │   │ Detection│   │ Score    │ │
│  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘ │
│                                                     │       │
│                              ┌──────────────────────┘       │
│                              ▼                              │
│                       ┌──────────────┐                      │
│                       │   Output     │                      │
│                       │   (JSON)     │                      │
│                       └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 OWASP Top 10 Coverage
| 순위 | 취약점 | 탐지 방법 | 예상 시간 |
|------|--------|-----------|-----------|
| 1 | Access Control | 정적 분석 | 1ms |
| 2 | Arithmetic Issues | 패턴 매칭 | 0.5ms |
| 3 | Delegatecall | 바이트코드 분석 | 0.5ms |
| 4 | Oracle Manipulation | 외부 데이터 검증 | 1ms |
| 5 | Reentrancy | CFG 분석 | 1ms |
| 6 | Unchecked Calls | 정적 분석 | 0.5ms |
| 7 | Timestamp Dependence | 패턴 매칭 | 0.3ms |
| 8 | tx.origin | 바이트코드 분석 | 0.2ms |
| 9 | Flash Loan | 거래 패턴 분석 | 1ms |
| 10 | Input Validation | 정적 분석 | 0.5ms |

---

## 8. 배포 아키텍처

### 8.1 컨테이너화
- **Base Image:** distroless/cc (최소 공격면)
- **Runtime:** containerd (Docker 대비 적은 오버헤드)
- **Orchestration:** Kubernetes (HPA, PDB)

### 8.2 네트워크 토폴로지
```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Topology                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│     Internet         DMZ              Internal              │
│        │              │                  │                  │
│        ▼              ▼                  ▼                  │
│   ┌─────────┐    ┌─────────┐       ┌─────────┐             │
│   │   WAF   │───▶│   LB    │──────▶│   API   │             │
│   │         │    │ (L4)    │       │  Pods   │             │
│   └─────────┘    └─────────┘       └────┬────┘             │
│                                          │                  │
│                                     ┌────┴────┐             │
│                                     │  Cache  │             │
│                                     │ Cluster │             │
│                                     └────┬────┘             │
│                                          │                  │
│                                     ┌────┴────┐             │
│                                     │ Scanner │             │
│                                     │  Pods   │             │
│                                     └─────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. 모니터링 및 관측성

### 9.1 메트릭
| 카테고리 | 메트릭 | 목표 |
|----------|--------|------|
| Latency | p50, p99, p999 | < 5ms, < 10ms, < 20ms |
| Throughput | RPS | > 100,000 |
| Error Rate | 5xx, 4xx | < 0.1%, < 1% |
| Resource | CPU, Memory | < 70% |

### 9.2 분산 추적
- OpenTelemetry 통합
- Jaeger를 통한 요청 흐름 추적
- 크리티컬 경로 분석

---

## 10. 다음 단계

### Phase 1 완료 기준
- [ ] 아키텍처 설계 문서 완성
- [ ] 기술 스택 POC 완료
- [ ] 벤치마크 환경 구성
- [ ] Hello World API (Rust) 구현

### Phase 2 준비
- 핵심 API 개발 시작
- 성능 벤치마크 수행
- FPGA 가속 검토

---

## 참고 문서
- research/hft-analysis-2026-02-25.md
- https://github.com/tokio-rs/tokio
- https://github.com/crossbeam-rs/crossbeam
- https://www.dpdk.org/
