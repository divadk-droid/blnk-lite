# BLNK Risk Gate - Agent Onboarding Guide

## 1. 프로젝트 개요 (Executive Summary)

### 무엇인가?
**BLNK Risk Gate**는 Web3 스마트 컨트랙트 거래의 위험도를 실시간으로 평가하는 **리스크 관리 게이트웨이**입니다.

### 핵심 가치 제안
- **문제:** DeFi 사용자들은 스마트 컨트랙트의 취약점, 러그풀, 악성 코드를 식별하기 어려움
- **해결:** 거래 실행 전 자동으로 리스크를 스캔하고 PASS/WARN/BLOCK 결정 제공
- **차별점:** 10ms 이하 초저지연, AI 기반 이상 탐지, 멀티체인 지원

### 비즈니스 모델
- **B2C:** 개인 트레이더용 API (Pay-per-use, $1~$25)
- **B2B:** 기관용 SaaS (월 구독, $79~$2,999)
- **Marketplace:** ACP (Agent Commerce Protocol)에서 19개 Job Offering 등록

---

## 2. 시스템 아키텍처 (System Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  (Trading Bots, Wallets, dApps, Institutions)               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY                              │
│  • Rate Limiting  • Auth  • Routing  • Caching              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
┌───────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐
│   RISK      │ │    AI      │ │   ALPHA    │ │  REPORT    │
│   ENGINE    │ │  CONTENT   │ │   FEED     │ │ GENERATOR  │
│             │ │  SCANNER   │ │            │ │            │
│ • Token     │ │ • Deepfake │ │ • Whale    │ │ • PDF/Excel│
│   Safety    │ │ • Copyright│ │   Tracking │ │ • Charts   │
│ • Portfolio │ │ • C2PA     │ │ • Anomaly  │ │ • Export   │
│   Risk      │ │   Verify   │ │   Detect   │ │            │
└───────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
        │              │              │              │
        └──────────────┼──────────────┴──────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BLOCKCHAIN INTERACTION LAYER                   │
│  • Ethereum  • Base  • Arbitrum  • Optimism                 │
│  • On-chain Data  • Transaction Simulation  • Event Logs    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 컴포넌트 (Core Components)

### 3.1 Risk Assessment Engine
**위치:** `src/lite-analyzer.js`, `src/schema.js`

**기능:**
- 스마트 컨트랙트 취약점 스캔 (OWASP Top 10)
- 실시간 리스크 스코어 계산 (0-100)
- 거래 실행 전 PASS/WARN/BLOCK 결정

**입력:**
```json
{
  "token": "0x1234...",
  "actionType": "swap",
  "amount": "1000",
  "chain": "ethereum"
}
```

**출력:**
```json
{
  "decision": "PASS",
  "riskScore": 15,
  "riskLevel": "LOW",
  "checks": {
    "minting": "safe",
    "ownership": "renounced",
    "liquidity": "locked"
  }
}
```

### 3.2 AI Content Risk Scanner
**위치:** `src/modules/ai-content-scanner/`

**기능:**
- AI 생성 이미지/비디오 탐지
- 딥페이크 확률 계산
- 저작권 침해 스캔
- C2PA 메타데이터 검증

**사용 사례:** NFT 마켓플레이스, 크리에이터 플랫폼

### 3.3 HFT Risk API
**위치:** `src/modules/hft-risk-api/` (Rust), `src/api/routes/hft.js`

**기능:**
- 10ms 이하 초저지연 리스크 평가
- 고빈도 트레이딩용 실시간 스캔
- MEV 보호 신호

**타겟:** 퀀트 트레이딩 펌, MEV 봇

### 3.4 Alpha Feed
**위치:** `src/alpha-feed.js`

**기능:**
- 고래(Whale) 움직임 추적
- 스마트 머니 플로우 분석
- 이상 신호 탐지

---

## 4. 데이터 흐름 (Data Flow)

### 4.1 일반 거래 리스크 평가
```
1. Client → POST /api/v1/gate
2. API Gateway → Rate Limit Check
3. LiteAnalyzer → Token Contract Analysis
4. Schema Validation → Risk Score Calculation
5. Cache Store → Result Caching (TTL: 5min)
6. Response → Decision (PASS/WARN/BLOCK)
```

### 4.2 AI 콘텐츠 스캔
```
1. Client → POST /api/v1/ai-content/scan
2. Content Downloader → Fetch from URL
3. Detection Engines (Parallel):
   - Deepfake Detector
   - Copyright Checker
   - C2PA Verifier
4. Risk Score Aggregator
5. Response → Comprehensive Risk Report
```

---

## 5. 기술 스택 (Technology Stack)

| 레이어 | 기술 | 용도 |
|--------|------|------|
| **Frontend** | React, Web3.js | 대시보드, 월렛 연결 |
| **API Server** | Node.js, Express | REST API, WebSocket |
| **HFT Engine** | Rust, Tokio | 초저지연 리스크 평가 |
| **AI/ML** | Python, TensorFlow | 딥페이크 탐지, 이상 탐지 |
| **Cache** | SQLite, Redis | 데이터 캐싱, 세션 관리 |
| **Blockchain** | ethers.js, viem | 온체인 데이터 조회 |
| **Deployment** | Railway, Docker | 클라우드 호스팅 |

---

## 6. 프로젝트 구조 (Project Structure)

```
blnk-backend/
├── src/
│   ├── api/routes/           # API 엔드포인트
│   │   ├── ai-content.js     # AI 콘텐츠 스캔
│   │   ├── hft.js            # HFT 리스크 API
│   │   ├── alpha.js          # 알파 피드
│   │   ├── reports.js        # 리포트 생성
│   │   ├── creator.js        # 크리에이터 신용
│   │   └── validation.js     # 토큰 검증
│   ├── modules/
│   │   ├── ai-content-scanner/  # AI 콘텐츠 모듈
│   │   └── hft-risk-api/        # HFT Rust 모듈
│   ├── lite-server.js        # 메인 서버
│   ├── lite-analyzer.js      # 리스크 분석 엔진
│   ├── schema.js             # 데이터 모델/검증
│   ├── alpha-feed.js         # 알파 데이터 피드
│   ├── report-generator.js   # 리포트 생성기
│   └── ...
├── contracts/                # 스마트 컨트랙트 (Solidity)
├── scripts/                  # 자동화 스크립트
├── Reference/                # 리서치 문서
└── docs/                     # 기술 문서
```

---

## 7. 주요 API 엔드포인트 (Key API Endpoints)

| 메서드 | 엔드포인트 | 설명 | 가격 |
|--------|-----------|------|------|
| POST | `/api/v1/gate` | 거래 리스크 평가 | $1 |
| POST | `/api/v1/ai-content/scan` | AI 콘텐츠 스캔 | $2 |
| POST | `/api/v1/hft/risk-assess` | HFT 리스크 평가 | $0.50 |
| POST | `/api/v1/alpha/feed` | 알파 신호 피드 | $25 |
| POST | `/api/v1/reports/generate` | 리포트 생성 | $10 |
| POST | `/api/v1/creator/credit-score` | 크리에이터 신용 | $5 |
| POST | `/api/v1/validation/token-safety` | 토큰 안전성 검사 | $5 |

---

## 8. 자동화 에이전트 (Automation Agents)

### 8.1 Researcher Agent (4시간마다)
- **역할:** 신사업 발굴, 시장 트렌드 모니터링
- **출력:** `Reference/revenue-research-YYYY-MM-DD.md`
- **키워드:** AI, 핀테크, IoT, RegTech, 비즈니스 모델

### 8.2 Auto-Development Agent (4시간마다)
- **역할:** PLAN.md 기반 코드 자동 구현
- **출력:** 신규 모듈, git commit/push
- **제한:** 패턴 매칭 가능한 항목만

### 8.3 Auto-Improvement Agent (4시간마다)
- **역할:** API 테스트, 성능 모니터링
- **출력:** PROGRESS.md 업데이트, 이슈 탐지

### 8.4 Skill Generator Agent (4시간마다)
- **역할:** 반복 작업 자동화 스킬 생성
- **출력:** `src/skills/`, `src/commands/`

### 8.5 Sales Agent (4시간마다)
- **역할:** 리드 생성, Job Offering 등록
- **출력:** `Reference/sales-plan-YYYY-MM-DD.md`
- **플랫폼:** ACP (Agent Commerce Protocol)

---

## 9. 수익화 현황 (Monetization Status)

### ACP Job Offering (19개 등록)

| 카테고리 | 서비스 수 | 평균 가격 | 월 예상 수익 |
|---------|----------|----------|------------|
| Validation | 4개 | $6.50 | - |
| Portfolio | 3개 | $30 | - |
| Monitoring | 3개 | $44 | - |
| AI Content | 1개 | $2 | - |
| HFT | 1개 | $0.50 | - |
| Alpha | 1개 | $25 | - |
| Reports | 1개 | $10 | - |
| Creator | 1개 | $5 | - |
| Execution | 1개 | $1 | - |
| Discovery | 2개 | $3 | - |

**목표:** 일일 1000건 API 호출 시 월 $15,000+ 수익

---

## 10. 개발 로드맵 (Development Roadmap)

### Phase 1: MVP (완료)
- [x] 기본 리스크 평가 API
- [x] 스마트 컨트랙트 배포
- [x] ACP Job Offering 13개 등록

### Phase 2: 확장 (진행 중)
- [x] AI 콘텐츠 스캐너
- [x] HFT Risk API
- [x] 6개 신규 API 엔드포인트
- [ ] 테스트넷 배포
- [ ] 외부 감의 (Certik)

### Phase 3: 성숙 (예정)
- [ ] 모바일 앱
- [ ] 거버넌스 DAO
- [ ] 멀티체인 확장
- [ ] 기관 파트너십

---

## 11. 핵심 용어 (Key Terminology)

| 용어 | 설명 |
|------|------|
| **Risk Score** | 0-100 척도의 위험도 (0=안전, 100=위험) |
| **Gate Decision** | PASS(통과)/WARN(경고)/BLOCK(차단) 결정 |
| **Deepfake** | AI로 조작된 가짜 이미지/비디오 |
| **C2PA** | 콘텐츠 출처 및 진위성 인증 표준 |
| **MEV** | Miner Extractable Value, 블록 생성자의 이익 추출 |
| **SBT** | Soulbound Token, 양도 불가능한 신원 토큰 |
| **ACP** | Agent Commerce Protocol, 에이전트 간 거래 마켓플레이스 |

---

## 12. 연락처 및 리소스

- **GitHub:** `github.com/divadk-droid/blnk-lite`
- **API Base URL:** `https://blnk-lite-production.up.railway.app`
- **ACP Profile:** Virtuals Protocol - BLNK Agent
- **문서:** `docs/`, `Reference/` 폴더

---

## 13. 빠른 시작 (Quick Start)

```bash
# 1. 저장소 클론
git clone https://github.com/divadk-droid/blnk-lite.git
cd blnk-backend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 4. 서버 실행
npm start

# 5. API 테스트
curl -X POST http://localhost:3000/api/v1/gate \
  -H "Content-Type: application/json" \
  -d '{"token":"0x1234...","actionType":"swap"}'
```

---

**문서 버전:** 1.0  
**마지막 업데이트:** 2026-02-25  
**다음 검토:** 2026-03-01