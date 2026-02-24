# AI 콘텐츠 리스크 스캐너 API 문서

## 개요

AI 콘텐츠 리스크 스캐너는 NFT 민팅 전 AI 생성 콘텐츠의 위험도를 실시간 평가하는 API 서비스입니다.

**Base URL:** `https://api.blnk.ai/v1/ai-content`

**인증:** Bearer Token (API Key)
```
Authorization: Bearer {YOUR_API_KEY}
```

---

## 엔드포인트

### 1. 콘텐츠 스캔

단일 콘텐츠의 위험도를 스캔합니다.

```http
POST /scan
Content-Type: multipart/form-data
```

**요청 파라미터:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | File | Yes | 스캔할 이미지/비디오 파일 |
| `content_type` | string | No | `image` 또는 `video` (자동 감지) |
| `filename` | string | No | 원본 파일명 |
| `wallet_address` | string | No | 민팅 지갑 주소 |
| `skip_cache` | boolean | No | 캐시 무시 여부 (기본: false) |

**요청 예시:**

```bash
curl -X POST https://api.blnk.ai/v1/ai-content/scan \
  -H "Authorization: Bearer {YOUR_API_KEY}" \
  -F "file=@/path/to/image.jpg" \
  -F "content_type=image" \
  -F "wallet_address=0x1234..."
```

**응답 예시:**

```json
{
  "scan_id": "scan_abc123",
  "content_type": "image",
  "mime_type": "image/jpeg",
  "timestamp": "2026-02-25T06:36:00Z",
  "risk_score": {
    "overall": 35,
    "ai_generation": 20,
    "deepfake": 45,
    "copyright": 10
  },
  "gate_decision": {
    "decision": "ALLOW",
    "reason": "Low risk content",
    "action": "Safe to proceed with minting"
  },
  "checks": {
    "ai_detection": {
      "is_ai_generated": false,
      "confidence": 0.2,
      "model": "ensemble_v2"
    },
    "deepfake_detection": {
      "is_deepfake": false,
      "confidence": 0.15,
      "method": "api_fusion+advanced_face",
      "indicators": []
    },
    "copyright_check": {
      "has_matches": false,
      "similarity_score": 0.05
    }
  },
  "latency_ms": 85,
  "cached": false
}
```

---

### 2. 딥페이크 전용 탐지

딥페이크 탐지에 특화된 엔드포인트입니다.

```http
POST /detect/deepfake
Content-Type: multipart/form-data
```

**요청 파라미터:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | File | Yes | 탐지할 파일 |
| `enhanced` | boolean | No | 고급 분석 활성화 (기본: true) |
| `providers` | string[] | No | 사용할 API 제공자 |

**응답 예시:**

```json
{
  "scan_id": "df_xyz789",
  "is_deepfake": true,
  "confidence": 0.87,
  "manipulation_score": 0.82,
  "threshold": 0.75,
  "method": "api_fusion+advanced_face+video_frame",
  "sources": ["api", "face", "video"],
  "indicators": [
    {
      "type": "abnormal_blink_pattern",
      "severity": "high",
      "confidence": 0.85,
      "source": "face",
      "details": {
        "blink_rate": 3,
        "expected_rate": { "min": 12, "max": 20 }
      }
    },
    {
      "type": "face_boundary_artifact",
      "severity": "high",
      "confidence": 0.78,
      "source": "face"
    },
    {
      "type": "lighting_inconsistency",
      "severity": "medium",
      "confidence": 0.65,
      "source": "video"
    }
  ],
  "provider_results": {
    "truepic": {
      "detected": true,
      "score": 0.79
    },
    "reality_defender": {
      "detected": true,
      "score": 0.84
    }
  },
  "latency_ms": 245
}
```

---

### 3. NFT 민팅 게이트

NFT 민팅 전 종합 위험도 평가를 수행합니다.

```http
POST /nft-gate
Content-Type: application/json
```

**요청 본문:**

```json
{
  "content_url": "https://example.com/image.jpg",
  "metadata": {
    "name": "Digital Art #123",
    "description": "AI-generated artwork",
    "creator": "0x1234...",
    "claimed_creator": "Artist Name"
  },
  "wallet": "0x5678...",
  "collection_address": "0xabcd..."
}
```

**응답 예시:**

```json
{
  "scan_id": "gate_def456",
  "decision": "WARN",
  "risk_score": 55,
  "nft_specific_risks": [
    {
      "type": "AI_GENERATED",
      "severity": "medium",
      "description": "AI generated content may have copyright implications"
    },
    {
      "type": "METADATA_MISMATCH",
      "severity": "high",
      "description": "Creator metadata mismatch detected"
    }
  ],
  "recommendations": [
    "Consider additional verification steps",
    "Document content creation process",
    "Verify creator identity"
  ],
  "verification_hash": "0x...",
  "timestamp": "2026-02-25T06:36:00Z"
}
```

---

### 4. 스캔 상태 조회

특정 스캔의 상태를 조회합니다.

```http
GET /status/:scan_id
```

**응답 예시:**

```json
{
  "scan_id": "scan_abc123",
  "status": "completed",
  "progress": 100,
  "result": { ... },
  "created_at": "2026-02-25T06:36:00Z",
  "completed_at": "2026-02-25T06:36:01Z"
}
```

---

### 5. 배치 스캔

여러 콘텐츠를 동시에 스캔합니다.

```http
POST /batch/scan
Content-Type: multipart/form-data
```

**요청 파라미터:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `files` | File[] | Yes | 스캔할 파일들 (최대 10개) |

**응답 예시:**

```json
{
  "batch_id": "batch_ghi789",
  "total": 5,
  "completed": 5,
  "results": [
    {
      "filename": "image1.jpg",
      "scan_id": "scan_001",
      "risk_score": 25,
      "decision": "ALLOW"
    },
    ...
  ],
  "latency_ms": 420
}
```

---

### 6. API 상태 확인

서비스 상태 및 제공자 연결 상태를 확인합니다.

```http
GET /health
```

**응답 예시:**

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "components": {
    "api": {
      "truepic": { "status": "healthy", "latency_ms": 45 },
      "reality_defender": { "status": "healthy", "latency_ms": 52 },
      "sightengine": { "status": "healthy", "latency_ms": 38 }
    },
    "face_detection": { "status": "healthy" },
    "video_analysis": { "status": "healthy" }
  },
  "timestamp": "2026-02-25T06:36:00Z"
}
```

---

### 7. 사용량 조회

API 사용량 및 할당량을 조회합니다.

```http
GET /usage
```

**응답 예시:**

```json
{
  "plan": "pro",
  "billing_period": "2026-02-01 to 2026-02-28",
  "usage": {
    "scans": {
      "used": 4520,
      "limit": 10000,
      "remaining": 5480
    },
    "deepfake_detections": {
      "used": 1234,
      "limit": 5000
    }
  },
  "reset_date": "2026-03-01"
}
```

---

## 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `INVALID_API_KEY` | 401 | 유효하지 않은 API 키 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `INVALID_FILE_FORMAT` | 400 | 지원하지 않는 파일 형식 |
| `FILE_TOO_LARGE` | 413 | 파일 크기 초과 (최대 100MB) |
| `SCAN_TIMEOUT` | 504 | 스캔 시간 초과 |
| `PROVIDER_UNAVAILABLE` | 503 | 외부 API 제공자 unavailable |
| `INVALID_CONTENT` | 400 | 분석할 수 없는 콘텐츠 |

**에러 응답 예시:**

```json
{
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Unsupported file format: .bmp",
    "supported_formats": ["image/jpeg", "image/png", "image/webp", "video/mp4"]
  }
}
```

---

## 리스크 스코어 해석

### 전체 리스크 스코어 (0-100)

| 범위 | 등급 | 게이트 결정 | 설명 |
|------|------|-------------|------|
| 0-39 | 낮음 | ALLOW | 안전한 콘텐츠 |
| 40-69 | 중간 | WARN | 추가 검토 권장 |
| 70-100 | 높음 | BLOCK | 민팅 차단 |

### 개별 체크 항목

- **AI Generation (0-100)**: AI 생성 가능성
- **Deepfake (0-100)**: 딥페이크 조작 가능성
- **Copyright (0-100)**: 저작권 침해 가능성

---

## 성능 지표

### 응답 시간

| 작업 유형 | 평균 | P95 | P99 |
|-----------|------|-----|-----|
| 이미지 스캔 | 85ms | 150ms | 250ms |
| 딥페이크 탐지 | 120ms | 200ms | 350ms |
| 비디오 스캔 (1분) | 450ms | 800ms | 1200ms |
| 배치 스캔 (10개) | 600ms | 1000ms | 1500ms |

### 정확도

- 딥페이크 탐지 정확도: 95%+
- 오탐률: 5% 이하
- AI 생성 탐지 정확도: 92%+

---

## 웹훅

스캔 완료 시 웹훅을 받을 수 있습니다.

**설정:**
```http
POST /webhooks/configure
{
  "url": "https://your-domain.com/webhook",
  "events": ["scan.completed", "scan.failed"],
  "secret": "your_webhook_secret"
}
```

**웹훅 페이로드:**
```json
{
  "event": "scan.completed",
  "scan_id": "scan_abc123",
  "result": { ... },
  "timestamp": "2026-02-25T06:36:00Z",
  "signature": "sha256=..."
}
```

---

## SDK 및 예제

### JavaScript/TypeScript

```typescript
import { BlnkAIContentScanner } from '@blnk/ai-content-sdk';

const scanner = new BlnkAIContentScanner({
  apiKey: 'YOUR_API_KEY'
});

// 단일 스캔
const result = await scanner.scan({
  file: imageBuffer,
  contentType: 'image'
});

// 딥페이크 탐지
const deepfakeResult = await scanner.detectDeepfake({
  file: videoBuffer,
  enhanced: true
});

// NFT 게이트
const gateResult = await scanner.nftGate({
  contentUrl: 'https://...',
  metadata: { ... },
  wallet: '0x...'
});
```

### Python

```python
from blnk_ai_content import Scanner

scanner = Scanner(api_key='YOUR_API_KEY')

# 단일 스캔
result = scanner.scan(
    file='path/to/image.jpg',
    content_type='image'
)

# 딥페이크 탐지
result = scanner.detect_deepfake(
    file='path/to/video.mp4',
    enhanced=True
)
```

---

## 가격 정책

### 무료 플랜 (Free)
- 월 100회 스캔
- 기본 AI 탐지
- 이메일 지원

### 프로 플랜 (Pro) - $99/월
- 월 10,000회 스캔
- 고급 딥페이크 탐지
- 외부 API 통합
- 우선 지원

### 엔터프라이즈 (Enterprise)
- 무제한 스캔
- 커스텀 모델
- SLA 보장
- 전담 지원

---

## 지원 및 문의

- **문서:** https://docs.blnk.ai/ai-content
- **지원:** support@blnk.ai
- **상태 페이지:** https://status.blnk.ai
- **Discord:** https://discord.gg/blnk

---

**문서 버전:** 2.0.0  
**최종 업데이트:** 2026-02-25
