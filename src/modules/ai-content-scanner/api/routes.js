/**
 * AI Content Scanner API Routes
 * 
 * AI 콘텐츠 리스크 스캐너 API 엔드포인트 정의
 */

const express = require('express');
const { AIContentScanner } = require('../scanner');

// 스캐너 인스턴스 생성
const scanner = new AIContentScanner();

/**
 * AI 콘텐츠 스캐너 라우트 등록
 * @param {express.Application} app - Express 앱 인스턴스
 */
function registerRoutes(app) {
  
  /**
   * @route POST /api/v1/ai-content/scan
   * @desc 콘텐츠 리스크 스캔
   * @access Public (Rate Limited)
   */
  app.post('/api/v1/ai-content/scan', async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { 
        content, 
        contentUrl, 
        contentType, 
        mimeType, 
        filename,
        options = {} 
      } = req.body;

      // 입력 검증
      if (!content && !contentUrl) {
        return res.status(400).json({
          error: 'Content or contentUrl is required',
          code: 'MISSING_CONTENT'
        });
      }

      if (!contentType || !['image', 'video'].includes(contentType)) {
        return res.status(400).json({
          error: 'Valid contentType is required (image or video)',
          code: 'INVALID_CONTENT_TYPE'
        });
      }

      // 콘텐츠 로드 (URL에서)
      let contentBuffer = content;
      if (contentUrl) {
        contentBuffer = await fetchContentFromUrl(contentUrl);
      }

      // Base64 디코딩 (문자열인 경우)
      if (typeof contentBuffer === 'string' && contentBuffer.startsWith('data:')) {
        contentBuffer = Buffer.from(contentBuffer.split(',')[1], 'base64');
      } else if (typeof contentBuffer === 'string') {
        contentBuffer = Buffer.from(contentBuffer, 'base64');
      }

      // 스캔 실행
      const result = await scanner.scan({
        content: contentBuffer,
        contentType,
        mimeType: mimeType || (contentType === 'image' ? 'image/jpeg' : 'video/mp4'),
        filename: filename || 'unknown',
        options
      });

      // 응답
      res.json({
        success: !result.error,
        ...result,
        api_latency_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error('AI Content Scan Error:', error);
      res.status(500).json({
        error: error.message,
        code: 'SCAN_ERROR',
        api_latency_ms: Date.now() - startTime
      });
    }
  });

  /**
   * @route POST /api/v1/ai-content/verify
   * @desc C2PA 메타데이터 검증
   * @access Public (Rate Limited)
   */
  app.post('/api/v1/ai-content/verify', async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { content, contentUrl } = req.body;

      if (!content && !contentUrl) {
        return res.status(400).json({
          error: 'Content or contentUrl is required',
          code: 'MISSING_CONTENT'
        });
      }

      let contentBuffer = content;
      if (contentUrl) {
        contentBuffer = await fetchContentFromUrl(contentUrl);
      }

      if (typeof contentBuffer === 'string') {
        contentBuffer = Buffer.from(contentBuffer, 'base64');
      }

      const { C2PAVerifier } = require('../engines/c2pa-verifier');
      const verifier = new C2PAVerifier();
      const result = await verifier.verify(contentBuffer);

      res.json({
        success: true,
        verification: result,
        api_latency_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error('C2PA Verification Error:', error);
      res.status(500).json({
        error: error.message,
        code: 'VERIFICATION_ERROR',
        api_latency_ms: Date.now() - startTime
      });
    }
  });

  /**
   * @route POST /api/v1/ai-content/nft-gate
   * @desc NFT 민팅 게이트 검사
   * @access Public (Rate Limited)
   */
  app.post('/api/v1/ai-content/nft-gate', async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { 
        content, 
        contentUrl,
        contentType,
        mimeType,
        filename,
        metadata = {},
        wallet = 'anonymous'
      } = req.body;

      if (!content && !contentUrl) {
        return res.status(400).json({
          error: 'Content or contentUrl is required',
          code: 'MISSING_CONTENT'
        });
      }

      let contentBuffer = content;
      if (contentUrl) {
        contentBuffer = await fetchContentFromUrl(contentUrl);
      }

      if (typeof contentBuffer === 'string') {
        contentBuffer = Buffer.from(contentBuffer, 'base64');
      }

      // NFT 게이트 검사
      const result = await scanner.nftGate({
        content: contentBuffer,
        contentType,
        mimeType,
        filename,
        metadata,
        wallet
      });

      res.json({
        success: true,
        ...result,
        api_latency_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error('NFT Gate Error:', error);
      res.status(500).json({
        error: error.message,
        code: 'GATE_ERROR',
        api_latency_ms: Date.now() - startTime
      });
    }
  });

  /**
   * @route GET /api/v1/ai-content/status/:scanId
   * @desc 스캔 상태 조회
   * @access Public
   */
  app.get('/api/v1/ai-content/status/:scanId', (req, res) => {
    const { scanId } = req.params;
    
    const result = scanner.getScanStatus(scanId);
    
    if (!result) {
      return res.status(404).json({
        error: 'Scan not found',
        code: 'SCAN_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      scan: result
    });
  });

  /**
   * @route GET /api/v1/ai-content/stats
   * @desc 스캐너 통계 조회
   * @access Public
   */
  app.get('/api/v1/ai-content/stats', (req, res) => {
    res.json({
      success: true,
      stats: scanner.getStats(),
      timestamp: new Date().toISOString()
    });
  });

  /**
   * @route GET /api/v1/ai-content/health
   * @desc AI 콘텐츠 스캐너 헬스 체크
   * @access Public
   */
  app.get('/api/v1/ai-content/health', (req, res) => {
    res.json({
      status: 'healthy',
      module: 'ai-content-scanner',
      version: '1.0.0',
      phase: 'Phase 1 - Basic Structure',
      engines: {
        aiDetection: 'heuristic (Phase 2: API integration)',
        deepfakeDetection: 'heuristic (Phase 2: API integration)',
        copyrightCheck: 'basic (Phase 3: full implementation)',
        c2paVerification: 'placeholder (Phase 4: full implementation)'
      },
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ AI Content Scanner API routes registered');
}

/**
 * URL에서 콘텐츠 가져오기
 * @private
 */
async function fetchContentFromUrl(url) {
  // Phase 2: 실제 HTTP 클라이언트 구현
  // 현재는 에러 반환
  throw new Error('URL fetching not implemented in Phase 1');
}

module.exports = { registerRoutes };
