/**
 * AI Content Scanner Tests
 * 
 * AI 콘텐츠 리스크 스캐너 모듈 테스트
 */

const { AIContentScanner } = require('../scanner');
const { AIDetectionEngine } = require('../engines/ai-detection');
const { DeepfakeDetectionEngine } = require('../engines/deepfake-detection');
const { CopyrightCheckEngine } = require('../engines/copyright-check');
const { C2PAVerifier } = require('../engines/c2pa-verifier');
const { ScanResult } = require('../models/scan-result');
const { RiskScoreCalculator } = require('../models/risk-score');

// 테스트 데이터
const mockImageBuffer = Buffer.from('mock-image-data');
const mockVideoBuffer = Buffer.from('mock-video-data');

describe('AIContentScanner', () => {
  let scanner;

  beforeEach(() => {
    scanner = new AIContentScanner();
  });

  describe('Basic Functionality', () => {
    test('should initialize with default options', () => {
      expect(scanner.options.enableAIDetection).toBe(true);
      expect(scanner.options.enableDeepfakeDetection).toBe(true);
      expect(scanner.options.maxFileSize).toBe(100 * 1024 * 1024);
    });

    test('should initialize all engines', () => {
      expect(scanner.aiDetectionEngine).toBeDefined();
      expect(scanner.deepfakeEngine).toBeDefined();
      expect(scanner.copyrightEngine).toBeDefined();
      expect(scanner.c2paVerifier).toBeDefined();
      expect(scanner.riskCalculator).toBeDefined();
    });

    test('should validate input correctly', async () => {
      await expect(scanner.scan({})).rejects.toThrow('Content is required');
      await expect(scanner.scan({ content: mockImageBuffer })).rejects.toThrow('Invalid content type');
    });
  });

  describe('Image Scanning', () => {
    test('should scan image successfully', async () => {
      const result = await scanner.scan({
        content: mockImageBuffer,
        contentType: 'image',
        mimeType: 'image/jpeg',
        filename: 'test.jpg'
      });

      expect(result).toHaveProperty('scanId');
      expect(result).toHaveProperty('contentType', 'image');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('gateDecision');
      expect(result).toHaveProperty('aiDetection');
      expect(result).toHaveProperty('deepfakeDetection');
      expect(result).toHaveProperty('copyrightCheck');
    });

    test('should return cached result on second scan', async () => {
      const result1 = await scanner.scan({
        content: mockImageBuffer,
        contentType: 'image',
        mimeType: 'image/jpeg',
        filename: 'test.jpg'
      });

      const result2 = await scanner.scan({
        content: mockImageBuffer,
        contentType: 'image',
        mimeType: 'image/jpeg',
        filename: 'test.jpg'
      });

      expect(result2.cached).toBe(true);
      expect(result2.scanId).toBe(result1.scanId);
    });
  });

  describe('Video Scanning', () => {
    test('should scan video successfully', async () => {
      const result = await scanner.scan({
        content: mockVideoBuffer,
        contentType: 'video',
        mimeType: 'video/mp4',
        filename: 'test.mp4'
      });

      expect(result).toHaveProperty('scanId');
      expect(result).toHaveProperty('contentType', 'video');
      expect(result).toHaveProperty('riskScore');
      expect(result.deepfakeDetection.contentType).toBe('video');
    });
  });

  describe('NFT Gate', () => {
    test('should perform NFT gate check', async () => {
      const result = await scanner.nftGate({
        content: mockImageBuffer,
        contentType: 'image',
        mimeType: 'image/jpeg',
        filename: 'nft.jpg',
        metadata: { claimedCreator: 'artist123' },
        wallet: '0x1234567890abcdef'
      });

      expect(result).toHaveProperty('scanId');
      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('nftSpecificRisks');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('Error Handling', () => {
    test('should handle oversized files', async () => {
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
      
      const result = await scanner.scan({
        content: largeBuffer,
        contentType: 'image',
        mimeType: 'image/jpeg'
      });

      expect(result.error).toBe(true);
      expect(result.gateDecision.decision).toBe('BLOCK');
    });

    test('should return scan status', () => {
      const status = scanner.getScanStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });
});

describe('AIDetectionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AIDetectionEngine();
  });

  test('should detect AI generated content', async () => {
    const result = await engine.detect(mockImageBuffer, { mimeType: 'image/jpeg' });
    
    expect(result).toHaveProperty('isAIGenerated');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('indicators');
    expect(result.method).toBe('heuristic');
  });

  test('should track stats', () => {
    const stats = engine.getStats();
    expect(stats).toHaveProperty('totalScanned');
    expect(stats).toHaveProperty('aiDetected');
    expect(stats).toHaveProperty('successRate');
  });
});

describe('DeepfakeDetectionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new DeepfakeDetectionEngine();
  });

  test('should detect deepfakes in images', async () => {
    const result = await engine.detect(mockImageBuffer, { 
      contentType: 'image',
      mimeType: 'image/jpeg' 
    });
    
    expect(result).toHaveProperty('isDeepfake');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('indicators');
    expect(result.contentType).toBe('image');
  });

  test('should detect deepfakes in videos', async () => {
    const result = await engine.detect(mockVideoBuffer, { 
      contentType: 'video',
      mimeType: 'video/mp4' 
    });
    
    expect(result).toHaveProperty('isDeepfake');
    expect(result.contentType).toBe('video');
  });
});

describe('CopyrightCheckEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new CopyrightCheckEngine();
  });

  test('should check copyright', async () => {
    const result = await engine.check(mockImageBuffer, { 
      description: 'A painting in the style of Van Gogh',
      tags: ['art', 'painting']
    });
    
    expect(result).toHaveProperty('hasMatches');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('styleSimilarity');
    expect(result).toHaveProperty('metadataAnalysis');
  });
});

describe('C2PAVerifier', () => {
  let verifier;

  beforeEach(() => {
    verifier = new C2PAVerifier();
  });

  test('should verify C2PA metadata', async () => {
    const result = await verifier.verify(mockImageBuffer);
    
    expect(result).toHaveProperty('hasC2PA');
    expect(result).toHaveProperty('valid');
  });
});

describe('RiskScoreCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new RiskScoreCalculator();
  });

  test('should calculate risk score', () => {
    const checks = {
      aiDetection: { isAIGenerated: true, confidence: 0.8 },
      deepfakeDetection: { isDeepfake: false, confidence: 0.9 },
      copyrightCheck: { hasMatches: false, riskLevel: 'low' },
      c2paVerification: { hasC2PA: false }
    };

    const score = calculator.calculate(checks);
    
    expect(score).toHaveProperty('overall');
    expect(score).toHaveProperty('level');
    expect(score).toHaveProperty('confidence');
    expect(score).toHaveProperty('breakdown');
    expect(score).toHaveProperty('factors');
  });

  test('should determine correct risk level', () => {
    const lowRisk = calculator.calculate({
      aiDetection: { isAIGenerated: false, confidence: 0.9 },
      deepfakeDetection: { isDeepfake: false, confidence: 0.9 },
      copyrightCheck: { hasMatches: false, riskLevel: 'low' },
      c2paVerification: { hasC2PA: true, valid: true }
    });
    expect(lowRisk.level).toBe('minimal');

    const highRisk = calculator.calculate({
      aiDetection: { isAIGenerated: true, confidence: 0.9 },
      deepfakeDetection: { isDeepfake: true, confidence: 0.95 },
      copyrightCheck: { hasMatches: true, riskLevel: 'high' },
      c2paVerification: { hasC2PA: false }
    });
    expect(highRisk.level).toBe('high');
  });
});

describe('ScanResult Model', () => {
  test('should create scan result', () => {
    const result = new ScanResult({
      scanId: 'test-123',
      contentType: 'image',
      mimeType: 'image/jpeg'
    });

    expect(result.scanId).toBe('test-123');
    expect(result.contentType).toBe('image');
  });

  test('should chain setters', () => {
    const result = new ScanResult({ scanId: 'test' })
      .setAIDetection({ isAIGenerated: true })
      .setRiskScore({ overall: 50 })
      .setGateDecision({ decision: 'WARN' });

    expect(result.aiDetection.isAIGenerated).toBe(true);
    expect(result.riskScore.overall).toBe(50);
    expect(result.gateDecision.decision).toBe('WARN');
  });

  test('should convert to JSON', () => {
    const result = new ScanResult({ scanId: 'test' });
    const json = result.toJSON();
    
    expect(json).toHaveProperty('scanId', 'test');
    expect(json).toHaveProperty('timestamp');
  });
});

// 간단한 테스트 러너
if (require.main === module) {
  console.log('Running AI Content Scanner Tests...\n');
  
  // Note: In a real environment, use Jest or similar test framework
  console.log('✅ Test suite defined. Run with: npm test');
  console.log('\nTest Coverage:');
  console.log('  - AIContentScanner basic functionality');
  console.log('  - Image scanning');
  console.log('  - Video scanning');
  console.log('  - NFT gate checks');
  console.log('  - Error handling');
  console.log('  - AIDetectionEngine');
  console.log('  - DeepfakeDetectionEngine');
  console.log('  - CopyrightCheckEngine');
  console.log('  - C2PAVerifier');
  console.log('  - RiskScoreCalculator');
  console.log('  - ScanResult model');
}

module.exports = {
  mockImageBuffer,
  mockVideoBuffer
};
