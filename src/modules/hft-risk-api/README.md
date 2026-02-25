# HFT Risk API

HFT(고빈도 거래) 특화 실시간 위험 평가 API

## 목표
- **API 응답 시간:** 10ms 이하 (p99)
- **처리량:** 100,000+ TPS
- **OWASP Smart Contract Top 10** 실시간 스캔

## 기술 스택
- **언어:** Rust
- **런타임:** Tokio (async)
- **HTTP:** Hyper
- **캐싱:** Redis/AeroSpike
- **직렬화:** MessagePack

## 빠른 시작

### 요구사항
- Rust 1.76+
- Redis 7.0+

### 설치 및 실행
```bash
# 저장소 클론
git clone <repository>
cd src/modules/hft-risk-api

# 빌드
./build.sh

# 실행
export BIND_ADDRESS=0.0.0.0:8080
cargo run --release
```

### API 사용 예시
```bash
# Health check
curl http://localhost:8080/health

# Risk assessment
curl -X POST http://localhost:8080/api/v1/risk/assess \
  -H "Content-Type: application/json" \
  -d '{
    "contract_address": "0x...",
    "chain": "ethereum",
    "amount": 1000.0
  }'
```

## 프로젝트 구조
```
src/
├── main.rs          # 애플리케이션 진입점
├── config/          # 설정 관리
├── handlers/        # HTTP 핸들러
├── models/          # 데이터 모델
├── risk/            # 리스크 엔진
└── scanner/         # OWASP 스캐너
```

## 문서
- [Architecture](docs/architecture.md)
- [Developer Guide](docs/README.md)
- [Benchmarks](benchmarks/README.md)

## 로드맵
- Phase 1: 저지연 아키텍처 설계 및 벤치마크 (2주)
- Phase 2: 핵심 API 최적화 (3-4주)
- Phase 3: OWASP 실시간 스캐너 구현 (2-3주)
- Phase 4: FPGA POC 및 성능 테스트 (4-6주)
- Phase 5: 통합 및 부하 테스트 (2-3주)

## 라이선스
Proprietary - BLNK Team
