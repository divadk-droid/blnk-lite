const express = require('express');
const router = express.Router();

/**
 * Freemium Plan Implementation
 * 묶음 100회/일 묣제 API 사용량 관리
 */

// 사용자 사용량 저장소 (실제로는 Redis/DB 사용)
const usageStore = new Map();

// Rate limits by tier
const TIERS = {
  free: { dailyLimit: 100, monthlyLimit: 3000 },
  starter: { dailyLimit: 1000, monthlyLimit: 10000 },
  pro: { dailyLimit: 10000, monthlyLimit: Infinity },
  enterprise: { dailyLimit: Infinity, monthlyLimit: Infinity }
};

// Middleware: 사용량 체크
function checkUsage(req, res, next) {
  const apiKey = req.headers['x-api-key'] || 'free';
  const today = new Date().toISOString().split('T')[0];
  const key = `${apiKey}:${today}`;
  
  const tier = getTier(apiKey);
  const limit = TIERS[tier].dailyLimit;
  
  const currentUsage = usageStore.get(key) || 0;
  
  if (currentUsage >= limit) {
    return res.status(429).json({
      error: 'Daily limit exceeded',
      tier,
      limit,
      used: currentUsage,
      upgrade: tier === 'free' ? 'https://blnk.io/upgrade' : null
    });
  }
  
  // 사용량 증가
  usageStore.set(key, currentUsage + 1);
  
  // 응답 헤더에 사용량 정보 추가
  res.set('X-RateLimit-Limit', limit);
  res.set('X-RateLimit-Remaining', limit - currentUsage - 1);
  res.set('X-RateLimit-Tier', tier);
  
  next();
}

// 티어 확인 함수
function getTier(apiKey) {
  if (apiKey === 'free' || !apiKey) return 'free';
  if (apiKey.startsWith('starter_')) return 'starter';
  if (apiKey.startsWith('pro_')) return 'pro';
  if (apiKey.startsWith('enterprise_')) return 'enterprise';
  return 'free';
}

// GET /api/v1/billing/plans - 플랜 목록
router.get('/plans', (req, res) => {
  res.json({
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        dailyLimit: 100,
        monthlyLimit: 3000,
        features: ['Basic risk assessment', 'Community support']
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        period: 'month',
        dailyLimit: 1000,
        monthlyLimit: 10000,
        features: ['Advanced risk scoring', 'Email support', 'API access']
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 99,
        period: 'month',
        dailyLimit: 10000,
        monthlyLimit: Infinity,
        features: ['HFT API access', 'Priority support', 'Custom integrations']
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        dailyLimit: Infinity,
        monthlyLimit: Infinity,
        features: ['SLA guarantee', 'Dedicated support', 'Custom development']
      }
    ]
  });
});

// GET /api/v1/billing/usage - 현재 사용량
router.get('/usage', (req, res) => {
  const apiKey = req.headers['x-api-key'] || 'free';
  const today = new Date().toISOString().split('T')[0];
  const key = `${apiKey}:${today}`;
  
  const tier = getTier(apiKey);
  const limit = TIERS[tier].dailyLimit;
  const used = usageStore.get(key) || 0;
  const remaining = limit === Infinity ? Infinity : limit - used;
  
  res.json({
    tier,
    daily: {
      limit,
      used,
      remaining
    },
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

// POST /api/v1/billing/upgrade - 업그레이드
router.post('/upgrade', (req, res) => {
  const { plan } = req.body;
  
  if (!['starter', 'pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  
  res.json({
    message: `Upgrade to ${plan} initiated`,
    checkoutUrl: `https://blnk.io/checkout?plan=${plan}`,
    apiKey: `${plan}_${Date.now()}`
  });
});

module.exports = { router, checkUsage };