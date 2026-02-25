# BLNK Risk Gate - A2A Security Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/divadk-droid/blnk-lite/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/divadk-droid/blnk-lite/actions)
[![Coverage](https://img.shields.io/badge/coverage-50%25-yellow)](./coverage)
[![Base Network](https://img.shields.io/badge/Network-Base-0052FF)](https://base.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)

> Pre-trade risk infrastructure for AI agents on Virtuals Protocol (aGDP) ecosystem

## 📚 Documentation

- [Agent Onboarding Guide](./docs/AGENT_ONBOARDING_GUIDE.md) - Complete project overview
- [API Catalog](https://blnk-lite-production.up.railway.app/api/v1/catalog) - All 19 API endpoints
- [Job Offerings](https://app.virtuals.io/acp) - 19 services on ACP Marketplace

## 🎯 Overview

BLNK Risk Gate is a mandatory pre-trade security gate for AI agents operating in DeFi. With a single RPC call, agents get instant PASS/WARN/BLOCK decisions before executing trades.

**Key Features:**
- ⚡ **1 RPC Call**: Sub-2ms response with caching
- 🛡️ **Bytecode Analysis**: Detects mintable, blacklist, upgradeable patterns
- 📊 **Risk Scoring**: 0-100 score with confidence level
- 🔥 **Deflationary Tokenomics**: 50% of fees burned automatically
- 🌍 **Multi-language**: Korean, Chinese, Japanese, English

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AI Agent       │────▶│  BLNK Risk Gate  │────▶│  PASS/WARN/BLOCK│
│  (Virtuals)     │     │  (Base Network)  │     │  Decision       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ┌──────────┐      ┌──────────┐      ┌──────────┐
        │  Staking │      │  Payment │      │  Alpha   │
        │  Contract│      │  Gate    │      │  Feed    │
        └──────────┘      └──────────┘      └──────────┘
```

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/divadk-droid/blnk-lite.git
cd blnk-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start server
npm start
```

### API Documentation

- **Swagger UI**: https://blnk-lite-production.up.railway.app/api-docs
- **API Catalog**: https://blnk-lite-production.up.railway.app/api/v1/catalog
- **Agent Guide**: [docs/AGENT_ONBOARDING_GUIDE.md](./docs/AGENT_ONBOARDING_GUIDE.md)

### Quick Test

```bash
# Check API health
curl https://blnk-lite-production.up.railway.app/health

# Get API catalog
curl https://blnk-lite-production.up.railway.app/api/v1/catalog

# Test risk assessment
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
  "latency_ms": 2
}
```

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/divadk-droid/blnk-lite.git
cd blnk-lite

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start server
npm start
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Base Network
BASE_RPC_URL=https://mainnet.base.org
BLNK_TOKEN_ADDRESS=0x...
PAYMENT_GATE_ADDRESS=0x...

# Database
DATABASE_URL=sqlite://./cache.db

# Optional: Alchemy for better performance
ALCHEMY_BASE_KEY=...
```

## 📚 API Documentation

### Core Endpoints

| Endpoint | Method | Description | Price |
|----------|--------|-------------|-------|
| `/api/v1/gate` | POST | Pre-trade risk gate | 1 BLNK |
| `/api/v1/scan` | POST | Deep token analysis | 5 BLNK |
| `/api/v1/policy/check` | POST | Policy compliance | 15 BLNK |
| `/api/v1/alpha/trending` | GET | Alpha feed (Platinum only) | Free |

### WebSocket

```javascript
const ws = new WebSocket('wss://blnk-lite-production.up.railway.app/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    tokens: ['0x...']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Alert:', data);
};
```

## 🎨 Dashboard

Visit the burn tracker dashboard:

```bash
cd frontend/burn-tracker
npm install
npm run dev
```

Open http://localhost:3000

## 🪙 Tokenomics

### $BLNK Token

| Allocation | Percentage | Amount |
|------------|-----------|--------|
| Issuer | 50% | 500M BLNK |
| Team | 15% | 150M BLNK |
| Marketing | 15% | 150M BLNK |
| Community | 10% | 100M BLNK |
| Treasury | 10% | 100M BLNK |

### Staking Tiers

| Tier | Stake Required | Daily Calls |
|------|---------------|-------------|
| FREE | 0 BLNK | 5 |
| BASIC | 500 BLNK | 500 |
| PRO | 5,000 BLNK | 2,000 |
| ENTERPRISE | 50,000 BLNK | 10,000 |

### Fee Distribution

- **50%** → Burned (deflationary)
- **30%** → LP Rewards
- **20%** → Development

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- gate.test.js

# Test with coverage
npm run test:coverage
```

## 🚀 Deployment

### Smart Contracts (Base Network)

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

### Backend (Railway)

```bash
# Deploy to Railway
railway login
railway up
```

### Dashboard (Vercel)

```bash
cd frontend/burn-tracker
vercel --prod
```

See [frontend/burn-tracker/DEPLOYMENT.md](frontend/burn-tracker/DEPLOYMENT.md) for details.

## 🤝 A2A Integration

For AI agents on Virtuals Protocol:

```javascript
// Example: Nox Agent integration
const blnk = new BLNKClient({
  apiKey: process.env.BLNK_API_KEY,
  baseUrl: 'https://blnk-lite-production.up.railway.app'
});

// Before executing trade
const risk = await blnk.checkRisk(tokenAddress);

if (risk.decision === 'PASS') {
  await executeTrade(tokenAddress);
} else {
  console.log('Trade blocked:', risk.reason);
}
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🔗 Links

- **Website**: https://blnk.io
- **Dashboard**: https://burn.blnk.io
- **Documentation**: https://docs.blnk.io
- **Discord**: https://discord.gg/blnk
- **Twitter**: https://twitter.com/blnk_risk

## 🙏 Acknowledgments

- Virtuals Protocol (aGDP) for the A2A ecosystem
- Base Network for L2 infrastructure
- OpenZeppelin for secure contract libraries

---

**BLNK Risk Gate** © 2026 - Securing AI agents in DeFi
