# Alchemy 가입 후 다음 단계

## ✅ 완료된 작업
- [x] Alchemy 가입

## 📋 다음 단계 (순서대로)

### 1. API 키 생성 (Alchemy Dashboard)

```
1. https://dashboard.alchemy.com 접속
2. "Create App" 클릭
3. 설정:
   - Name: BLNK Risk Gate
   - Chain: Base
   - Network: Base Mainnet
4. "Create App" 클릭
5. "API Key" 복사 (View Key)
```

### 2. Sepolia 테스트넷용 API 키 생성

```
1. "Create App" 다시 클릭
2. 설정:
   - Name: BLNK Risk Gate Testnet
   - Chain: Base
   - Network: Base Sepolia
3. "Create App" 클릭
4. "API Key" 복사
```

### 3. 환경 변수 설정

```bash
# 터미널에 입력 (또는 ~/.bashrc에 추가)
export ALCHEMY_API_KEY=메인넷_API_키
export ALCHEMY_SEPOLIA_KEY=세폴리아_API_키
export TESTNET_DEPLOYER_KEY=0x... (테스트넷 지갑 프라이빗키)

# 적용
source ~/.bashrc
```

### 4. 설정 확인

```bash
cd /root/.openclaw/workspace/blnk-backend
./scripts/setup-alchemy.sh
```

### 5. Sepolia ETH 수령

```
https://www.alchemy.com/faucets/base-sepolia

1. 테스트넷 지갑 주소 입력
2. "Send Me ETH" 클릭
3. 0.5 ETH 수령 (약 1-2분 소요)
```

### 6. 잔액 확인

```bash
npm run check:sepolia
```

### 7. 테스트넷 배포

```bash
./deploy-testnet.sh
```

---

## 🎯 지금 당장 해야 할 일

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | Alchemy Dashboard에서 API 키 2개 생성 | 5분 |
| 2 | 환경 변수 설정 | 2분 |
| 3 | Sepolia ETH 수령 | 2분 |
| 4 | 배포 스크립트 실행 | 10분 |

**총 예상 시간: 20분**

---

## 💡 팁

### 테스트넷 지갑 생성 (필요시)
```bash
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"
```

### Alchemy RPC URL 형식
```
메인넷: https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
세폴리아: https://base-sepolia.g.alchemy.com/v2/YOUR_SEPOLIA_KEY
```

---

## ❓ 문제 해결

### "Insufficient funds" 오류
- Sepolia ETH가 충분한지 확인 (최소 0.1 ETH 필요)
- faucet에서 추가 수령

### "Invalid API Key" 오류
- API 키가 올바르게 설정되었는지 확인
- 환경 변수 재설정 후 `source ~/.bashrc`

### 배포 실패
- `npm run check:sepolia`로 먼저 잔액 확인
- gas price 확인

---

**준비되면 `./deploy-testnet.sh`를 실행하세요!**
