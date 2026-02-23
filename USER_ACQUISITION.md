# BLNK Risk Gate - User Acquisition Experiment

## Twitter Thread Package

### Tweet 1 - Hook
```
🚨 Every AI agent is trading blind.

No pre-flight check.
No risk gate.
Just "swap" and hope.

We fixed that.

Introducing BLNK Risk Gate 🧵
```

### Tweet 2 - Product
```
BLNK Risk Gate

One API call. Instant verdict.

POST /api/v1/gate
→ PASS (safe to execute)
→ WARN (review recommended)
→ BLOCK (don't trade)

1 RPC call. 2ms latency.
100 free calls/day.
```

### Tweet 3 - Demo
```
Live demo 👇

curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","actionType":"swap"}'

Response:
{
  "verdict": "PASS",
  "risk_score": 10,
  "confidence": 0.95
}

Try it. No signup.
```

### Tweet 4 - Who needs this
```
Built for:

• DEX aggregators (risk check before routing)
• Yield optimizers (pool safety validation)
• Trading agents (autonomous execution)
• DAOs (compliance enforcement)

If your agent executes trades, you need this.
```

### Tweet 5 - CTA + Pricing
```
Pricing:

FREE: 100 calls/day
BASIC: 500/day ($19/mo)
PRO: 2,000/day ($99/mo)
ENTERPRISE: 10,000/day ($499/mo)

Start free → Upgrade when you scale.

🔗 https://blnk-lite-production.up.railway.app
📖 https://github.com/divadk-droid/blnk-lite

#AIagents #DeFi #riskmanagement
```

---

## Discord Launch Copy

```
🛡️ **BLNK Risk Gate is LIVE**

Pre-execution risk infrastructure for AI agents.

**What it does:**
Before your agent swaps/stakes/yields, call our gate.
Get PASS/WARN/BLOCK in 2ms.
Execute with confidence.

**Try now (no signup):**
```bash
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0x...","actionType":"swap"}'
```

**Pricing:**
• FREE: 100 calls/day
• BASIC: $19/mo (500/day)
• PRO: $99/mo (2,000/day)
• ENTERPRISE: $499/mo (10,000/day)

**Key features:**
✅ 1 RPC call = 2ms response
✅ Policy-based compliance
✅ Automatic upsell recommendations
✅ Daily metrics & reports

**Not investment advice.** Technical risk assessment only.

📖 Docs: https://github.com/divadk-droid/blnk-lite
🐦 Twitter: @blnk_risk
💬 Support: #blnk-support

---

## 100-Call Free Challenge

### Concept
"Build something with 100 free calls. Show us what you made."

### Mechanics
1. **Register** → Get API key (FREE tier)
2. **Build** → Use up to 100 calls in 7 days
3. **Share** → Tweet your project with #BLNK100
4. **Win** → Top 3 get 1 month PRO ($99 value)

### Tracking
- Unique wallets registered
- Calls consumed per user
- Projects submitted
- Social engagement (#BLNK100)

### Prizes
- 🥇 1st: 3 months PRO + feature on homepage
- 🥈 2nd: 2 months PRO
- 🥉 3rd: 1 month PRO

### Timeline
- Week 1: Registration open
- Week 2: Building phase
- Week 3: Submission + voting
- Week 4: Winners announced

### Promotion
```
🎯 BLNK 100-Call Challenge

Build an AI agent with 100 free API calls.

What can you make?
• Trading bot with risk checks
• Portfolio monitor
• Yield safety scanner

Prizes:
🥇 3 months PRO ($297)
🥈 2 months PRO ($198)
🥉 1 month PRO ($99)

Register → https://blnk-lite-production.up.railway.app

#BLNK100 #AIagents #hackathon
```

---

## Reddit Posts

### r/ethdev
```
[Showoff] I built a risk gate for AI trading agents

Problem: Agents execute trades without risk checks.

Solution: One API call returns PASS/WARN/BLOCK.

Tech:
- 1 RPC call (2ms cached)
- SQLite cache (no Redis needed)
- 4 policy tiers
- 100 free calls/day

Demo:
curl https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0x...","actionType":"swap"}'

GitHub: https://github.com/divadk-droid/blnk-lite

Would love feedback from agent builders.
```

### r/defi
```
[Tool] Pre-trade risk assessment for DeFi agents

Before your bot swaps, does it check:
- Upgradeable contracts?
- Mint functions?
- Blacklist mechanisms?

BLNK Risk Gate does. One API call. 2ms.

Free tier: 100 calls/day
Try it: https://blnk-lite-production.up.railway.app

Not investment advice. Technical risk only.
```

---

## Email Template (Outreach)

### Subject: Risk infrastructure for [Project] agents

```
Hi [Name],

I saw [Project] is building AI agents for DeFi.

Quick question: How do your agents check token risk before executing trades?

We built BLNK Risk Gate - a pre-execution risk API that returns PASS/WARN/BLOCK in 2ms.

One line of code:
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0x...","actionType":"swap"}'

Free tier: 100 calls/day. No signup required.

Worth a look? https://github.com/divadk-droid/blnk-lite

Best,
[Your name]
```

---

## Metrics to Track

### Week 1 Goals
- [ ] 50 API key registrations
- [ ] 500 total API calls
- [ ] 10 FREE tier exhaustions
- [ ] 1 BASIC upgrade

### Week 2 Goals
- [ ] 150 API key registrations
- [ ] 2,000 total API calls
- [ ] 25 FREE tier exhaustions
- [ ] 3 BASIC upgrades

### Week 4 Goals
- [ ] 500 API key registrations
- [ ] 10,000 total API calls
- [ ] 5 BASIC upgrades
- [ ] 1 PRO upgrade

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| CAC (Customer Acquisition Cost) | <$10 | Marketing spend / paying users |
| Free-to-Paid Conversion | 5% | Upgrades / registrations |
| Daily Active Agents | 50 | Unique API keys with calls |
| API Reliability | 99.9% | Uptime from /health |
| P95 Latency | <100ms | From response metrics |

---

**Ready to launch user acquisition.**
