/**
 * Risk Score Calculator
 * 
 * AI 콘텐츠 리스크 스코어 계산기
 */

class RiskScoreCalculator {
  constructor(options = {}) {
    this.options = {
      weights: {
        aiDetection: 0.25,
        deepfakeDetection: 0.35,
        copyrightCheck: 0.25,
        c2paVerification: 0.15
      },
      thresholds: {
        low: 30,
        medium: 60,
        high: 80
      },
      ...options
    };
  }

  /**
   * 리스크 스코어 계산
   * @param {Object} checks - 개별 검사 결과
   * @returns {Object} 종합 리스크 스코어
   */
  calculate(checks) {
    const scores = {
      aiDetection: this._calculateAIDetectionScore(checks.aiDetection),
      deepfakeDetection: this._calculateDeepfakeScore(checks.deepfakeDetection),
      copyrightCheck: this._calculateCopyrightScore(checks.copyrightCheck),
      c2paVerification: this._calculateC2PAScore(checks.c2paVerification)
    };

    // 가중 평균 계산
    let overall = 0;
    let totalWeight = 0;

    for (const [key, score] of Object.entries(scores)) {
      if (score !== null) {
        overall += score * this.options.weights[key];
        totalWeight += this.options.weights[key];
      }
    }

    // 가중치 정규화
    if (totalWeight > 0) {
      overall = overall / totalWeight;
    }

    // 신뢰도 계산
    const confidence = this._calculateConfidence(checks, scores);

    // 리스크 레벨 결정
    const level = this._determineRiskLevel(overall);

    return {
      overall: Math.round(overall * 100) / 100,
      level,
      confidence: Math.round(confidence * 100) / 100,
      breakdown: scores,
      factors: this._extractRiskFactors(checks)
    };
  }

  /**
   * AI 탐지 스코어 계산
   * @private
   */
  _calculateAIDetectionScore(result) {
    if (!result || result.isAIGenerated === null) return null;
    
    if (result.isAIGenerated) {
      // AI 생성 콘텐츠는 저작권 리스크가 있을 수 있음
      return result.confidence * 40; // 최대 40점
    }
    return 0;
  }

  /**
   * 딥페이크 스코어 계산
   * @private
   */
  _calculateDeepfakeScore(result) {
    if (!result || result.isDeepfake === null) return null;
    
    if (result.isDeepfake) {
      // 딥페이크는 높은 리스크
      return 50 + (result.confidence * 50); // 50-100점
    }
    return 0;
  }

  /**
   * 저작권 스코어 계산
   * @private
   */
  _calculateCopyrightScore(result) {
    if (!result || result.hasMatches === null) return null;
    
    if (result.hasMatches) {
      const riskMap = { low: 30, medium: 60, high: 90 };
      return riskMap[result.riskLevel] || 50;
    }
    return 0;
  }

  /**
   * C2PA 스코어 계산
   * @private
   */
  _calculateC2PAScore(result) {
    if (!result || result.hasC2PA === null) return null;
    
    if (!result.hasC2PA) {
      // C2PA 없음 - 출처 불명확
      return 20;
    }
    
    if (!result.valid) {
      // C2PA 있지만 유효하지 않음 - 위조 가능성
      return 60;
    }
    
    return 0; // 유효한 C2PA
  }

  /**
   * 신뢰도 계산
   * @private
   */
  _calculateConfidence(checks, scores) {
    let validChecks = 0;
    let totalChecks = 0;

    for (const [key, result] of Object.entries(checks)) {
      if (result !== undefined && result !== null) {
        totalChecks++;
        if (scores[key] !== null) {
          validChecks++;
        }
      }
    }

    return totalChecks > 0 ? validChecks / totalChecks : 0;
  }

  /**
   * 리스크 레벨 결정
   * @private
   */
  _determineRiskLevel(score) {
    if (score >= this.options.thresholds.high) return 'high';
    if (score >= this.options.thresholds.medium) return 'medium';
    if (score >= this.options.thresholds.low) return 'low';
    return 'minimal';
  }

  /**
   * 리스크 요인 추출
   * @private
   */
  _extractRiskFactors(checks) {
    const factors = [];

    if (checks.aiDetection?.isAIGenerated) {
      factors.push({
        type: 'ai_generated',
        severity: 'medium',
        description: 'Content appears to be AI generated',
        confidence: checks.aiDetection.confidence
      });
    }

    if (checks.deepfakeDetection?.isDeepfake) {
      factors.push({
        type: 'potential_deepfake',
        severity: 'critical',
        description: 'Potential deepfake content detected',
        confidence: checks.deepfakeDetection.confidence
      });
    }

    if (checks.copyrightCheck?.hasMatches) {
      factors.push({
        type: 'copyright_risk',
        severity: checks.copyrightCheck.riskLevel,
        description: 'Similar content found in copyright databases',
        matches: checks.copyrightCheck.matches.length
      });
    }

    if (checks.c2paVerification?.hasC2PA === false) {
      factors.push({
        type: 'no_provenance',
        severity: 'low',
        description: 'No C2PA provenance information available'
      });
    }

    if (checks.c2paVerification?.valid === false) {
      factors.push({
        type: 'invalid_provenance',
        severity: 'high',
        description: 'C2PA provenance validation failed'
      });
    }

    return factors;
  }

  /**
   * 사용자 정의 가중치 설정
   */
  setWeights(weights) {
    this.options.weights = { ...this.options.weights, ...weights };
    return this;
  }

  /**
   * 사용자 정의 임계값 설정
   */
  setThresholds(thresholds) {
    this.options.thresholds = { ...this.options.thresholds, ...thresholds };
    return this;
  }
}

module.exports = { RiskScoreCalculator };
