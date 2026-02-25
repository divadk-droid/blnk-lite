# HFT Risk API - Developer Guide

## 프로젝트 구조
```
src/modules/hft-risk-api/
├── src/
│   ├── main.rs              # 애플리케이션 진입점
│   ├── config/              # 설정 관리
│   ├── handlers/            # HTTP 요청 핸들러
│   ├── models/              # 데이터 모델
│   ├── risk/                # 리스크 평가 엔진
│   └── scanner/             # OWASP 스캐너
│       └── rules/           # 스캐닝 규칙
├── benches/                 # 성능 벤치마크
├── config/                  # 설정 파일
├── docs/                    # 문서
└── tests/                   # 통합 테스트
```

## 개발 환경 설정

### 요구사항
- Rust 1.76+
- Redis 7.0+
- (선택) Docker

### 빌드
```bash
cd src/modules/hft-risk-api

# 개발 빌드
cargo build

# 릴리즈 빌드 (최적화)
cargo build --release
```

### 실행
```bash
# 기본 설정으로 실행
cargo run

# 환경 변수 설정
export BIND_ADDRESS=0.0.0.0:8080
export TARGET_LATENCY_MS=10
cargo run
```

### 테스트
```bash
# 단위 테스트
cargo test

# 벤치마크
cargo bench

# 문서 테스트
cargo test --doc
```

## API 엔드포인트

### Health Check
```
GET /health
```

### Risk Assessment
```
POST /api/v1/risk/assess
Content-Type: application/json

{
  "contract_address": "0x...",
  "chain": "ethereum",
  "amount": 1000.0
}
```

### Contract Assessment
```
GET /api/v1/risk/contract/{address}
```

### Metrics
```
GET /metrics
```

## OWASP 스캐너 규칙

현재 구현된 규칙:
1. **ACCESS_CONTROL** - 접근 권한 검증
2. **ARITHMETIC** - 정수 오버플로우/언더플로우
3. **DELEGATECALL** - 위임 호출 취약점
4. **ORACLE_MANIPULATION** - 오라클 조작
5. **REENTRANCY** - 재진입 공격
6. **UNCHECKED_CALL** - 검증되지 않은 호출
7. **TIMESTAMP_DEPENDENCE** - 타임스탬프 의존성
8. **TX_ORIGIN** - tx.origin 사용
9. **FLASH_LOAN** - 플래시론 공격
10. **INPUT_VALIDATION** - 입력 검증

## 성능 최적화 가이드

### 1. 컴파일 최적화
```toml
[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

### 2. 메모리 풀링
```rust
use crossbeam::queue::ArrayQueue;

pub struct ObjectPool<T> {
    pool: ArrayQueue<T>,
}
```

### 3. Lock-Free 구조
- `crossbeam` 채널 사용
- `dashmap`으로 병렬 해시맵
- `parking_lot`으로 경량 락

## 배포

### Docker
```bash
docker build -t hft-risk-api .
docker run -p 8080:8080 hft-risk-api
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 모니터링

### 메트릭
- Prometheus 엔드포인트: `/metrics`
- 지연 시간: `http_request_duration_seconds`
- 처리량: `http_requests_total`
- 오류율: `http_errors_total`

### 로깅
- JSON 형식 로그
- OpenTelemetry 통합 예정

## 기여 가이드
1. Fork the repository
2. Create a feature branch
3. Run tests: `cargo test`
4. Run clippy: `cargo clippy -- -D warnings`
5. Submit PR

## 참고 문서
- [Architecture](architecture.md)
- [Benchmarks](../benchmarks/README.md)
- [OWASP Smart Contract Top 10](https://owasp.org/www-project-smart-contract-top-10/)
