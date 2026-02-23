# BLNK Risk Gate

**Pre-trade risk infrastructure for AI agents.**

One RPC call. Instant verdict. Production-ready.

```
🌐 https://blnk-lite-production.up.railway.app
```

## Quick Start

### 1. Test the Gate (Free - 100 calls/day)

```bash
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "actionType": "swap",
    "amount": "1.0"
  }'
```

**Response:**
```json
{
  "decision": "PASS",
  "risk_score": 10,
  "risk_level": "SAFE",
  "confidence": 0.95,
  "execution_allowed": true,
  "recommended_next_call": null,
  "rate_limit": {
    "tier": "FREE",
    "used": 1,
    "limit": 100,
    "remaining": 99
  }
}
```

### 2. Check Policy Compliance

```bash
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/policy/check \
  -H "Content-Type: application/json" \
  -d '{
    "token": "0x...",
    "policyId": "conservative"
  }'
```

**Policies:** `conservative` | `moderate` | `aggressive` | `defi_yield`

### 3. JavaScript/TypeScript

```typescript
const BLNK_API = 'https://blnk-lite-production.up.railway.app';

async function checkRisk(token: string, actionType: string) {
  const response = await fetch(`${BLNK_API}/api/v1/gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, actionType })
  });
  
  const result = await response.json();
  
  if (result.decision === 'BLOCK') {
    console.error('🚫 Trade blocked:', result.risk_reasons);
    return false;
  }
  
  if (result.decision === 'WARN') {
    console.warn('⚠️  Risk detected:', result.risk_score);
    // Optional: trigger deep scan
    console.log('Recommended:', result.recommended_next_call);
  }
  
  return result.execution_allowed;
}

// Usage
const canTrade = await checkRisk(
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  'swap'
);
```

### 4. Python

```python
import requests

BLNK_API = 'https://blnk-lite-production.up.railway.app'

def check_risk(token: str, action_type: str) -> dict:
    response = requests.post(
        f'{BLNK_API}/api/v1/gate',
        json={'token': token, 'actionType': action_type}
    )
    return response.json()

# Usage
result = check_risk(
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'swap'
)

if result['decision'] == 'BLOCK':
    print(f"🚫 Blocked: {result['risk_reasons']}")
elif result['decision'] == 'WARN':
    print(f"⚠️  Warning: {result['risk_score']}")
    print(f"Recommended: {result['recommended_next_call']}")
else:
    print(f"✅ Safe to proceed: {result['risk_level']}")
```

## Pricing Tiers

| Tier | Daily Calls | Price | $BLNK Required |
|------|-------------|-------|----------------|
| **FREE** | 100 | $0 | 0 |
| **BASIC** | 500 | $19/mo | 100 |
| **PRO** | 2,000 | $99/mo | 500 |
| **ENTERPRISE** | 10,000 | $499/mo | 2,500 |

> 💡 **$BLNK is not payment** - it's performance unlock. Subscribe with USDC/Card, hold $BLNK for higher limits.

## Endpoints

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/api/v1/gate` | POST | $1/100 calls | Pre-trade risk gate |
| `/api/v1/policy/check` | POST | $15/check | Policy compliance |
| `/api/v1/policies` | GET | FREE | List policies |
| `/health` | GET | FREE | Health check |
| `/version` | GET | FREE | Version info |
| `/metrics` | GET | FREE* | Daily report |

*Authenticated access

## Response Format

All responses include:

```json
{
  "decision": "PASS|WARN|BLOCK",
  "risk_score": 0-100,
  "risk_level": "SAFE|LOW|MEDIUM|HIGH|CRITICAL",
  "confidence": 0.0-1.0,
  "evidence": [],
  "recommended_next_call": {
    "skill": "...",
    "reason": "...",
    "price": "..."
  }
}
```

## Policies

### Conservative
- Blocks: upgradeable, mintable, blacklist, pausable
- Max tax: 0%
- Min liquidity: $100k

### Moderate (Default)
- Blocks: mintable, blacklist
- Max tax: 5%
- Min liquidity: $50k

### Aggressive
- Blocks: critical only
- Max tax: 10%
- Min liquidity: $10k

### DeFi Yield
- Blocks: blacklist, honeypots
- Max tax: 3%
- Min liquidity: $200k

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Agent     │────▶│  BLNK Gate  │────▶│  Response   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌──────────┐
              │  Cache  │   │  Policy  │
              │ SQLite  │   │   Pack   │
              └─────────┘   └──────────┘
```

- **1 RPC call** per gate check
- **300s TTL** cache
- **SQLite** file-based (no Redis needed)
- **Lite mode** = free public RPC

## Disclaimer

BLNK Risk Gate provides **technical risk assessment**, not investment advice. Always DYOR.

## Support

- Discord: https://discord.gg/blnk
- Docs: https://docs.blnk.io
- ACP: Search "BLNK Risk Gate" on Virtuals Protocol

---

**Built for agents. Ready for production.**
