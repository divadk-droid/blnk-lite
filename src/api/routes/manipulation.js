const express = require('express');
const router = express.Router();

/**
 * Market Manipulation Detection
 * 시장 조작 패턴 실시간 탐지 및 자동 차단
 */

// 조작 패턴 탐지 (시뮬레이션)
function detectManipulationPatterns(trades) {
  const patterns = [];
  
  // 1. 워시 트레이딩 (Wash Trading)
  const uniqueAddresses = new Set(trades.map(t => t.from));
  if (uniqueAddresses.size / trades.length < 0.3) {
    patterns.push({
      type: 'WASH_TRADING',
      confidence: 85,
      description: 'Same addresses trading with each other repeatedly'
    });
  }
  
  // 2. 프론트러닝 (Front-running)
  const largeTrades = trades.filter(t => parseFloat(t.amount) > 10000);
  if (largeTrades.length > 3) {
    patterns.push({
      type: 'FRONT_RUNNING',
      confidence: 70,
      description: 'Large trades preceding price movements'
    });
  }
  
  // 3. 스푸핑 (Spoofing)
  const cancelledOrders = trades.filter(t => t.status === 'cancelled');
  if (cancelledOrders.length / trades.length > 0.5) {
    patterns.push({
      type: 'SPOOFING',
      confidence: 75,
      description: 'High cancellation rate indicating fake orders'
    });
  }
  
  // 4. 펌프 앤 덤프 (Pump and Dump)
  const priceChange = calculatePriceChange(trades);
  if (priceChange > 50) {
    patterns.push({
      type: 'PUMP_AND_DUMP',
      confidence: 80,
      description: 'Rapid price increase followed by sell-off'
    });
  }
  
  return patterns;
}

function calculatePriceChange(trades) {
  if (trades.length < 2) return 0;
  const firstPrice = parseFloat(trades[0].price);
  const lastPrice = parseFloat(trades[trades.length - 1].price);
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

// POST /api/v1/manipulation/detect
router.post('/detect', async (req, res) => {
  try {
    const { token, trades, timeframe } = req.body;
    
    if (!token || !trades) {
      return res.status(400).json({
        error: 'token and trades are required'
      });
    }
    
    const detectionId = `manip_${Date.now()}`;
    const patterns = detectManipulationPatterns(trades);
    
    const riskScore = patterns.length > 0 
      ? Math.max(...patterns.map(p => p.confidence))
      : 0;
    
    const riskLevel = riskScore >= 80 ? 'CRITICAL' : 
                      riskScore >= 60 ? 'HIGH' : 
                      riskScore >= 40 ? 'MEDIUM' : 'LOW';
    
    const shouldBlock = riskScore >= 80;
    
    res.json({
      detectionId,
      token,
      timeframe: timeframe || '1h',
      riskScore,
      riskLevel,
      patterns,
      totalTradesAnalyzed: trades.length,
      manipulationDetected: patterns.length > 0,
      recommendation: shouldBlock ? 'BLOCK_TRADING' : 
                      riskScore >= 60 ? 'ALERT' : 'MONITOR',
      shouldBlock,
      detectedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/v1/manipulation/auto-block
router.post('/auto-block', (req, res) => {
  const { token, reason, adminKey } = req.body;
  
  // 간단한 관리자 키 검증
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json({
    blockId: `block_${Date.now()}`,
    token,
    status: 'BLOCKED',
    reason,
    blockedAt: new Date().toISOString(),
    message: 'Trading automatically blocked due to manipulation detection'
  });
});

// GET /api/v1/manipulation/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Market Manipulation Detector',
    patternsSupported: ['WASH_TRADING', 'FRONT_RUNNING', 'SPOOFING', 'PUMP_AND_DUMP'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;