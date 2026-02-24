/**
 * AI Content Scanner - Main Entry Point
 * 
 * BLNK Risk Gate 확장 모듈로 AI 생성 콘텐츠의 위험도를 평가합니다.
 */

const { AIContentScanner } = require('./scanner');
const { AIDetectionEngine } = require('./engines/ai-detection');
const { DeepfakeDetectionEngine } = require('./engines/deepfake-detection');
const { EnhancedDeepfakeDetectionEngine } = require('./engines/enhanced-deepfake-detection');
const { ExternalDeepfakeAPIClient } = require('./engines/external-api-client');
const { AdvancedFaceDetectionEngine } = require('./engines/advanced-face-detection');
const { VideoFrameAnalysisEngine } = require('./engines/video-frame-analysis');
const { CopyrightCheckEngine } = require('./engines/copyright-check');
const { C2PAVerifier } = require('./engines/c2pa-verifier');
const { ScanResult } = require('./models/scan-result');
const { RiskScoreCalculator } = require('./models/risk-score');
const { ParallelProcessingPipeline } = require('./utils/parallel-pipeline');

module.exports = {
  AIContentScanner,
  AIDetectionEngine,
  DeepfakeDetectionEngine,
  EnhancedDeepfakeDetectionEngine,
  ExternalDeepfakeAPIClient,
  AdvancedFaceDetectionEngine,
  VideoFrameAnalysisEngine,
  CopyrightCheckEngine,
  C2PAVerifier,
  ScanResult,
  RiskScoreCalculator,
  ParallelProcessingPipeline
};
