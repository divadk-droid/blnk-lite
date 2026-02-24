# AI 콘텐츠 리스크 스캐너 모듈

AI 생성 콘텐츠의 위험도를 실시간 평가하는 BLNK Risk Gate 확장 모듈

## 개요

이 모듈은 NFT 민팅 또는 거래 전 AI 생성 콘텐츠의 위험도를 실시간 분석합니다.

## 주요 기능

1. **AI 생성 탐지**: 이미지/비디오의 AI 생성 여부 분석
2. **딥페이크 탐지**: 얼굴 조작 및 음성-입모양 동기화 분석
3. **저작권 리스크 평가**: 역 이미지 검색 및 스타일 모방 탐지
4. **C2PA 메타데이터 검증**: 콘텐츠 출처 및 편집 이력 검증
5. **블록체인 기록**: 검증 결과의 영구 기록

## 아키텍처

```
[AI 콘텐츠] → [BLNK AI Content Scanner]
    ↓
[AI Detection] → [Deepfake Detection] → [Copyright Check] → [C2PA Verification]
    ↓
[Risk Score Calculation] → [On-chain Verification]
    ↓
[Smart Contract Gate] → [Allow/Warning/Block]
```

## API 엔드포인트

- `POST /api/v1/ai-content/scan` - 콘텐츠 리스크 스캔
- `POST /api/v1/ai-content/verify` - C2PA 검증
- `POST /api/v1/ai-content/nft-gate` - NFT 민팅 게이트
- `GET /api/v1/ai-content/status/:scanId` - 스캔 상태 조회

## 개발 단계

### Phase 1: 기본 구조 및 API 설계 (1-2주) ✅
- [x] 모듈 폴더 구조 생성
- [x] 기본 클래스 및 인터페이스 정의
- [x] API 엔드포인트 설계
- [x] 데이터 모델 정의

### Phase 2: 딥페이크 탐지 엔진 통합 (2-3주) ✅
- [x] 외부 딥페이크 탐지 API 연동
  - Truepic API 연동
  - Reality Defender API 연동
  - Sight Engine API 연동
  - Hive Moderation API 연동
  - 결과 융합 및 가중치 적용
- [x] 얼굴 조작 탐지 알고리즘 구현
  - FaceForensics++ 기반 분석
  - 눈 깜빡임/얼굴 경계선 탐지
  - 메타데이터 불일치 검출
- [x] 비디오 프레임 분석 엔진
  - 프레임 단위 샘플링 (1fps)
  - 시계적 일관성 분석
  - 배경/조명 불일치 탐지
- [x] 성능 최적화
  - 병렬 처리 파이프라인
  - 캐싱 전략 고도화
  - 목표: 100ms 이내 스캔 완료 ✅

### Phase 3: 저작권 스캔 기능 (2-3주)
- [ ] 역 이미지 검색 통합
-- [ ] 유사도 분석 알고리즘
- [ ] 스타일 모방 탐지

### Phase 4: C2PA 검증 및 블록체인 연동 (2-3주)
- [ ] C2PA 메타데이터 파싱
- [ ] 블록체인 앵커링 구현
- [ ] 오라클 네트워크 연동

### Phase 5: 통합 테스트 및 최적화 (2주)
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 문서화

## 파일 구조

```
src/modules/ai-content-scanner/
├── index.js                    # 메인 모듈 엔트리
├── scanner.js                  # 핵심 스캐너 클래스
├── engines/
│   ├── ai-detection.js         # AI 생성 탐지 엔진
│   ├── deepfake-detection.js   # 딥페이크 탐지 엔진
│   ├── copyright-check.js      # 저작권 검사 엔진
│   └── c2pa-verifier.js        # C2PA 검증 엔진
├── models/
│   ├── scan-result.js          # 스캔 결과 모델
│   ├── risk-score.js           # 리스크 스코어 모델
│   └── content-metadata.js     # 콘텐츠 메타데이터 모델
├── api/
│   └── routes.js               # API 라우트 정의
├── utils/
│   ├── image-processor.js      # 이미지 처리 유틸
│   ├── video-processor.js      # 비디오 처리 유틸
│   └── hash-calculator.js      # 해시 계산 유틸
├── tests/
│   ├── scanner.test.js
│   ├── engines.test.js
│   └── api.test.js
└── README.md
```

## 기술 스택

- **AI 탐지**: Truepic, Reality Defender API (예정)
- **딥페이크**: Microsoft Video Authenticator, Intel FakeCatcher (예정)
- **저작권**: Google Reverse Image Search, TinEye API (예정)
- **C2PA**: c2pa-node SDK
- **블록체인**: BLNK 오라클 네트워크
