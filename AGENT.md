# BLNK Risk Gate - Agent Guide

## 프로젝트 개요

**BLNK Risk Gate**는 AI 에이전트를 위한 온체인 사전 거래 리스크 인프라입니다.

### 핵심 가치
- **1 RPC call**로 즉시 PASS/WARN/BLOCK 판정
- **2ms** 응답 시간 (캐시 히트)
- **100회/일 물리** 물리 티어
- **4단계 구독** 모델 (FREE → BASIC → PRO → ENTERPRISE)

---

## 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │────▶│  BLNK API   │────▶│  Response   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌──────────┐
        │  Cache  │  │  Policy │  │  Logger  │
        │ SQLite  │  │  Pack   │  │          │
        └─────────┘  └─────────┘  └──────────┘
```

---

## 기술 스택

| 구성 요소 | 기술 |
|----------|------|
| 서버 | Node.js + Express |
| 캐시 | SQLite (파일 기반) |
| RPC | Public RPC (Llama) / Alchemy (Pro) |
| 배포 | Railway |
| 분석 | Ethers.js + Bytecode 패턴 매칭 |

---

## 핵심 파일 구조

```
blnk-backend/
├── src/
│   ├── lite-server.js      # 메인 서버
│   ├── lite-analyzer.js    # 1 RPC 분석기
│   ├── sqlite-cache.js     # SQLite 캐시
│   ├── rate-limiter.js     # 티어 기반 제한
│   ├── policy-pack.js      # 정책 팩
│   ├── logger.js           # 요청 로깅
│   ├── alert-system.js     # 알림 시스템
│   └── payment.js          # API 키 관리
├── scripts/
│   └── cache-warmer.js     # 캐시 워밍
├── ACP_OFFERING.json       # ACP 등록 스펙
└── README.md               # 사용자 가이드
```

---

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 가격 |
|-----------|--------|------|------|
| `/api/v1/gate` | POST | 사전 거래 리스크 게이트 | $1/100회 |
| `/api/v1/policy/check` | POST | 정책 준수 검사 | $15/회 |
| `/api/v1/policies` | GET | 정책 목록 | 물리 |
| `/health` | GET | 헬스체크 | 물리 |
| `/version` | GET | 버전 정보 | 물리 |
| `/metrics` | GET | 일일 메트릭 | 물리 |

---

## 토큰 유틸리티

**$BLNK는 결제 수단이 아닙니다.**

| 티어 | 일일 호출 | $BLNK 보유 | 구독료 |
|------|----------|-----------|--------|
| FREE | 100 | 0 | $0 |
| BASIC | 500 | 100 | $19/월 |
| PRO | 2,000 | 500 | $99/월 |
| ENTERPRISE | 10,000 | 2,500 | $499/월 |

**모델:** Hold-to-Unlock (보유만으로 권리 활성화)

---

## 운영 정보

- **배포 URL:** https://blnk-lite-production.up.railway.app
- **GitHub:** https://github.com/divadk-droid/blnk-lite
- **상태:** ✅ 프로덕션 준비 완료
- **업타임:** 99.9%+

---

## 관련 문서

- `PLAN.md` - 개선 계획
- `PROGRESS.md` - 진행 로그
- `README.md` - 사용자 가이드
- `TOKEN_UTILITY.md` - 토큰 유틸리티
- `ACP_OFFERING.json` - ACP 등록 스펙

---

## 연락처

- 문의: token@blnk.io
- 지원: https://discord.gg/blnk

---

**마지막 업데이트:** 2026-02-23  
**버전:** 1.0.0  
**상태:** 운영 준비 완료
