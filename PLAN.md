# BLNK Risk Gate - Improvement Plan

## 진행 중 (In Progress)

### 1. ACP 마켓 등록
- [x] Virtuals Protocol ACP Seller Portal 등록
- [ ] 오퍼링 13개 등록 완료
- [ ] 토큰 유틸리티 문서화

**우선순위:** 높음  
**담당:** 마케팅/BD  
**목표일:** 2026-02-28

---

## 예정 (Planned)

### 2. 결제 인프라 강화
- [x] Stripe 구독 연동
- [x] API 키 자동 발급 시스템
- [ ] 웹훅 처리 (invoice.paid, payment_failed)
- [ ] 셀프서비스 업그레이드/다운그레이드

**우선순위:** 높음  
**담당:** 백엔드  
**목표일:** 2026-03-07

### 3. 프로 메트릭스
- [x] Prometheus 메트릭스 노출
- [x] Grafana 대시보드
- [ ] P95/P99 지연 시간 추적
- [ ] 에러율 알림

**우선순위:** 중간  
**담당:** DevOps  
**목표일:** 2026-03-14

### 4. 멀티체인 지원
- [x] Base 네트워크 추가
- [x] Arbitrum 네트워크 추가
- [ ] 체인별 캐시 분리
- [ ] 체인 선택 파라미터 강화

**우선순위:** 중간  
**담당:** 백엔드  
**목표일:** 2026-03-21

### 5. 고급 분석 (Pro 티어)
- [ ] 스토리지 슬롯 읽기 (owner, minter)
- [ ] 이벤트 로그 분석 (Transfer, Mint)
- [ ] 유동성 풀 분석
- [ ] 홀더 분포 체크

**우선순위:** 낮음  
**담당:** 백엔드  
**목표일:** 2026-04-04

---

## 검토 중 (Under Review)

### 6. 온체인 $BLNK 검증
- [ ] ERC20 잔고 조회 컨트랙트
- [ ] Merkle Proof 검증
- [ ] 스테이킹 복너스 계산

**우선순위:** 낮음  
**블로커:** 가스 비용 최적화 필요

### 7. 실시간 모니터링
- [ ] WebSocket 알림
- [ ] Telegram 봇 명령어
- [ ] Discord 봇 통합

**우선순위:** 낮음  
**블로커:** 사용자 요청 대기

---

## 완료 (Completed)

### 2026-02-23
- [x] Lite 모드 서버 배포
- [x] 1 RPC call 게이트 구현
- [x] SQLite 캐시 구현
- [x] 4티어 레이트리밋
- [x] Policy Pack 4개 정책
- [x] 로깅 시스템
- [x] 일일 리포트
- [x] 캐시 워머
- [x] 알림 시스템
- [x] ACP 오퍼링 스펙

---

## 아이디어 백로그

- [ ] MEV 보호 분석
- [ ] 프론트러닝 탐지
- [ ] 거래 슬리피지 예측
- [ ] 가격 예측 (ML)
- [ ] 커뮤니티 정책 공유
- [ ] 감사 리포트 자동 생성

---

## 우선순위 변경 로그

| 날짜 | 변경 사항 | 사유 |
|------|----------|------|
| 2026-02-23 | ACP 등록 우선순위 상향 | 사용자 유치 병목 |
| 2026-02-23 | Stripe 연동 우선순위 상향 | 매출 검증 필요 |

---

**마지막 업데이트:** 2026-02-23  
**다음 검토일:** 2026-03-01


## 자동 감지 (Auto-Detected)


### 2026-02-23
- [ ] **WARNING** [logic] Gate decision mismatch for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
- [ ] **WARNING** [logic] Gate decision mismatch for 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- [ ] **WARNING** [cache] Cache may not be working optimally (자동 수정 가능: Check cache TTL and storage)


## Research Ideas

### 2026-02-23
- [ ] MEV protection (from Trading Assistant Pro)
- [ ] slippage prediction (from Trading Assistant Pro)
- [ ] risk scoring (from Portfolio Guardian)
- [ ] alert system (from Portfolio Guardian)
- [ ] vulnerability detection (from Smart Contract Auditor)
