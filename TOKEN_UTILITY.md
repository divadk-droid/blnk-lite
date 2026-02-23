# $BLNK Token Utility

## 핵심 원칙

> **$BLNK는 결제 수단이 아닙니다.**  
> **$BLNK는 성능 잠금장치(Performance Unlock)입니다.**

---

## 유틸리티 구조

### 1. 티어 잠금 해제 (Tier Unlock)

| 티어 | 일일 호출 | $BLNK 보유 필요 | 결제 수단 |
|------|----------|----------------|----------|
| FREE | 100 | 0 | 없음 |
| BASIC | 500 | **100 $BLNK** | USDC/카드 $19/월 |
| PRO | 2,000 | **500 $BLNK** | USDC/카드 $99/월 |
| ENTERPRISE | 10,000 | **2,500 $BLNK** | USDC/카드 $499/월 |

**핵심:** $BLNK를 소각하지 않습니다. 보유만으로 권리가 활성화됩니다.

---

### 2. 우선순위 큐 (Priority Queue)

```
[ENTERPRISE] ████████████████████  P0 - Instant
[PRO]        ████████████████    P1 - <50ms
[BASIC]      ████████████        P2 - <100ms
[FREE]       ████████            P3 - <200ms
```

트래픽 폭주 시 높은 티어가 먼저 처리됩니다.

---

### 3. 캐시 TTL 확장

| 티어 | Gate Cache | Scan Cache |
|------|-----------|-----------|
| FREE | 5분 | 1시간 |
| BASIC | 15분 | 3시간 |
| PRO | 1시간 | 6시간 |
| ENTERPRISE | 3시간 | 12시간 |

더 긴 캐시 = 더 적은 RPC 호출 = 더 빠른 응답

---

### 4. 고급 기능 잠금 해제

```
FREE:     기본 게이트만
BASIC:    + Policy Pack
PRO:      + 실시간 모니터링 + Webhook 알림
ENTERPRISE: + 커스텀 정책 + 전용 RPC + SLA 보장
```

---

## 왜 "보유"인가? (왜 소각이 아닌가)

### ❌ 소각(Spend) 모델의 문제
- 매 거래마다 토큰 사용 → 복잡한 UX
- 가격 변동성 → 예측 불가능한 비용
- 규제 리스크 → 증권으로 분류 가능성

### ✅ 보유(Hold) 모델의 장점
- **단순함:** 한 번 구매, 계속 혜택
- **예측 가능:** 월 구독료 고정
- **유동성 유지:** 언제든 매도 가능
- **규제 안전:** 서비스 접근권, 투자 수익 아님

---

## $BLNK 획득 방법

### 1. 구매 (DEX)
- Uniswap: BLNK/ETH 페어
- 슬리피지: 2% 이내 권장

### 2. 획득 (Earn)
- 100-Call Challenge 우승
- Bug bounty
- 커뮤니티 기여

### 3. 스테이킹 (예정)
- 30일 락업 → 추가 20% 쿼터 복너스
- 90일 락업 → 추가 50% 쿼터 복너스

---

## 온체인 검증 (예정)

```solidity
// 예시: 티어 확인 컨트랙트
function checkTier(address user) external view returns (Tier) {
    uint256 balance = blnkToken.balanceOf(user);
    
    if (balance >= 2500) return Tier.ENTERPRISE;
    if (balance >= 500) return Tier.PRO;
    if (balance >= 100) return Tier.BASIC;
    return Tier.FREE;
}
```

**현재:** 서버 사이드 검증  
**향후:** Merkle proof 또는 직접 온체인 호출

---

## FAQ

**Q: $BLNK를 팔면 티어가 낮아지나요?**  
A: 네. 잔고가 기준 미만으로 떨어지면 해당 티어로 강등됩니다.

**Q: 결제 없이 $BLNK만 보유하면 되나요?**  
A: 아닙니다. 구독료(USDC/카드)는 별도입니다. $BLNK는 "자격"입니다.

**Q: 여러 지갑의 $BLNK를 합칠 수 있나요?**  
A: 아닙니다. API 키 등록 시 한 지갑만 연결됩니다.

**Q: $BLNK 가격이 떨어지면 손핸가요?**  
A: 토큰 가격과 서비스 가격은 무관합니다. 구독료는 고정 USD입니다.

---

## 요약

| | $BLNK | USDC/카드 |
|--|-------|-----------|
| **목적** | 자격/권리 | 결제 |
| **방식** | 보유 | 구독 |
| **변동성** | 시장 가격 | 고정 |
| **환불** | 언제든 매도 | 구독 취소 시 미사용 분 |

> **$BLNK = 성능을 위한 스테이킹**  
> **구독 = 서비스 이용료**  
> **분리되어 있습니다.**

---

**문의:** token@blnk.io
