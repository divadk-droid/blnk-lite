# BLNK Lite - 배포 가이드

## 준비된 파일

- `Dockerfile` - 컨테이너 설정
- `railway.json` - Railway 설정
- `package.json` - 의존성
- `src/lite-server.js` - Lite 모드 서버

## Railway 배포 방법

### 방법 1: Railway CLI (권장)

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. 로그인 (브라우저에서 인증)
railway login

# 3. 프로젝트 생성
railway init

# 4. 배포
railway up

# 5. 도메인 확인
railway domain
```

### 방법 2: GitHub 연동

1. GitHub에 리포 푸시
2. Railway 대시보드에서 New Project
3. Deploy from GitHub repo 선택
4. 자동 배포

### 방법 3: Render (대안)

```bash
# Render에서:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Build Command: npm install
# 4. Start Command: npm start
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | 3000 | 서버 포트 |
| `RPC_URL` | https://eth.llamarpc.com | Ethereum RPC |

## API 테스트

```bash
# Health check
curl https://your-app.railway.app/health

# Gate check
curl -X POST https://your-app.railway.app/api/v1/gate \
  -H "Content-Type: application/json" \
  -d '{"token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","actionType":"swap"}'
```

## Lite 모드 특징

- 1 RPC call per request
- SQLite file cache
- Free public RPC
- Whitelist for known safe tokens

## Pro 업그레이드

- Alchemy RPC
- Redis cache
- Multi-chain
- Real-time monitoring
