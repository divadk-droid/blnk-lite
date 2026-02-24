/**
 * AI Content Scanner API Routes
 * 
 * Phase 2 API 엔드포인트 구현
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { AIContentScanner } = require('../scanner');
const { EnhancedDeepfakeDetectionEngine } = require('../engines/enhanced-deepfake-detection');

const router = express.Router();

// 파일 업로드 설정
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Rate Limiting
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 분당 100 요청
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});

// 스캐너 인스턴스
const scanner = new AIContentScanner({
  enableDeepfakeDetection: true,
  enableAIDetection: true,
  enableCopyrightCheck: true
});

const deepfakeEngine = new EnhancedDeepfakeDetectionEngine();

// 미들웨어: API 키 검증
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'INVALID_API_KEY',
        message: 'API key is required'
      }
    });
  }

  // TODO: 실제 API 키 검증 로직
  req.apiKey = apiKey;
  next();
};

// 미들웨어: 에러 처리
const handleError = (err, req, res, next) => {
  console.error('API Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 100MB limit'
        }
      });
    }
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
};

/**
 * POST /scan - 콘텐츠 스캔
 */
router.post('/scan', 
  scanLimiter,
  validateApiKey,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CONTENT',
            message: 'No file provided'
          }
        });
      }

      const contentType = req.body.content_type || 
                         (req.file.mimetype.startsWith('video/') ? 'video' : 'image');

      const result = await scanner.scan({
        content: req.file.buffer,
        contentType,
        mimeType: req.file.mimetype,
        filename: req.body.filename || req.file.originalname,
        options: {
          skipCache: req.body.skip_cache === 'true',
          wallet: req.body.wallet_address
        }
      });

      res.json(result);

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * POST /detect/deepfake - 딥페이크 전용 탐지
 */
router.post('/detect/deepfake',
  scanLimiter,
  validateApiKey,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CONTENT',
            message: 'No file provided'
          }
        });
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      
      const result = await deepfakeEngine.detect(req.file.buffer, {
        contentType: isVideo ? 'video' : 'image',
        mimeType: req.file.mimetype,
        filename: req.file.originalname
      });

      // 응답 형식 표준화
      res.json({
        scan_id: `df_${Date.now()}`,
        ...result,
        file_info: {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        }
      });

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * POST /nft-gate - NFT 민팅 게이트
 */
router.post('/nft-gate',
  scanLimiter,
  validateApiKey,
  [
    body('content_url').optional().isURL(),
    body('metadata').optional().isObject(),
    body('wallet').optional().isEthereumAddress(),
    body('collection_address').optional().isEthereumAddress()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          }
        });
      }

      const { content_url, metadata, wallet, collection_address } = req.body;

      // TODO: URL에서 콘텐츠 다운로드 및 스캔
      // 현재는 모의 응답
      const result = await scanner.nftGate({
        content: Buffer.from([]), // Placeholder
        metadata,
        wallet
      });

      res.json(result);

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * GET /status/:scan_id - 스캔 상태 조회
 */
router.get('/status/:scan_id',
  validateApiKey,
  async (req, res) => {
    try {
      const { scan_id } = req.params;
      
      const result = scanner.getScanStatus(scan_id);
      
      if (!result) {
        return res.status(404).json({
          error: {
            code: 'SCAN_NOT_FOUND',
            message: 'Scan not found or expired'
          }
        });
      }

      res.json({
        scan_id,
        status: 'completed',
        progress: 100,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * POST /batch/scan - 배치 스캔
 */
router.post('/batch/scan',
  scanLimiter,
  validateApiKey,
  upload.array('files', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CONTENT',
            message: 'No files provided'
          }
        });
      }

      const batchId = `batch_${Date.now()}`;
      const startTime = Date.now();

      // 병렬 스캔
      const scanPromises = req.files.map(async (file) => {
        try {
          const contentType = file.mimetype.startsWith('video/') ? 'video' : 'image';
          const result = await scanner.scan({
            content: file.buffer,
            contentType,
            mimeType: file.mimetype,
            filename: file.originalname
          });

          return {
            filename: file.originalname,
            scan_id: result.scanId,
            risk_score: result.riskScore?.overall || 0,
            decision: result.gateDecision?.decision || 'ERROR',
            status: 'completed'
          };
        } catch (error) {
          return {
            filename: file.originalname,
            status: 'error',
            error: error.message
          };
        }
      });

      const results = await Promise.all(scanPromises);

      res.json({
        batch_id: batchId,
        total: req.files.length,
        completed: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'error').length,
        results,
        latency_ms: Date.now() - startTime
      });

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * GET /health - API 상태 확인
 */
router.get('/health',
  async (req, res) => {
    try {
      const deepfakeHealth = await deepfakeEngine.healthCheck();
      const scannerStats = scanner.getStats();

      res.json({
        status: deepfakeHealth.overall,
        version: '2.0.0-phase2',
        components: {
          api: deepfakeHealth.components.api,
          face_detection: deepfakeHealth.components.face,
          video_analysis: deepfakeHealth.components.video,
          scanner: {
            cache_size: scannerStats.cacheSize,
            engines: scannerStats.engines
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /usage - 사용량 조회
 */
router.get('/usage',
  validateApiKey,
  async (req, res) => {
    try {
      // TODO: 실제 사용량 데이터베이스 조회
      const mockUsage = {
        plan: 'pro',
        billing_period: '2026-02-01 to 2026-02-28',
        usage: {
          scans: {
            used: 4520,
            limit: 10000,
            remaining: 5480
          },
          deepfake_detections: {
            used: 1234,
            limit: 5000
          }
        },
        reset_date: '2026-03-01'
      };

      res.json(mockUsage);

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

/**
 * POST /webhooks/configure - 웹훅 설정
 */
router.post('/webhooks/configure',
  validateApiKey,
  [
    body('url').isURL(),
    body('events').isArray(),
    body('secret').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          }
        });
      }

      const { url, events, secret } = req.body;

      // TODO: 웹훅 설정 저장
      res.json({
        webhook_id: `wh_${Date.now()}`,
        url,
        events,
        status: 'active',
        created_at: new Date().toISOString()
      });

    } catch (error) {
      handleError(error, req, res);
    }
  }
);

module.exports = router;
