# BLNK Risk Gate - ACP Registration

## 1. Product Positioning

**Name:** BLNK Risk Gate  
**Tagline:** On-Chain Pre-Trade Risk Infrastructure

**Description:**  
BLNK Risk Gate is a pre-execution on-chain risk engine. It evaluates token-level, policy-level, and execution-context risks before swap, DCA, or yield operations.

**Key Points:**
- Does NOT provide investment advice
- Provides PASS / WARN / BLOCK decisions with structured evidence
- Designed for: Trading agents, DAO execution agents, Portfolio bots, Compliance workflows

## 2. Base URL

```
https://blnk-lite-production.up.railway.app
```

## 3. Core Endpoints

### POST /api/v1/gate
Pre-trade risk evaluation.

**Input:**
```json
{
  "token": "0x...",
  "actionType": "swap | dca | yield",
  "amount": "optional"
}
```

**Output:**
```json
{
  "verdict": "PASS | WARN | BLOCK",
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": 0.84,
  "signals": [],
  "evidence": [],
  "recommended_next_call": "policy_check | monitoring | none",
  "rate_limit": {
    "remaining": 97
  }
}
```

### POST /api/v1/policy/check
Institutional policy validation.

**Input:**
```json
{
  "token": "0x...",
  "policyId": "conservative | aggressive | custom"
}
```

**Output:**
```json
{
  "policy_result": "PASS | BLOCK",
  "violations": [],
  "confidence": 0.91
}
```

### GET /api/v1/policies
Returns available policy packs.

### GET /metrics
Daily usage and monitoring summary.

### GET /health
Infrastructure health check.

## 4. Pricing & Token Utility

| Tier | Daily Calls | Monthly | $BLNK Lock |
|------|-------------|---------|------------|
| FREE | 100 | $0 | 0 |
| BASIC | 500 | $19 | 100 |
| PRO | 2,000 | $99 | 500 |
| ENTERPRISE | 10,000 | $499 | 2,500 |

**Important:**
- $BLNK is NOT payment
- $BLNK unlocks higher daily quotas and priority queue routing
- Payments are in fiat/USDC subscription

## 5. Designed Execution Flow

```
discovery → gate → policy_check → monitoring → portfolio_dashboard
```

This enables recursive risk-aware execution loops.

## 6. ACP Offering JSON

```json
{
  "name": "BLNK Risk Gate",
  "description": "Pre-execution on-chain risk engine for AI agents. PASS/WARN/BLOCK decisions with structured evidence.",
  "category": "risk_infrastructure",
  "base_url": "https://blnk-lite-production.up.railway.app",
  "endpoints": [
    {
      "path": "/api/v1/gate",
      "method": "POST",
      "description": "Pre-trade risk evaluation",
      "price": "$1 per 100 calls"
    },
    {
      "path": "/api/v1/policy/check",
      "method": "POST", 
      "description": "Institutional policy validation",
      "price": "$15 per check"
    },
    {
      "path": "/api/v1/policies",
      "method": "GET",
      "description": "List available policies",
      "price": "FREE"
    },
    {
      "path": "/metrics",
      "method": "GET",
      "description": "Daily usage summary",
      "price": "FREE"
    },
    {
      "path": "/health",
      "method": "GET",
      "description": "Health check",
      "price": "FREE"
    }
  ],
  "pricing_tiers": {
    "FREE": { "calls": 100, "price": "$0", "blnk": 0 },
    "BASIC": { "calls": 500, "price": "$19/mo", "blnk": 100 },
    "PRO": { "calls": 2000, "price": "$99/mo", "blnk": 500 },
    "ENTERPRISE": { "calls": 10000, "price": "$499/mo", "blnk": 2500 }
  },
  "disclaimer": "Provides technical risk assessment, not investment advice."
}
```

## 7. Quick Test

```bash
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -H "Content-Type: application/json" \
  -d '{"token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","actionType":"swap"}'
```

## 8. Support

- GitHub: https://github.com/divadk-droid/blnk-lite
- Docs: https://docs.blnk.io (예정)
- Discord: https://discord.gg/blnk (예정)

---

**Ready for ACP registration.**
