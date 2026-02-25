const express = require('express');
const router = express.Router();

/**
 * BLNK API Catalog - 모든 API 엔드포인트를 설명하고 접근할 수 있는 중앙 허브
 * 다른 에이전트가 BLNK 서비스를 발견하고 사용하기 위한 입장 통로
 */

// GET /api/v1/catalog - 전체 API 카탈로그
router.get('/', (req, res) => {
  const baseUrl = 'https://blnk-lite-production.up.railway.app';
  
  res.json({
    service: 'BLNK Risk Gate',
    version: '1.0.0',
    description: 'Web3 Risk Management Gateway - Smart contract risk assessment, AI content verification, and real-time monitoring APIs',
    baseUrl,
    documentation: `${baseUrl}/api/v1/catalog/docs`,
    timestamp: new Date().toISOString(),
    
    categories: [
      {
        id: 'execution',
        name: 'Execution Layer',
        description: 'Pre-trade risk assessment and execution gating',
        apis: [
          {
            id: 'execution_pre_trade_gate',
            name: 'Pre-Trade Risk Gate',
            endpoint: 'POST /api/v1/gate',
            description: 'MANDATORY gate before any swap/DCA/yield operation. Returns PASS/WARN/BLOCK decision.',
            price: { amount: 1, currency: 'USD', type: 'per_call' },
            latency: '2-30 seconds',
            requiredParams: ['token', 'actionType'],
            optionalParams: ['amount', 'chain', 'wallet'],
            responseFields: ['decision', 'riskScore', 'riskLevel', 'checks'],
            example: {
              request: { token: '0x1234...', actionType: 'swap', amount: '1000' },
              response: { decision: 'PASS', riskScore: 15, riskLevel: 'LOW' }
            }
          },
          {
            id: 'hft_risk_api',
            name: 'HFT Risk Assessment',
            endpoint: 'POST /api/v1/hft/risk-assess',
            description: 'Ultra-low-latency risk assessment for high-frequency trading. Sub-10ms response.',
            price: { amount: 0.5, currency: 'USD', type: 'per_call' },
            latency: '< 10ms',
            requiredParams: ['contractAddress'],
            optionalParams: ['chainId', 'transactionData', 'checks'],
            responseFields: ['assessmentId', 'riskScore', 'latency', 'owaspVulnerabilities', 'mevRisk'],
            targetUsers: ['Quant trading firms', 'MEV bots', 'Institutional DeFi traders'],
            example: {
              request: { contractAddress: '0x1234...', chainId: 1 },
              response: { riskScore: 25, latency: '8ms', mevRisk: 'LOW' }
            }
          }
        ]
      },
      
      {
        id: 'validation',
        name: 'Validation Layer',
        description: 'Token and contract security validation',
        apis: [
          {
            id: 'validation_token_safety_scan',
            name: 'Token Safety Scan',
            endpoint: 'POST /api/v1/validation/token-safety',
            description: 'Comprehensive risk signals: minting, ownership, blacklist, tax, upgradeable.',
            price: { amount: 5, currency: 'USD', type: 'per_call' },
            latency: '5-15 seconds',
            requiredParams: ['contractAddress'],
            optionalParams: ['chainId'],
            responseFields: ['riskLevel', 'riskScore', 'vulnerabilities', 'checks', 'evidence'],
            example: {
              request: { contractAddress: '0x1234...' },
              response: { riskLevel: 'LOW', riskScore: 15, checks: { minting: 'safe' } }
            }
          },
          {
            id: 'validation_token_compare',
            name: 'Token Compare',
            endpoint: 'POST /api/v1/validation/token-compare',
            description: 'Side-by-side risk comparison between two tokens.',
            price: { amount: 8, currency: 'USD', type: 'per_call' },
            latency: '8-15 seconds',
            requiredParams: ['tokenA', 'tokenB'],
            responseFields: ['comparison', 'riskDelta', 'recommendation'],
            example: {
              request: { tokenA: '0x1234...', tokenB: '0x5678...' },
              response: { riskDelta: -10, recommendation: 'Token A is safer' }
            }
          },
          {
            id: 'validation_onchain_trace',
            name: 'Onchain Trace',
            endpoint: 'POST /api/v1/validation/onchain-trace',
            description: 'Fund flow analysis, counterparties, anomaly patterns.',
            price: { amount: 10, currency: 'USD', type: 'per_call' },
            latency: '10-30 seconds',
            requiredParams: ['address'],
            optionalParams: ['depth', 'timeframe'],
            responseFields: ['flows', 'counterparties', 'anomalies'],
            example: {
              request: { address: '0x1234...' },
              response: { flows: [], counterparties: [], anomalies: [] }
            }
          },
          {
            id: 'counterparty_risk_score',
            name: 'Counterparty Risk Score',
            endpoint: 'POST /api/v1/validation/counterparty',
            description: 'Real-time counterparty evaluation for pre-trade and monitoring.',
            price: { amount: 3, currency: 'USD', type: 'per_call' },
            latency: '2-5 seconds',
            requiredParams: ['subjectAddress', 'counterparties'],
            responseFields: ['riskScore', 'exposureBreakdown', 'topRiskSources'],
            example: {
              request: { subjectAddress: '0x1234...', counterparties: ['0x5678...'] },
              response: { riskScore: 30, exposureBreakdown: {} }
            }
          }
        ]
      },
      
      {
        id: 'portfolio',
        name: 'Portfolio Layer',
        description: 'Portfolio-level risk management and analysis',
        apis: [
          {
            id: 'portfolio_risk_dashboard',
            name: 'Portfolio Risk Dashboard',
            endpoint: 'POST /api/v1/portfolio/dashboard',
            description: 'Complete portfolio risk dashboard with exposure map, correlation matrix.',
            price: { amount: 25, currency: 'USD', type: 'per_call' },
            latency: '15-30 seconds',
            requiredParams: ['walletAddress'],
            optionalParams: ['chains'],
            responseFields: ['exposureMap', 'correlationMatrix', 'concentrationRisks'],
            example: {
              request: { walletAddress: '0x1234...', chains: ['ethereum', 'base'] },
              response: { exposureMap: {}, correlationMatrix: [] }
            }
          },
          {
            id: 'portfolio_batch_scan',
            name: 'Portfolio Batch Scan',
            endpoint: 'POST /api/v1/portfolio/batch-scan',
            description: 'Bulk risk assessment for 10-50 tokens with CSV/JSON export.',
            price: { amount: 50, currency: 'USD', type: 'per_call' },
            latency: '30-60 seconds',
            requiredParams: ['tokens'],
            constraints: { minTokens: 10, maxTokens: 50 },
            responseFields: ['results', 'riskRanking', 'batchSummary'],
            example: {
              request: { tokens: ['0x1234...', '0x5678...'] },
              response: { results: [], riskRanking: [] }
            }
          },
          {
            id: 'policy_pack',
            name: 'Policy Pack',
            endpoint: 'POST /api/v1/portfolio/policy',
            description: 'Institutional policy compliance checking.',
            price: { amount: 15, currency: 'USD', type: 'per_call' },
            latency: '5-10 seconds',
            requiredParams: ['token', 'policyRules'],
            responseFields: ['decision', 'violations', 'complianceScore'],
            targetUsers: ['Institutional investors', 'Regulated entities'],
            example: {
              request: { token: '0x1234...', policyRules: {} },
              response: { decision: 'PASS', complianceScore: 95 }
            }
          }
        ]
      },
      
      {
        id: 'monitoring',
        name: 'Monitoring Layer',
        description: 'Real-time monitoring and alerting',
        apis: [
          {
            id: 'monitoring_watch_daily',
            name: 'Watch Daily (Pro)',
            endpoint: 'POST /api/v1/monitoring/watch',
            description: 'Monthly subscription: 50 token slots + daily/hourly monitoring + alerts.',
            price: { amount: 79, currency: 'USD', type: 'monthly_subscription' },
            features: ['50 token slots', 'Webhook/Telegram alerts', 'Change detection', 'Auto-renew'],
            alternative: 'Included in PRO tier ($99/mo with 500 $BLNK)',
            requiredParams: ['subscription', 'tokens'],
            responseFields: ['subscriptionId', 'status', 'monitoredTokens']
          },
          {
            id: 'anomaly_alert_realtime',
            name: 'Real-time Anomaly Alerts',
            endpoint: 'POST /api/v1/monitoring/alerts',
            description: 'Real-time anomaly detection stream. Webhook/Telegram alerts.',
            price: { amount: 49, currency: 'USD', type: 'monthly_add_on' },
            note: 'Add-on to Monitoring Pro',
            requiredParams: ['alertType', 'deliveryMethod'],
            responseFields: ['alertId', 'status', 'deliveryConfig']
          },
          {
            id: 'liquidity_shock_detector',
            name: 'Liquidity Shock Detector',
            endpoint: 'POST /api/v1/monitoring/liquidity',
            description: 'Hourly monitoring for liquidity crises.',
            price: { amount: 4, currency: 'USD', type: 'per_call' },
            latency: 'Hourly checks',
            requiredParams: ['token', 'threshold'],
            responseFields: ['shockEvents', 'severity', 'likelyCause']
          }
        ]
      },
      
      {
        id: 'ai_content',
        name: 'AI Content Layer',
        description: 'AI-generated content detection and verification',
        apis: [
          {
            id: 'ai_content_risk_scanner',
            name: 'AI Content Risk Scanner',
            endpoint: 'POST /api/v1/ai-content/scan',
            description: 'AI-generated content detection, deepfake probability, copyright risk, C2PA verification.',
            price: { amount: 2, currency: 'USD', type: 'per_call' },
            latency: '100-500ms',
            requiredParams: ['contentUrl', 'contentType'],
            optionalParams: ['checkDeepfake', 'checkCopyright', 'verifyC2PA'],
            responseFields: ['scanId', 'riskScore', 'aiGenerated', 'deepfakeProbability', 'copyrightRisk', 'c2paVerified'],
            targetUsers: ['NFT marketplaces', 'Creator platforms', 'Social media'],
            example: {
              request: { contentUrl: 'https://example.com/image.jpg', contentType: 'image' },
              response: { riskScore: 25, aiGenerated: false, deepfakeProbability: 0.05 }
            }
          }
        ]
      },
      
      {
        id: 'alpha',
        name: 'Alpha Intelligence Layer',
        description: 'Institutional-grade intelligence and signals',
        apis: [
          {
            id: 'alpha_feed_api',
            name: 'Alpha Feed API',
            endpoint: 'POST /api/v1/alpha/feed',
            description: 'Institutional-grade alpha signals: whale movements, smart money flows, early trend detection.',
            price: { amount: 25, currency: 'USD', type: 'per_call' },
            latency: '1-3 minutes',
            requiredParams: ['target'],
            optionalParams: ['analysisType', 'timeframe'],
            responseFields: ['feedId', 'whaleMovements', 'smartMoneyFlows', 'anomalySignals', 'earlyTrends'],
            targetUsers: ['Quantitative traders', 'Fund managers'],
            example: {
              request: { target: '0x1234...', analysisType: 'wallet' },
              response: { whaleMovements: [], smartMoneyFlows: [] }
            }
          }
        ]
      },
      
      {
        id: 'reports',
        name: 'Analytics Export Layer',
        description: 'Report generation and export',
        apis: [
          {
            id: 'report_generator',
            name: 'Report Generator',
            endpoint: 'POST /api/v1/reports/generate',
            description: 'Comprehensive PDF or Excel risk report with visualizations.',
            price: { amount: 10, currency: 'USD', type: 'per_call' },
            latency: '5-10 minutes',
            requiredParams: ['targetAddress'],
            optionalParams: ['reportFormat', 'dateRange', 'includeCharts'],
            formats: ['pdf', 'excel', 'csv'],
            responseFields: ['reportId', 'downloadUrl', 'status'],
            enterprise: { price: 299, currency: 'USD', type: 'monthly_unlimited', features: ['White-label'] },
            example: {
              request: { targetAddress: '0x1234...', reportFormat: 'pdf' },
              response: { reportId: 'rpt_xxx', downloadUrl: 'https://...' }
            }
          }
        ]
      },
      
      {
        id: 'creator',
        name: 'Creator Economy Layer',
        description: 'Creator reputation and credit scoring',
        apis: [
          {
            id: 'creator_credit_score',
            name: 'Creator Credit Score',
            endpoint: 'POST /api/v1/creator/credit-score',
            description: 'Comprehensive credit score based on on-chain history, content authenticity, community reputation.',
            price: { amount: 5, currency: 'USD', type: 'per_call' },
            latency: '2-5 minutes',
            requiredParams: ['creatorAddress'],
            optionalParams: ['sbtTokenId', 'includeHistory', 'platforms'],
            responseFields: ['scoreId', 'creditScore', 'creditLevel', 'history', 'verificationStatus'],
            bulk: { price: 199, currency: 'USD', type: 'monthly_100_queries' },
            example: {
              request: { creatorAddress: '0x1234...' },
              response: { creditScore: 85, creditLevel: 'GOOD' }
            }
          }
        ]
      }
    ],
    
    pricing: {
      currency: 'USD',
      models: ['per_call', 'monthly_subscription', 'monthly_add_on'],
      tiers: {
        free: { description: 'Limited access for testing', rateLimit: '10 requests/day' },
        standard: { description: 'Pay-per-use', apiKey: 'Required' },
        pro: { description: '$99/month with 500 $BLNK stake', includes: ['Monitoring Pro', 'Priority support'] }
      }
    },
    
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      registration: 'POST /api/v1/auth/register',
      validation: 'Automatic on each request'
    },
    
    rateLimits: {
      free: '10 requests/day',
      standard: '1000 requests/hour',
      pro: '10000 requests/hour'
    },
    
    support: {
      documentation: `${baseUrl}/api/v1/catalog/docs`,
      examples: `${baseUrl}/api/v1/catalog/examples`,
      sdk: 'Coming soon',
      discord: 'https://discord.gg/blnk',
      email: 'support@blnk.io'
    }
  });
});

// GET /api/v1/catalog/categories - 카테고리 목록만
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'execution', name: 'Execution Layer', apiCount: 2, description: 'Pre-trade risk assessment' },
    { id: 'validation', name: 'Validation Layer', apiCount: 4, description: 'Token and contract security' },
    { id: 'portfolio', name: 'Portfolio Layer', apiCount: 3, description: 'Portfolio risk management' },
    { id: 'monitoring', name: 'Monitoring Layer', apiCount: 3, description: 'Real-time monitoring' },
    { id: 'ai_content', name: 'AI Content Layer', apiCount: 1, description: 'AI content detection' },
    { id: 'alpha', name: 'Alpha Intelligence', apiCount: 1, description: 'Institutional signals' },
    { id: 'reports', name: 'Analytics Export', apiCount: 1, description: 'Report generation' },
    { id: 'creator', name: 'Creator Economy', apiCount: 1, description: 'Creator reputation' }
  ];
  
  res.json({
    totalCategories: categories.length,
    totalApis: categories.reduce((sum, c) => sum + c.apiCount, 0),
    categories
  });
});

// GET /api/v1/catalog/pricing - 가격 정보
router.get('/pricing', (req, res) => {
  res.json({
    currency: 'USD',
    perCall: {
      execution_pre_trade_gate: 1,
      hft_risk_api: 0.5,
      validation_token_safety_scan: 5,
      validation_token_compare: 8,
      validation_onchain_trace: 10,
      counterparty_risk_score: 3,
      portfolio_risk_dashboard: 25,
      portfolio_batch_scan: 50,
      policy_pack: 15,
      liquidity_shock_detector: 4,
      ai_content_risk_scanner: 2,
      alpha_feed_api: 25,
      report_generator: 10,
      creator_credit_score: 5
    },
    subscriptions: {
      monitoring_watch_daily: { price: 79, period: 'monthly', features: ['50 tokens', 'Alerts', 'Auto-renew'] },
      anomaly_alert_realtime: { price: 49, period: 'monthly', note: 'Add-on' },
      report_generator_enterprise: { price: 299, period: 'monthly', features: ['Unlimited', 'White-label'] },
      creator_credit_score_bulk: { price: 199, period: 'monthly', queries: 100 }
    },
    tiers: {
      free: { price: 0, limit: '10 requests/day' },
      standard: { price: 'pay_per_use', limit: '1000 requests/hour' },
      pro: { price: 99, period: 'monthly', stake: '500 BLNK', limit: '10000 requests/hour' }
    }
  });
});

// GET /api/v1/catalog/search - API 검색
router.get('/search', (req, res) => {
  const { q, category, maxPrice, latency } = req.query;
  
  // 모든 API 목록 (간략화)
  const allApis = [
    { id: 'execution_pre_trade_gate', name: 'Pre-Trade Gate', category: 'execution', price: 1, latency: '2-30s' },
    { id: 'hft_risk_api', name: 'HFT Risk API', category: 'execution', price: 0.5, latency: '<10ms' },
    { id: 'validation_token_safety_scan', name: 'Token Safety Scan', category: 'validation', price: 5, latency: '5-15s' },
    { id: 'ai_content_risk_scanner', name: 'AI Content Scanner', category: 'ai_content', price: 2, latency: '100-500ms' },
    { id: 'alpha_feed_api', name: 'Alpha Feed', category: 'alpha', price: 25, latency: '1-3m' }
  ];
  
  let results = allApis;
  
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(api => 
      api.name.toLowerCase().includes(query) || 
      api.category.toLowerCase().includes(query)
    );
  }
  
  if (category) {
    results = results.filter(api => api.category === category);
  }
  
  if (maxPrice) {
    results = results.filter(api => api.price <= parseFloat(maxPrice));
  }
  
  res.json({
    query: { q, category, maxPrice, latency },
    totalResults: results.length,
    results
  });
});

// GET /api/v1/catalog/examples - 사용 예시
router.get('/examples', (req, res) => {
  res.json({
    examples: [
      {
        title: 'Basic Token Safety Check',
        description: 'Check if a token is safe before trading',
        request: {
          method: 'POST',
          endpoint: '/api/v1/validation/token-safety',
          headers: { 'X-API-Key': 'your_api_key', 'Content-Type': 'application/json' },
          body: { contractAddress: '0x1234567890123456789012345678901234567890' }
        },
        response: {
          riskLevel: 'LOW',
          riskScore: 15,
          checks: { minting: 'safe', ownership: 'renounced' }
        }
      },
      {
        title: 'AI Content Verification',
        description: 'Verify if an NFT image is AI-generated',
        request: {
          method: 'POST',
          endpoint: '/api/v1/ai-content/scan',
          body: { contentUrl: 'https://example.com/nft.jpg', contentType: 'image' }
        },
        response: {
          aiGenerated: false,
          deepfakeProbability: 0.05,
          c2paVerified: true
        }
      },
      {
        title: 'Portfolio Risk Assessment',
        description: 'Get comprehensive risk dashboard for a wallet',
        request: {
          method: 'POST',
          endpoint: '/api/v1/portfolio/dashboard',
          body: { walletAddress: '0x1234...', chains: ['ethereum', 'base'] }
        }
      }
    ]
  });
});

// GET /api/v1/catalog/health - 카탈로그 서비스 상태
router.get('/health', (req, res) => {
  res.json({
    service: 'BLNK API Catalog',
    status: 'healthy',
    version: '1.0.0',
    totalApis: 19,
    totalCategories: 8,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;