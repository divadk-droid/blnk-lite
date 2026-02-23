# BLNK Risk Gate - Launch Package

## Twitter Thread (5 Tweets)

### Tweet 1: Problem
```
AI agents are executing trades blind.

No pre-flight check.
No risk gate.
Just "swap" and hope.

We built the infrastructure that's missing.

🧵
```

### Tweet 2: Solution
```
BLNK Risk Gate

One API call. Instant verdict.

POST /api/v1/gate
→ PASS (safe to execute)
→ WARN (review recommended)  
→ BLOCK (don't trade)

1 RPC call. 2ms latency. Free tier.
```

### Tweet 3: How it works
```
How agents use it:

1. Before swap → Call gate
2. Get risk score (0-100)
3. If WARN → Auto-trigger deep scan
4. If BLOCK → Cancel execution

No human in the loop. Fully automated.

Example 👇
```

### Tweet 4: Code example
```
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0x...","actionType":"swap"}'

Response:
{
  "decision": "PASS",
  "risk_score": 10,
  "confidence": 0.95,
  "recommended_next_call": null
}

100 free calls/day. No signup.
```

### Tweet 5: CTA
```
Built for:
• DEX aggregators
• Yield optimizers
• Trading agents
• DeFi protocols

Free tier: 100 calls/day
Pro: $99/mo for 2,000 calls

Try it → https://blnk-lite-production.up.railway.app

Docs → https://docs.blnk.io
```

---

## Discord Announcement

```
🛡️ **BLNK Risk Gate is LIVE**

Pre-trade risk infrastructure for AI agents.

**What's ready:**
✅ One-RPC-call gate (2ms)
✅ Policy-based compliance
✅ 4 tiers (FREE to ENTERPRISE)
✅ Daily metrics & auto-reports

**Try now:**
```bash
curl -X POST https://blnk-lite-production.up.railway.app/api/v1/gate \
  -d '{"token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","actionType":"swap"}'
```

**Pricing:**
• FREE: 100 calls/day
• BASIC: $19/mo (500 calls)
• PRO: $99/mo (2,000 calls)
• ENTERPRISE: $499/mo (10,000 calls)

**Not investment advice. Technical risk only.**

📖 Docs: https://docs.blnk.io
🤝 Support: #help channel
```

---

## FAQ

**Q: Is this investment advice?**
A: No. BLNK provides technical risk assessment (contract analysis, patterns). Always DYOR.

**Q: How many RPC calls?**
A: One. We optimized for speed and cost.

**Q: What chains?**
A: Currently Ethereum. Multi-chain coming with Pro tier.

**Q: Do I need $BLNK tokens?**
A: Not for payment. $BLNK unlocks higher rate limits (performance, not investment).

**Q: Can I self-host?**
A: Yes. Open source: https://github.com/divadk-droid/blnk-lite

**Q: What's the catch with free tier?**
A: 100 calls/day, public RPC, 5min cache. Enough to test and small agents.

**Q: How accurate?**
A: Pattern-based detection. False positives possible. Use WARN as "review needed", not "scam confirmed".

**Q: Enterprise SLA?**
A: $499/mo tier includes dedicated RPC and response time guarantees.

---

## Launch Checklist

- [ ] Post Twitter thread
- [ ] Post Discord announcement
- [ ] Update ACP offering
- [ ] Submit to agent directories
- [ ] Reach out to 3 DEX aggregators
- [ ] Monitor /metrics for first 100 calls
- [ ] Respond to feedback within 24h

---

## First 100 Calls Challenge

Goal: Get 100 unique agents calling the API in 72 hours.

**Tactics:**
1. Post in /r/ethdev, /r/defi
2. Comment on AI agent threads
3. DM trading bot developers
4. Add to awesome-ai-agents list
5. Write "Building a trading agent" tutorial

**Track:**
- Unique wallets
- FREE tier exhaustion rate
- BASIC upgrade conversions
- Most checked tokens

---

**Ready to launch. 🚀**
