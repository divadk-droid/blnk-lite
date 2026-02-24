/**
 * Scan Result Model
 * 
 * AI 콘텐츠 스캔 결과 데이터 모델
 */

class ScanResult {
  constructor(data = {}) {
    this.scanId = data.scanId || null;
    this.contentType = data.contentType || null;
    this.mimeType = data.mimeType || null;
    this.filename = data.filename || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    
    // 개별 검사 결과
    this.aiDetection = null;
    this.deepfakeDetection = null;
    this.copyrightCheck = null;
    this.c2paVerification = null;
    
    // 종합 결과
    this.riskScore = null;
    this.gateDecision = null;
    this.metadata = {};
  }

  setAIDetection(result) {
    this.aiDetection = result;
    return this;
  }

  setDeepfakeDetection(result) {
    this.deepfakeDetection = result;
    return this;
  }

  setCopyrightCheck(result) {
    this.copyrightCheck = result;
    return this;
  }

  setC2PAVerification(result) {
    this.c2paVerification = result;
    return this;
  }

  setRiskScore(score) {
    this.riskScore = score;
    return this;
  }

  setGateDecision(decision) {
    this.gateDecision = decision;
    return this;
  }

  setMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * 모든 검사 결과 조회
   */
  getAllChecks() {
    return {
      aiDetection: this.aiDetection,
      deepfakeDetection: this.deepfakeDetection,
      copyrightCheck: this.copyrightCheck,
      c2paVerification: this.c2paVerification
    };
  }

  /**
   * JSON 변환
   */
  toJSON() {
    return {
      scanId: this.scanId,
      contentType: this.contentType,
      mimeType: this.mimeType,
      filename: this.filename,
      timestamp: this.timestamp,
      aiDetection: this.aiDetection,
      deepfakeDetection: this.deepfakeDetection,
      copyrightCheck: this.copyrightCheck,
      c2paVerification: this.c2paVerification,
      riskScore: this.riskScore,
      gateDecision: this.gateDecision,
      metadata: this.metadata
    };
  }

  /**
   * 문자열 변환
   */
  toString() {
    return `ScanResult(${this.scanId}, ${this.gateDecision?.decision || 'pending'})`;
  }

  /**
   * 정적 팩토리 메서드
   */
  static fromJSON(json) {
    const result = new ScanResult(json);
    result.aiDetection = json.aiDetection;
    result.deepfakeDetection = json.deepfakeDetection;
    result.copyrightCheck = json.copyrightCheck;
    result.c2paVerification = json.c2paVerification;
    result.riskScore = json.riskScore;
    result.gateDecision = json.gateDecision;
    result.metadata = json.metadata || {};
    return result;
  }
}

module.exports = { ScanResult };
