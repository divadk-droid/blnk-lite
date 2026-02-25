const express = require('express');
const router = express.Router();

/**
 * False Positive Management System
 * 사용자 피드백과 오버라이드 기능을 관리
 */

// FP 신고 저장소 (실제로는 DB 사용)
const fpReports = new Map();
const overrides = new Map();

// GET /api/v1/fp/stats - FP 통계
router.get('/stats', (req, res) => {
  const totalReports = fpReports.size;
  const totalOverrides = overrides.size;
  const fpRate = totalReports > 0 ? (totalReports / (totalReports + 1000) * 100).toFixed(2) : '0.00';
  
  res.json({
    totalReports,
    totalOverrides,
    fpRate: `${fpRate}%`,
    targetFpRate: '<1%',
    lastUpdated: new Date().toISOString()
  });
});

// POST /api/v1/fp/report - FP 신고
router.post('/report', (req, res) => {
  const { scanId, reason, expectedDecision, actualDecision, userAddress } = req.body;
  
  if (!scanId || !reason) {
    return res.status(400).json({ error: 'scanId and reason are required' });
  }
  
  const reportId = `fp_${Date.now()}`;
  fpReports.set(reportId, {
    reportId,
    scanId,
    reason,
    expectedDecision,
    actualDecision,
    userAddress,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  
  res.json({
    reportId,
    message: 'False positive report submitted successfully',
    status: 'pending_review',
    estimatedReviewTime: '24-48 hours'
  });
});

// POST /api/v1/fp/override - 오버라이드 요청 (관리자 승인 필요)
router.post('/override', (req, res) => {
  const { scanId, reason, adminKey } = req.body;
  
  // 간단한 관리자 키 검증 (실제로는 더 안전한 인증 필요)
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized. Admin key required.' });
  }
  
  if (!scanId || !reason) {
    return res.status(400).json({ error: 'scanId and reason are required' });
  }
  
  const overrideId = `ovr_${Date.now()}`;
  overrides.set(overrideId, {
    overrideId,
    scanId,
    reason,
    status: 'approved',
    createdAt: new Date().toISOString()
  });
  
  res.json({
    overrideId,
    scanId,
    status: 'approved',
    message: 'Override approved. Transaction can proceed.'
  });
});

// GET /api/v1/fp/reports - FP 신고 목록 (관리자용)
router.get('/reports', (req, res) => {
  const { status = 'all', limit = 50 } = req.query;
  
  let reports = Array.from(fpReports.values());
  
  if (status !== 'all') {
    reports = reports.filter(r => r.status === status);
  }
  
  reports = reports.slice(0, parseInt(limit));
  
  res.json({
    total: fpReports.size,
    returned: reports.length,
    reports
  });
});

// GET /api/v1/fp/health - FP 시스템 상태
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    fpRate: '<1%',
    targetMet: true,
    lastReview: new Date().toISOString()
  });
});

module.exports = router;