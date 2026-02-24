/**
 * External Deepfake Detection API Client
 * 
 * Truepic, Reality Defender 등 외부 딥페이크 탐지 API 연동
 */

const axios = require('axios');
const crypto = require('crypto');

class ExternalDeepfakeAPIClient {
  constructor(options = {}) {
    this.providers = {
      truepic: {
        enabled: process.env.TRUEPIC_API_KEY ? true : false,
        apiKey: process.env.TRUEPIC_API_KEY,
        baseUrl: process.env.TRUEPIC_API_URL || 'https://api.truepic.com/v2',
        timeout: 30000,
        weight: 0.35
      },
      realityDefender: {
        enabled: process.env.REALITY_DEFENDER_API_KEY ? true : false,
        apiKey: process.env.REALITY_DEFENDER_API_KEY,
        baseUrl: process.env.REALITY_DEFENDER_API_URL || 'https://api.realitydefender.com/v1',
        timeout: 30000,
        weight: 0.35
      },
      sightEngine: {
        enabled: process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET,
        apiUser: process.env.SIGHTENGINE_API_USER,
        apiSecret: process.env.SIGHTENGINE_API_SECRET,
        baseUrl: 'https://api.sightengine.com/1.0',
        timeout: 25000,
        weight: 0.15
      },
      hiveModeration: {
        enabled: process.env.HIVE_API_KEY ? true : false,
        apiKey: process.env.HIVE_API_KEY,
        baseUrl: 'https://api.thehive.ai/api/v2',
        timeout: 25000,
        weight: 0.15
      }
    };

    this.fallbackMode = options.fallbackMode || 'local'; // 'local' | 'conservative' | 'permissive'
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5분
  }

  /**
   * 모든 활성화된 API로 딥페이크 탐지 수행
   * @param {Buffer} content - 콘텐츠 버퍼
   * @param {Object} metadata - 콘텐츠 메타데이터
   * @returns {Promise<Object>} 융합된 탐지 결과
   */
  async detect(content, metadata = {}) {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    // 활성화된 제공자 필터링
    const activeProviders = Object.entries(this.providers)
      .filter(([_, config]) => config.enabled);

    if (activeProviders.length === 0) {
      return this._createFallbackResult('No API providers configured', startTime);
    }

    // 병렬 API 호출
    const apiPromises = activeProviders.map(async ([name, config]) => {
      try {
        const result = await this._callProvider(name, config, content, metadata);
        return { provider: name, ...result };
      } catch (error) {
        errors.push({ provider: name, error: error.message });
        return null;
      }
    });

    const apiResults = await Promise.allSettled(apiPromises);
    
    apiResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    if (results.length === 0) {
      return this._createFallbackResult(
        `All API calls failed: ${errors.map(e => `${e.provider}: ${e.error}`).join(', ')}`,
        startTime
      );
    }

    // 결과 융합
    const fusedResult = this._fuseResults(results, startTime);
    
    // 메타데이터 추가
    fusedResult.providers = results.map(r => r.provider);
    fusedResult.failedProviders = errors.map(e => e.provider);
    fusedResult.latencyMs = Date.now() - startTime;

    return fusedResult;
  }

  /**
   * 개별 제공자 API 호출
   * @private
   */
  async _callProvider(name, config, content, metadata) {
    // 캐시 확인
    if (this.cacheEnabled) {
      const cacheKey = this._generateCacheKey(content, name);
      const cached = this._getCachedResult(cacheKey);
      if (cached) return cached;
    }

    let result;
    switch (name) {
      case 'truepic':
        result = await this._callTruepic(config, content, metadata);
        break;
      case 'realityDefender':
        result = await this._callRealityDefender(config, content, metadata);
        break;
      case 'sightEngine':
        result = await this._callSightEngine(config, content, metadata);
        break;
      case 'hiveModeration':
        result = await this._callHiveModeration(config, content, metadata);
        break;
      default:
        throw new Error(`Unknown provider: ${name}`);
    }

    // 캐시 저장
    if (this.cacheEnabled) {
      const cacheKey = this._generateCacheKey(content, name);
      this._cacheResult(cacheKey, result);
    }

    return result;
  }

  /**
   * Truepic API 호출
   * @private
   */
  async _callTruepic(config, content, metadata) {
    const formData = new FormData();
    const blob = new Blob([content], { type: metadata.mimeType || 'image/jpeg' });
    formData.append('media', blob, metadata.filename || 'image.jpg');

    const response = await axios.post(
      `${config.baseUrl}/detect`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: config.timeout
      }
    );

    const data = response.data;
    
    return {
      isDeepfake: data.manipulation_detected || false,
      confidence: data.confidence_score || 0,
      manipulationScore: data.manipulation_score || 0,
      indicators: this._mapTruepicIndicators(data.indicators || []),
      raw: data
    };
  }

  /**
   * Reality Defender API 호출
   * @private
   */
  async _callRealityDefender(config, content, metadata) {
    const base64Content = content.toString('base64');
    
    const response = await axios.post(
      `${config.baseUrl}/analyze`,
      {
        media: base64Content,
        media_type: metadata.mimeType?.startsWith('video/') ? 'video' : 'image',
        filename: metadata.filename
      },
      {
        headers: {
          'Authorization': `ApiKey ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout
      }
    );

    const data = response.data;

    return {
      isDeepfake: data.is_synthetic || false,
      confidence: data.confidence || 0,
      manipulationScore: data.synthetic_probability || 0,
      indicators: this._mapRealityDefenderIndicators(data.analysis || {}),
      raw: data
    };
  }

  /**
   * Sight Engine API 호출
   * @private
   */
  async _callSightEngine(config, content, metadata) {
    const formData = new FormData();
    const blob = new Blob([content], { type: metadata.mimeType || 'image/jpeg' });
    formData.append('media', blob, metadata.filename || 'image.jpg');
    formData.append('models', 'deepfake');
    formData.append('api_user', config.apiUser);
    formData.append('api_secret', config.apiSecret);

    const response = await axios.post(
      `${config.baseUrl}/check.json`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: config.timeout
      }
    );

    const data = response.data;
    const deepfakeData = data.deepfake || {};

    return {
      isDeepfake: deepfakeData.is_deepfake || false,
      confidence: deepfakeData.confidence || 0,
      manipulationScore: deepfakeData.score || 0,
      indicators: deepfakeData.indicators || [],
      raw: data
    };
  }

  /**
   * Hive Moderation API 호출
   * @private
   */
  async _callHiveModeration(config, content, metadata) {
    const base64Content = content.toString('base64');
    
    const response = await axios.post(
      `${config.baseUrl}/task/sync`,
      {
        image: base64Content,
        model_types: ['deepfake_detection']
      },
      {
        headers: {
          'Authorization': `Token ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout
      }
    );

    const data = response.data;
    const deepfakeResult = data.result?.deepfake_detection || {};

    return {
      isDeepfake: deepfakeResult.is_deepfake || false,
      confidence: deepfakeResult.confidence || 0,
      manipulationScore: deepfakeResult.deepfake_score || 0,
      indicators: deepfakeResult.indicators || [],
      raw: data
    };
  }

  /**
   * 결과 융합 (가중치 적용)
   * @private
   */
  _fuseResults(results, startTime) {
    let totalWeight = 0;
    let weightedScore = 0;
    let maxConfidence = 0;
    const allIndicators = [];

    results.forEach(result => {
      const provider = this.providers[result.provider];
      const weight = provider?.weight || 0.25;
      
      weightedScore += result.manipulationScore * weight;
      totalWeight += weight;
      maxConfidence = Math.max(maxConfidence, result.confidence);
      
      if (result.indicators) {
        allIndicators.push(...result.indicators.map(i => ({
          ...i,
          source: result.provider
        })));
      }
    });

    const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const threshold = 0.75;

    // 지표 중복 제거 및 정렬
    const uniqueIndicators = this._deduplicateIndicators(allIndicators);

    return {
      isDeepfake: normalizedScore >= threshold,
      confidence: maxConfidence,
      manipulationScore: normalizedScore,
      threshold,
      method: 'api_fusion',
      indicators: uniqueIndicators.slice(0, 10),
      providerCount: results.length,
      consensusLevel: this._calculateConsensus(results, normalizedScore)
    };
  }

  /**
   * 합의 수준 계산
   * @private
   */
  _calculateConsensus(results, fusedScore) {
    const agreeingResults = results.filter(r => 
      (fusedScore >= 0.75 && r.manipulationScore >= 0.75) ||
      (fusedScore < 0.75 && r.manipulationScore < 0.75)
    );

    const ratio = agreeingResults.length / results.length;
    
    if (ratio >= 0.8) return 'high';
    if (ratio >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Truepic 지표 매핑
   * @private
   */
  _mapTruepicIndicators(indicators) {
    const mapping = {
      'face_manipulation': { type: 'face_manipulation', severity: 'high' },
      'generative_ai': { type: 'ai_generated', severity: 'medium' },
      'metadata_anomaly': { type: 'metadata_anomaly', severity: 'low' },
      'compression_artifact': { type: 'compression_artifact', severity: 'low' }
    };

    return indicators.map(i => ({
      ...mapping[i.type] || { type: i.type, severity: 'unknown' },
      confidence: i.confidence || 0.5,
      details: i.details
    }));
  }

  /**
   * Reality Defender 지표 매핑
   * @private
   */
  _mapRealityDefenderIndicators(analysis) {
    const indicators = [];
    
    if (analysis.facial_inconsistencies) {
      indicators.push({
        type: 'facial_inconsistency',
        severity: 'high',
        confidence: analysis.facial_inconsistencies.score || 0.5
      });
    }
    
    if (analysis.lighting_anomalies) {
      indicators.push({
        type: 'lighting_anomaly',
        severity: 'medium',
        confidence: analysis.lighting_anomalies.score || 0.5
      });
    }

    return indicators;
  }

  /**
   * 지표 중복 제거
   * @private
   */
  _deduplicateIndicators(indicators) {
    const seen = new Set();
    return indicators.filter(i => {
      const key = `${i.type}-${i.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  /**
   * 폴백 결과 생성
   * @private
   */
  _createFallbackResult(reason, startTime) {
    const fallbackStrategies = {
      local: { isDeepfake: null, confidence: 0, requiresLocalAnalysis: true },
      conservative: { isDeepfake: true, confidence: 0.5, reason: 'API unavailable - conservative block' },
      permissive: { isDeepfake: false, confidence: 0.5, reason: 'API unavailable - permissive allow' }
    };

    const strategy = fallbackStrategies[this.fallbackMode];

    return {
      ...strategy,
      manipulationScore: 0,
      threshold: 0.75,
      method: 'fallback',
      indicators: [{
        type: 'api_unavailable',
        severity: 'info',
        reason
      }],
      providerCount: 0,
      consensusLevel: 'none',
      fallback: true,
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * 캐시 키 생성
   * @private
   */
  _generateCacheKey(content, provider) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${provider}:${hash}`;
  }

  /**
   * 캐시된 결과 조회
   * @private
   */
  _getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 결과 캐싱
   * @private
   */
  _cacheResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 캐시 크기 관리
    if (this.cache.size > 500) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 제공자 상태 확인
   */
  async healthCheck() {
    const statuses = {};

    for (const [name, config] of Object.entries(this.providers)) {
      if (!config.enabled) {
        statuses[name] = { status: 'disabled', healthy: false };
        continue;
      }

      try {
        // 각 제공자별 헬스체크 엔드포인트 호출
        const startTime = Date.now();
        await axios.get(`${config.baseUrl}/health`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` },
          timeout: 5000
        });
        
        statuses[name] = {
          status: 'healthy',
          healthy: true,
          latencyMs: Date.now() - startTime
        };
      } catch (error) {
        statuses[name] = {
          status: 'unhealthy',
          healthy: false,
          error: error.message
        };
      }
    }

    return statuses;
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      providers: Object.entries(this.providers).map(([name, config]) => ({
        name,
        enabled: config.enabled,
        weight: config.weight
      })),
      cacheSize: this.cache.size,
      fallbackMode: this.fallbackMode
    };
  }
}

module.exports = { ExternalDeepfakeAPIClient };
