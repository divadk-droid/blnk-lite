# BLNK Risk Gate - Improvement Plan

## 긴급 개선 (Critical Fixes)

### 1. WETH/USDC Gate Mismatch 해결
- [ ] WETH gate 로직 디버깅 `autoImplement`
- [ ] USDC gate 로직 디버깅 `autoImplement`
- [ ] 화이트리스트 vs 실제 분석 결과 비교
- [ ] 테스트 케이스 추가

**문제:** WETH/USDC가 화이트리스트에는 있지만 gate 분석 결과와 mismatch  
**원인:** 캐시된 결과 vs 실제 RPC 호출 결과 불일치 가능성  
**해결책:** 
1. 화이트리스트 우선순위 확인
2. 캐시 키 정규화 (소문자 변환)
3. gate 응답에 whitelist 필드 추가

**우선순위:** 긴급  
**담당:** 백엔드  
**목표일:** 2026-02-24

### 2. Cache 최적화
- [x] Cache TTL 동적 조정 `autoImplement`
- [x] Cache hit/miss 메트릭스 수집
- [ ] Redis 업그레이드 준비

**문제:** 캐시가 예상보다 효율적이지 않음  
**해결책:**
1. Gate 결과: 5분 → 15분 TTL 연장
2. Scan 결과: 1시간 → 3시간 TTL 연장
3. 인기 토큰 사전 캐싱 강화

**우선순위:** 높음  
**담당:** 백엔드  
**목표일:** 2026-02-25

---

## 수요 기반 개발 (Demand-Driven Development)

### aGDP.io Bounties 분석

**분석 일자:** 2026-02-24  
**출처:** https://agdp.io/bounties

#### 발견된 수요 패턴

| 카테고리 | 수요 내용 | BLNK 적용 가능성 | 우선순위 |
|---------|----------|-----------------|---------|
| **맞춤형 리스크 분석** | 프로젝트별 커스텀 리스크 스코어링 | 높음 | 1 |
| **실시간 모니터링** | 24/7 자동 알림 및 모니터링 | 높음 | 2 |
| **API 통합** | 타 서비스와의 연동 | 중간 | 3 |
| **다국어 지원** | 영어 외 언어 지원 | 중간 | 4 |
| **고급 보고서** | PDF/Excel 리포트 생성 | 중간 | 5 |

#### 구현 계획

- [ ] **커스텀 리스크 스코어링 엔진** `autoImplement`
  - 사용자 정의 가중치 설정
  - 프로젝트별 리스크 모델
  - 예상 단가: 500-1000 credits

- [ ] **실시간 웹소켓 알림** `autoImplement`
  - WebSocket 기반 실시간 업데이트
  - 커스텀 트리거 설정
  - 예상 단가: 200-500 credits/month

- [ ] **웹훅 통합** `autoImplement`
  - Discord/Slack/Telegram 웹훅
  - Zapier/Make 연동
  - 예상 단가: 100-300 credits

- [ ] **다국어 지원 (i18n)**
  - 한국어, 중국어, 일본어
  - 언어별 리스크 설명
  - 예상 단가: 물리 (기본)

- [ ] **PDF/Excel 리포트 생성**
  - 자동 리포트 생성 및 이메일 발송
  - 커스텀 템플릿
  - 예상 단가: 50-100 credits/report

---

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
- [x] 웹훅 처리 (invoice.paid, payment_failed) `autoImplement`
- [ ] 셀프서비스 업그레이드/다운그레이드

**우선순위:** 높음  
**담당:** 백엔드  
**목표일:** 2026-03-07

### 3. 프로 메트릭스
- [x] Prometheus 메트릭스 노출
- [x] Grafana 대시보드
- [x] P95/P99 지연 시간 추적 `autoImplement`
- [ ] 에러율 알림 `autoImplement`

**우선순위:** 중간  
**담당:** DevOps  
**목표일:** 2026-03-14

### 4. 멀티체인 지원
- [x] Base 네트워크 추가
- [x] Arbitrum 네트워크 추가
- [ ] 체인별 캐시 분리 `autoImplement`
- [ ] 체인 선택 파라미터 강화 `autoImplement`

**우선순위:** 중간  
**담당:** 백엔드  
**목표일:** 2026-03-21

### 5. 고급 분석 (Pro 티어)
- [x] 스토리지 슬롯 읽기 (owner, minter)
- [x] 이벤트 로그 분석 (Transfer, Mint)
- [ ] 유동성 풀 분석
- [ ] 홀더 분포 체크

**우선순위:** 낮음  
**담당:** 백엔드  
**목표일:** 2026-04-04

---

## 검토 중 (Under Review)

### 6. 온체인 $BLNK 검증
- [x] ERC20 잔고 조회 컨트랙트
- [ ] Merkle Proof 검증
- [ ] 스테이킹 복너스 계산

**우선순위:** 낮음  
**블로커:** 가스 비용 최적화 필요

### 7. 실시간 모니터링
- [ ] WebSocket 알림
- [x] Telegram 봇 명령어
- [x] Discord 봇 통합

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

- [x] MEV 보호 분석
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

## 토크노믹스 개선 (Tokenomics 2.0)

### 분석 결과
- **분석 일자:** 2026-02-24
- **참고:** ./Reference/tokenomics-analysis.md

### 현재 문제점

| 문제 | 현재 상태 | 개선 방향 |
|------|----------|----------|
| 토큰 수요 약함 | 옵션 기능 | 필수 기능 |
| 수익 순환 없음 | USDC만 수익 | 토큰 가치 연결 |
| 유동성 부족 | 미정 | 초기 유동성 확보 |
| 거버넌스 미흡 | 없음 | 점진적 도입 |

### 개선 방안

#### 1. 수요 창출 강화
- [ ] **스테이킹 기반 티어** `autoImplement`
  - FREE: 50 calls/day (제한적)
  - BASIC: 200 calls/day (500 $BLNK 스테이킹)
  - PRO: 1000 calls/day (5,000 $BLNK 스테이킹)
  - ENTERPRISE: 무제한 (50,000 $BLNK 스테이킹)
  - 최소 스테이킹 기간: 30일
  - 조기 해제 페널티: 10%

#### 2. 수익 순환 구조
- [ ] **Treasury 시스템** `autoImplement`
  - 서비스 수수료 100% → Treasury
  - 분배: 40% Buyback/Burn, 30% LP, 20% 개발, 10% 커뮤니티
  - 주 1회 자동 실행

#### 3. 유동성 관리
- [ ] **초기 유동성 공급**
  - 150M $BLNK + 10 ETH
  - 초기 가격: $0.001
  - LP 보상: 월 2% APR (24개월)

#### 4. 거버넌스 도입 (단계적)
- [ ] **Phase 1** (0-6개월): 팀 중심 + 피드백 수집
- [ ] **Phase 2** (6-12개월): 10,000+ $BLNK 홀더 투표권
- [ ] **Phase 3** (12개월+): 완전 DAO 전환

### 실행 로드맵

| 단계 | 기간 | 주요 작업 |
|------|------|----------|
| 준비 | 2주 | 스마트 컨트랙트, Treasury, Buyback |
| 런칭 | 1주 | 유동성 공급, 스테이킹 오픈 |
| 성장 | 지속 | Buyback 실행, LP 보상, 거버넌스 |

**우선순위:** 높음  
**목표일:** 2026-03-15

---

## 발행자 중심 토크노믹스 3.0 (Issuer-Friendly)

### 핵심 전략
**"수수료는 명분, 토큰 가치가 본전"**

### 문제 인식
- 수수료 모델: 월 $1K~$10K (제한적)
- 토큰 모델: $1M~$50M+ 가능 (100x~500x)

### 개선 방안

#### 1. 높은 발행자 할당 (50%)
- [ ] 스마트 컨트랙트 수정 `autoImplement`
- 발행자: 500M $BLNK (50%)
- 팀: 150M $BLNK (15%)
- 합계: 65% (발행자 중심)

#### 2. 낮은 초기 유동성 (2%)
- [ ] 초기 LP 20M $BLNK만 공급
- 초기 가격: $0.001
- 초기 시총: $200K
- 가격 조절 용이

#### 3. 토큰 필수 사용 정책
- [ ] 서비스 가격 재조정 `autoImplement`
- Bronze: 1,000 $BLNK 스테이킹 or 100 $BLNK/call
- Silver: 10,000 $BLNK 스테이킹 or 80 $BLNK/call
- Gold: 100,000 $BLNK 스테이킹 or 50 $BLNK/call
- Platinum: 1M $BLNK 스테이킹 (묶음)

#### 4. 소각 메커니즘
- [ ] 자동 소각 시스템 `autoImplement`
- 소각 분배: 50% Burn, 30% Treasury, 20% LP
- 공급 감소 → 가격 상승

#### 5. 발행자 수익 실현 전략
- [ ] 단계적 매도 시스템
- 1-3개월: 월 1% 매도
- 4-6개월: 월 2% 매도
- 7-12개월: 월 3% 매도
- 목표: $0.001 → $0.1 (100x)

### 예상 수익

| 시나리오 | 시총 | 발행자 수익 |
|---------|------|-----------|
| 보수적 | $1M | $500K+ |
| 낙관적 | $10M | $5M+ |
| 최고 | $100M | $50M+ |

### 참고 문서
- ./Reference/issuer-friendly-tokenomics.md
- ./PRICING_RESTRUCTURE.md

**우선순위:** 최상  
**목표일:** 2026-03-10

---

**마지막 업데이트:** 2026-02-24  
**다음 검토일:** 2026-03-01


## 자동 감지 (Auto-Detected)


### 2026-02-23
- [x] **WARNING** [logic] Gate decision mismatch for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
- [x] **WARNING** [logic] Gate decision mismatch for 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- [x] **WARNING** [cache] Cache may not be working optimally (자동 수정 가능: Check cache TTL and storage)


## Research Ideas

### 2026-02-23
- [x] MEV protection (from Trading Assistant Pro)
- [x] slippage prediction (from Trading Assistant Pro)
- [ ] risk scoring (from Portfolio Guardian)
- [x] alert system (from Portfolio Guardian)
- [x] vulnerability detection (from Smart Contract Auditor)


## 자동 생성 스킬 (Auto-Generated Skills)
*Generated by SkillGeneratorAgent*


### 2026-02-23
- [x] **git-commit-push** - Add, commit, and push in one command
  - Frequency: 10x, Saves: 30 seconds per commit
- [x] **git-status-short** - Quick git status with only changed files
  - Frequency: 5x, Saves: 5 seconds
- [x] **git-last-commits** - Show last N commits with stats
  - Frequency: 3x, Saves: 10 seconds
- [x] **deploy-quick** - Quick deploy with pre-checks
  - Frequency: 5x, Saves: 1 minute
- [x] **test-api** - Test all API endpoints
  - Frequency: 8x, Saves: 2 minutes
- [x] **test-cache** - Verify cache is working
  - Frequency: 4x, Saves: 30 seconds
- [x] **logs-tail** - Tail recent logs with filtering
  - Frequency: 6x, Saves: 10 seconds
- [x] **metrics-quick** - Quick metrics snapshot
  - Frequency: 4x, Saves: 15 seconds

### 2026-02-23
- [x] **WARNING** [logic] Gate decision mismatch for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
- [x] **WARNING** [logic] Gate decision mismatch for 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- [x] **WARNING** [cache] Cache may not be working optimally (자동 수정 가능: Check cache TTL and storage)

### 2026-02-23
- [x] **WARNING** [logic] Gate decision mismatch for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
- [x] **WARNING** [logic] Gate decision mismatch for 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- [x] **WARNING** [cache] Cache may not be working optimally (자동 수정 가능: Check cache TTL and storage)
