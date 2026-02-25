# Solana Integration Architecture

## 개요
BLNK Risk Gate의 Solana 지원을 위한 아키텍처 설계 문서

## Solana 특성

| 특성 | Ethereum | Solana | 영향 |
|-----|----------|--------|------|
| **계정 모델** | EOA/Contract | Program Derived Address (PDA) | 리스크 평가 로직 변경 필요 |
| **트랜잭션** | 단일 | Instruction 배치 | 다중 instruction 분석 필요 |
| **언어** | Solidity | Rust/C | 바이트코드 분석 방식 다름 |
| **TPS** | ~15 | ~65,000 | 실시간 모니터링 부하 증가 |
| **피** | 가변 (gas) | 고정 (lamports) | 경제적 공격 벡터 다름 |

## 아키텍처 변경사항

```
┌─────────────────────────────────────────────────────────────┐
│                     BLNK Risk Gate                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   EVM Module │  │ Solana Module│  │  Other Chains│     │
│  │  (Existing)  │  │   (New)      │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           ▼                                │
│              ┌────────────────────────┐                    │
│              │   Chain Abstraction    │                    │
│              │      Layer             │                    │
│              └────────────────────────┘                    │
│                           │                                │
│                           ▼                                │
│              ┌────────────────────────┐                    │
│              │   Risk Engine Core     │                    │
│              └────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Solana Module 구성요소

### 1. Solana RPC Client
```typescript
// src/modules/solana/rpc-client.ts
interface SolanaConfig {
  rpcUrl: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}

class SolanaRpcClient {
  async getAccountInfo(address: string): Promise<AccountInfo>;
  async getProgramAccounts(programId: string): Promise<AccountInfo[]>;
  async simulateTransaction(instructions: Instruction[]): Promise<SimulationResult>;
}
```

### 2. Program Analyzer
```typescript
// src/modules/solana/program-analyzer.ts
interface ProgramAnalysis {
  programId: string;
  isVerified: boolean;
  upgradeAuthority: string | null;
  riskFactors: RiskFactor[];
}

class SolanaProgramAnalyzer {
  async analyzeProgram(programId: string): Promise<ProgramAnalysis>;
  async detectRugPullPatterns(account: AccountInfo): Promise<boolean>;
}
```

### 3. Transaction Simulator
```typescript
// src/modules/solana/tx-simulator.ts
interface SimulationResult {
  success: boolean;
  logs: string[];
  accountsModified: string[];
  riskScore: number;
}

class SolanaTxSimulator {
  async simulate(instructions: Instruction[]): Promise<SimulationResult>;
}
```

## API 엔드포인트 추가

| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/v1/solana/gate` | Solana 트랜잭션 리스크 평가 |
| `POST /api/v1/solana/program` | Program 분석 |
| `GET /api/v1/solana/account/:address` | 계정 정보 조회 |

## 리스크 평가 기준

### Solana 특화 리스크

| 리스크 유형 | 설명 | 심각도 |
|-----------|------|--------|
| **PDA Hijacking** | PDA 시드 조작 | 높음 |
| **Re-initialization** | 계정 재초기화 | 높음 |
| **Authority Check Bypass** | 권한 검증 우회 | 높음 |
| **Arithmetic Overflow** | 산술 오버플로우 | 중간 |
| **CPI Reentrancy** | Cross-Program Invocation 재진입 | 중간 |
| **Rent Exemption** | Rent 면제 실패 | 낮음 |

## 개발 로드맵

### Phase 1: 기초 (4주)
- [ ] Solana RPC 클라이언트 구현
- [ ] 기본 계정 정보 조회
- [ ] Program IDL 파싱

### Phase 2: 분석 (6주)
- [ ] Program 바이트코드 분석
- [ ] 취약점 패턴 탐지
- [ ] 트랜잭션 시뮬레이션

### Phase 3: 통합 (4주)
- [ ] API 엔드포인트 구현
- [ ] 기존 Risk Engine 통합
- [ ] 테스트 및 검증

### Phase 4: 고도화 (4주)
- [ ] 실시간 모니터링
- [ ] MEV 보호 (Jito 연동)
- [ ] 성능 최적화

## 리소스 요구사항

| 항목 | 수량 | 기간 |
|-----|------|------|
| Rust 개발자 | 2명 | 4개월 |
| Solana 전문가 | 1명 | 2개월 |
| DevOps | 1명 | 1개월 |
| **총 예산** | **$80K** | **4개월** |

## 의존성

```json
{
  "@solana/web3.js": "^1.87.0",
  "@solana/spl-token": "^0.3.0",
  "@coral-xyz/anchor": "^0.29.0"
}
```

## 참고자료

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://anchor-lang.com/)
- [Solana Security Best Practices](https://solana.com/docs/programs/security)