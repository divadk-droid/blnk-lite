# BLNK Burn Tracker Dashboard Deployment

## Vercel Deployment Guide

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Prepare Project

```bash
cd frontend/burn-tracker

# Install dependencies
npm install

# Build locally to test
npm run build
```

### 3. Configure Environment Variables

Create `.env.local`:

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=https://blnk-lite-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://blnk-lite-production.up.railway.app/ws

# Contract Addresses (Base Network)
NEXT_PUBLIC_BLNK_TOKEN=0x...
NEXT_PUBLIC_PAYMENT_GATE=0x...

# Network
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_NETWORK_NAME=Base
```

### 4. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 5. Configure Project Settings

In Vercel Dashboard:

1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

### 6. Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | https://blnk-lite-production.up.railway.app |
| `NEXT_PUBLIC_WS_URL` | wss://blnk-lite-production.up.railway.app/ws |
| `NEXT_PUBLIC_BLNK_TOKEN` | 0x... |
| `NEXT_PUBLIC_PAYMENT_GATE` | 0x... |

### 7. Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add burn.blnk.io
```

## Build Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // For static export
  distDir: 'dist',
}

module.exports = nextConfig
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next export"
  }
}
```

## Post-Deployment Checklist

- [ ] Dashboard loads without errors
- [ ] WebSocket connects successfully
- [ ] Burn counter updates in real-time
- [ ] Tier list displays correctly
- [ ] Mobile responsive
- [ ] Custom domain configured
- [ ] SSL certificate active

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### WebSocket Connection Issues

Check that `NEXT_PUBLIC_WS_URL` uses `wss://` (secure WebSocket).

### API Connection Issues

Ensure CORS is configured on backend:

```javascript
// lite-server.js
app.use(cors({
  origin: ['https://burn.blnk.io', 'https://*.vercel.app']
}));
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- BLNK Discord: https://discord.gg/blnk
