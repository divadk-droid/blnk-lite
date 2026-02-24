# BLNK Risk Gate - Agent Guide

## 프로젝트 개요

**BLNK Risk Gate**는 AI 에이전트를 위한 온체인 사전 거래 리스크 인프라입니다.

### 핵심 가치
- **1 RPC call**로 즉시 PASS/WARN/BLOCK 판정
- **2ms** 응답 시간 (캐시 히트)
- **50% 소각** 토크노믹스 (수수료의 50% 자동 소각)
- **4단계 스테이킹** (FREE → BASIC → PRO → ENTERPRISE)

---

## 현재 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| 스마트 컨트랙트 | 완료 | 4개 컨트랙트 작성 |
| 백엔드 API | 완료 | 30+ 엔드포인트 |
| 프론트엔드 | 완료 | Next.js 대시보드 |
| 문서화 | 완료 | 20+ 문서 |
| 검증 | 완료 | 96% 점수 |
| 테스트넷 | 준비완료 | 배포 가능 |

---

## 아키텍처

```
AI Agent → BLNK API → Risk Decision
                ↓
        ┌───────┼───────┐
        ↓       ↓       ↓
    Staking  Payment  Alpha Feed
    Contract   Gate    (Platinum)
```

---

## 기술 스택

| 구성 요소 | 기술 |
|----------|------|
| 스마트 컨트랙트 | Solidity + OpenZeppelin |
| 백엔드 | Node.js + Express |
| 프론트엔드 | Next.js + TailwindCSS |
| 캐시 | SQLite (Redis 업그레이드) |
| 네트워크 | Base (L2) |
| 배포 | Railway + Vercel |

---

## 파일 구조

```
blnk-backend/
├── contracts/          # 스마트 컨트랙트
│   ├── BLNKToken.sol
│   ├── BlnkPaymentGate.sol
│   ├── BlnkPaymentGateV2.sol
│   └── BLNKLiquidityManager.sol
├── src/               # 백엔드 소스
│   ├── lite-server.js
│   ├── custom-risk-engine.js
│   ├── payment-listener.js
│   ├── alpha-feed.js
│   ├── websocket-alerts.js
│   ├── treasury-system.js
│   ├── i18n.js
│   └── report-generator.js
├── frontend/          # 프론트엔드
│   └── burn-tracker/
├── scripts/           # 배포/테스트 스크립트
│   ├── deploy-sepolia.js
│   ├── deploy-base.js
│   ├── test-sepolia.js
│   ├── verify-code.js
│   └── token-metrics.js
├── test/              # 테스트
│   └── integration.test.js
└── docs/              # 문서 (20+)
    ├── README.md
    ├── VERIFICATION_REPORT.md
    ├── LAUNCH_CHECKLIST.md
    ├── DEPLOYMENT_GUIDE.md
    ├── MULTISIG_SETUP.md
    ├── BUG_BOUNTY.md
    ├── INCIDENT_RESPONSE.md
    ├── ROADMAP.md
    └── ...
```

---

## API 엔드포인트

### 코어
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/gate` | POST | 리스크 게이트 |
| `/api/v1/scan` | POST | 토큰 스캔 |
| `/api/v1/policy/check` | POST | 정책 검사 |

### A2A
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/alpha/trending` | GET | 알파 피드 (Platinum) |
| `/api/v1/treasury/stats` | GET | 트레저리 통계 |
| `/api/v1/websocket/stats` | GET | WebSocket 상태 |

### 리포트
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/v1/reports/pdf` | POST | PDF 리포트 |
| `/api/v1/reports/excel` | POST | Excel 리포트 |
| `/api/v1/reports/portfolio` | POST | 포트폴리오 리포트 |

---

## 토큰 유틸리티

### 스테이킹 티어
| 티어 | 스테이킹 | 일일 호출 | 특전 |
|------|---------|----------|------|
| FREE | 0 BLNK | 5 | 기본 |
| BASIC | 500 BLNK | 500 | 표준 |
| PRO | 5,000 BLNK | 2,000 | 알파 피드 |
| ENTERPRISE | 50,000 BLNK | 10,000 | 전부 |

### 토크노믹스
- **총공급**: 1,000,000,000 BLNK
- **소각**: 수수료의 50% 자동 소각
- **분배**: 50% 발행자, 15% 팀, 15% 마케팅, 10% 커뮤니티, 10% 트레저리

---

## 주요 문서

| 문서 | 목적 |
|------|------|
| `VERIFICATION_REPORT.md` | 검증 보고서 (96%) |
| `LAUNCH_CHECKLIST.md` | 런칭 체크리스트 |
| `DEPLOYMENT_GUIDE.md` | 배포 가이드 |
| `SEPOLIA_DEPLOYMENT.md` | 테스트넷 배포 |
| `MULTISIG_SETUP.md` | 멀티시그 설정 |
| `BUG_BOUNTY.md` | 버그 바운티 ($100K) |
| `INCIDENT_RESPONSE.md` | 인시던트 대응 |
| `ROADMAP.md` | 2026 로드맵 |

---

## 운영 정보

- **API**: https://blnk-lite-production.up.railway.app
- **대시보드**: https://burn.blnk.io (예정)
- **GitHub**: https://github.com/divadk-droid/blnk-lite
- **네트워크**: Base (Chain ID: 8453)
- **상태**: 테스트넷 준비완료

---

## 연락처

- **이메일**: token@blnk.io
- **디스코드**: https://discord.gg/blnk
- **트위터**: https://twitter.com/blnk_risk

---

**마지막 업데이트:** 2026-02-24  
**버전:** 2.0.0  
**상태:** 테스트넷 배포 준비완료
