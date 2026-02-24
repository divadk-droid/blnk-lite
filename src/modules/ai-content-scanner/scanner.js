/**
 * AI Content Scanner - Core Scanner Class
 * 
 * AI 생성 콘텐츠의 종합적인 위험도를 평가하는 핵심 클래스
 */

const { AIDetectionEngine } = require('./engines/ai-detection');
const { EnhancedDeepfakeDetectionEngine } = require('./engines/enhanced-deepfake-detection');
const { CopyrightCheckEngine } = require('./engines/copyright-check');
const { C2PAVerifier } = require('./engines/c2pa-verifier');
const { RiskScoreCalculator } = require('./models/risk-score');
const { ScanResult } = require('./models/scan-result');
const crypto = require('crypto');

class AIContentScanner {
  constructor(options = {}) {
    this.options = {
      enableAIDetection: true,
      enableDeepfakeDetection: true,
      enableCopyrightCheck: true,
      enableC2PAVerification: false, // Phase 4에서 활성화
      useEnhancedDeepfake: true, // Phase 2: 고급 딥페이크 탐지 사용
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
      ...options
    };

    // 엔진 초기화
    this.aiDetectionEngine = new AIDetectionEngine();
    // Phase 2: 고급 딥페이크 탐지 엔진 사용
    this.deepfakeEngine = this.options.useEnhancedDeepfake 
      ? new EnhancedDeepfakeDetectionEngine()
      : require('./engines/deepfake-detection').DeepfakeDetectionEngine();
    this.copyrightEngine = new CopyrightCheckEngine();
    this.c2paVerifier = new C2PAVerifier();
    this.riskCalculator = new RiskScoreCalculator();

    // 스캔 결과 캐시 (메모리)
    this.scanCache = new Map();
    this.cacheTTL = 3600000; // 1시간
  }

  /**
   * 콘텐츠 스캔 실행
   * @param {Object} params - 스캔 파라미터
   * @param {Buffer|string} params.content - 콘텐츠 데이터 또는 URL
   * @param {string} params.contentType - 콘텐츠 타입 (image/video)
   * @param {string} params.mimeType - MIME 타입
   * @param {string} params.filename - 파일명
   * @param {Object} params.options - 추가 옵션
   * @returns {Promise<ScanResult>} 스캔 결과
   */
  async scan(params) {
    const scanId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const { content, contentType, mimeType, filename, options = {} } = params;

      // 입력 검증
      this._validateInput(params);

      // 캐시 확인
      const cacheKey = this._generateCacheKey(content);
      const cached = this._getCachedResult(cacheKey);
      if (cached && !options.skipCache) {
        return { ...cached, cached: true };
      }

      // 스캔 결과 객체 생성
      const result = new ScanResult({
        scanId,
        contentType,
        mimeType,
        filename,
        timestamp: new Date().toISOString()
      });

      // 1. AI 생성 탐지
      if (this.options.enableAIDetection) {
        const aiDetectionResult = await this.aiDetectionEngine.detect(content, {
          contentType,
          mimeType
        });
        result.setAIDetection(aiDetectionResult);
      }

      // 2. 딥페이크 탐지 (비디오/이미지 모두)
      if (this.options.enableDeepfakeDetection) {
        const deepfakeResult = await this.deepfakeEngine.detect(content, {
          contentType,
          mimeType
        });
        result.setDeepfakeDetection(deepfakeResult);
      }

      // 3. 저작권 검사
      if (this.options.enableCopyrightCheck) {
        const copyrightResult = await this.copyrightEngine.check(content, {
          contentType,
          mimeType
        });
        result.setCopyrightCheck(copyrightResult);
      }

      // 4. C2PA 검증 (Phase 4)
      if (this.options.enableC2PAVerification) {
        const c2paResult = await this.c2paVerifier.verify(content);
        result.setC2PAVerification(c2paResult);
      }

      // 리스크 스코어 계산
      const riskScore = this.riskCalculator.calculate(result.getAllChecks());
      result.setRiskScore(riskScore);

      // 게이트 결정
      const gateDecision = this._makeGateDecision(riskScore);
      result.setGateDecision(gateDecision);

      // 메타데이터 추가
      result.setMetadata({
        latencyMs: Date.now() - startTime,
        engineVersion: '2.0.0-phase2',
        scanOptions: this.options
      });

      // 캐시 저장
      this._cacheResult(cacheKey, result.toJSON());

      return result.toJSON();

    } catch (error) {
      return this._handleError(scanId, error, startTime);
    }
  }

  /**
   * NFT 민팅 게이트 검사
   * @param {Object} params - 검사 파라미터
   * @returns {Promise<Object>} 게이트 결과
   */
  async nftGate(params) {
    const { content, metadata = {}, wallet = 'anonymous' } = params;

    // 스캔 실행
    const scanResult = await this.scan({
      content,
      contentType: this._detectContentType(content),
      ...params
    });

    // NFT 특화 리스크 평가
    const nftRiskFactors = this._evaluateNFTRiskFactors(scanResult, metadata);

    return {
      scanId: scanResult.scanId,
      decision: scanResult.gateDecision.decision,
      riskScore: scanResult.riskScore,
      nftSpecificRisks: nftRiskFactors,
      recommendations: this._generateRecommendations(scanResult, nftRiskFactors),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 스캔 상태 조회
   * @param {string} scanId - 스캔 ID
   * @returns {Object|null} 스캔 결과
   */
  getScanStatus(scanId) {
    // 메모리 캐시에서 조회
    for (const [key, value] of this.scanCache.entries()) {
      if (value.scanId === scanId) {
        return value;
      }
    }
    return null;
  }

  /**
   * 입력 검증
   * @private
   */
  _validateInput(params) {
    const { content, contentType, mimeType } = params;

    if (!content) {
      throw new Error('Content is required');
    }

    if (!['image', 'video'].includes(contentType)) {
      throw new Error('Invalid content type. Must be "image" or "video"');
    }

    if (!this.options.supportedFormats.includes(mimeType)) {
      throw new Error(`Unsupported format: ${mimeType}`);
    }

    // 파일 크기 검증
    if (Buffer.isBuffer(content) && content.length > this.options.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.options.maxFileSize} bytes`);
    }
  }

  /**
   * 캐시 키 생성
   * @private
   */
  _generateCacheKey(content) {
    const crypto = require('crypto');
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 캐시된 결과 조회
   * @private
   */
  _getCachedResult(key) {
    const cached = this.scanCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.scanCache.delete(key);
    return null;
  }

  /**
   * 결과 캐싱
   * @private
   */
  _cacheResult(key, data) {
    this.scanCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 캐시 크기 관리 (최대 1000개)
    if (this.scanCache.size > 1000) {
      const firstKey = this.scanCache.keys().next().value;
      this.scanCache.delete(firstKey);
    }
  }

  /**
   * 콘텐츠 타입 감지
   * @private
   */
  _detectContentType(content) {
    // 간단한 시그니처 기반 감지
    if (Buffer.isBuffer(content)) {
      const signature = content.slice(0, 4).toString('hex');
      // JPEG: ff d8 ff
      // PNG: 89 50 4e 47
      // MP4: 다양한 시그니처
      if (['ffd8ff', '89504e47'].includes(signature)) return 'image';
      return 'video';
    }
    return 'image';
  }

  /**
   * 게이트 결정
   * @private
   */
  _makeGateDecision(riskScore) {
    const { overall, confidence } = riskScore;

    if (overall >= 70) {
      return {
        decision: 'BLOCK',
        reason: 'High risk content detected',
        action: 'Minting blocked due to high risk score'
      };
    } else if (overall >= 40) {
      return {
        decision: 'WARN',
        reason: 'Medium risk content detected',
        action: 'Manual review recommended before minting'
      };
    } else {
      return {
        decision: 'ALLOW',
        reason: 'Low risk content',
        action: 'Safe to proceed with minting'
      };
    }
  }

  /**
   * NFT 특화 리스크 평가
   * @private
   */
  _evaluateNFTRiskFactors(scanResult, metadata) {
    const factors = [];

    // AI 생성 콘텐츠 리스크
    if (scanResult.aiDetection?.isAIGenerated) {
      factors.push({
        type: 'AI_GENERATED',
        severity: 'medium',
        description: 'AI generated content may have copyright implications'
      });
    }

    // 딥페이크 리스크
    if (scanResult.deepfakeDetection?.isDeepfake) {
      factors.push({
        type: 'DEEPFAKE',
        severity: 'critical',
        description: 'Potential deepfake content detected'
      });
    }

    // 저작권 리스크
    if (scanResult.copyrightCheck?.hasMatches) {
      factors.push({
        type: 'COPYRIGHT_RISK',
        severity: 'high',
        description: 'Similar content found in copyright databases'
      });
    }

    // 메타데이터 불일치
    if (metadata.claimedCreator && scanResult.c2paVerification?.creator !== metadata.claimedCreator) {
      factors.push({
        type: 'METADATA_MISMATCH',
        severity: 'high',
        description: 'Creator metadata mismatch detected'
      });
    }

    return factors;
  }

  /**
   * 권장사항 생성
   * @private
   */
  _generateRecommendations(scanResult, nftRiskFactors) {
    const recommendations = [];

    if (scanResult.riskScore.overall >= 70) {
      recommendations.push('Do not proceed with minting');
      recommendations.push('Review content for potential violations');
    } else if (scanResult.riskScore.overall >= 40) {
      recommendations.push('Consider additional verification steps');
      recommendations.push('Document content creation process');
    } else {
      recommendations.push('Safe to proceed');
      recommendations.push('Consider adding C2PA metadata for provenance');
    }

    return recommendations;
  }

  /**
   * 에러 처리
   * @private
   */
  _handleError(scanId, error, startTime) {
    return {
      scanId,
      error: true,
      errorMessage: error.message,
      errorCode: error.code || 'SCAN_ERROR',
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      gateDecision: {
        decision: 'BLOCK',
        reason: 'Scan failed - blocking for safety',
        action: 'Please retry or contact support'
      }
    };
  }

  /**
   * 스캐너 통계 조회
   */
  getStats() {
    return {
      cacheSize: this.scanCache.size,
      engines: {
        aiDetection: this.aiDetectionEngine.getStats ? this.aiDetectionEngine.getStats() : {},
        deepfake: this.deepfakeEngine.getStats ? this.deepfakeEngine.getStats() : {},
        copyright: this.copyrightEngine.getStats ? this.copyrightEngine.getStats() : {},
        c2pa: this.c2paVerifier.getStats ? this.c2paVerifier.getStats() : {}
      },
      options: this.options,
      version: '2.0.0-phase2'
    };
  }

  /**
   * 스캐너 종료 및 리소스 정리
   */
  async shutdown() {
    if (this.deepfakeEngine && this.deepfakeEngine.shutdown) {
      await this.deepfakeEngine.shutdown();
    }
    this.scanCache.clear();
  }
}

module.exports = { AIContentScanner };
