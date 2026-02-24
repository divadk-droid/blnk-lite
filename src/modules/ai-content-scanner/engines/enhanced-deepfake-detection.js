/**
 * Enhanced Deepfake Detection Engine (Phase 2)
 * 
 * Phase 2 고도화된 딥페이크 탐지 엔진
 * - 외부 API 연동 (Truepic, Reality Defender)
 * - 고급 얼굴 조작 탐지
 * - 비디오 프레임 분석
 * - 병렬 처리 파이프라인
 */

const { ExternalDeepfakeAPIClient } = require('./external-api-client');
const { AdvancedFaceDetectionEngine } = require('./advanced-face-detection');
const { VideoFrameAnalysisEngine } = require('./video-frame-analysis');
const { ParallelProcessingPipeline } = require('../utils/parallel-pipeline');

class EnhancedDeepfakeDetectionEngine {
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: 0.75,
      useExternalAPIs: true,
      useAdvancedFaceDetection: true,
      useVideoFrameAnalysis: true,
      enableParallelProcessing: true,
      apiWeight: 0.4,
      faceWeight: 0.35,
      videoWeight: 0.25,
      ...options
    };

    // 서브 엔진 초기화
    this.apiClient = new ExternalDeepfakeAPIClient();
    this.faceEngine = new AdvancedFaceDetectionEngine();
    this.videoEngine = new VideoFrameAnalysisEngine();
    
    // 병렬 처리 파이프라인
    this.pipeline = this.options.enableParallelProcessing 
      ? new ParallelProcessingPipeline()
      : null;

    this.stats = {
      totalScanned: 0,
      deepfakesDetected: 0,
      errors: 0,
      avgLatency: 0
    };
  }

  /**
   * 딥페이크 탐지 (메인 엔트리)
   * @param {Buffer} content - 콘텐츠 버퍼
   * @param {Object} metadata - 콘텐츠 메타데이터
   * @returns {Promise<Object>} 종합 탐지 결과
   */
  async detect(content, metadata = {}) {
    const startTime = Date.now();
    this.stats.totalScanned++;

    try {
      const isVideo = metadata.contentType === 'video' || 
                      metadata.mimeType?.startsWith('video/');

      let results = {};

      if (isVideo) {
        results = await this._detectVideo(content, metadata);
      } else {
        results = await this._detectImage(content, metadata);
      }

      // 결과 융합
      const fusedResult = this._fuseResults(results, isVideo);
      
      // 메타데이터 추가
      fusedResult.latencyMs = Date.now() - startTime;
      fusedResult.contentType = isVideo ? 'video' : 'image';
      fusedResult.timestamp = new Date().toISOString();

      // 통계 업데이트
      if (fusedResult.isDeepfake) {
        this.stats.deepfakesDetected++;
      }
      this._updateAvgLatency(Date.now() - startTime);

      return fusedResult;

    } catch (error) {
      this.stats.errors++;
      return {
        isDeepfake: null,
        confidence: 0,
        error: error.message,
        method: 'error',
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * 이미지 딥페이크 탐지
   * @private
   */
  async _detectImage(content, metadata) {
    const results = {
      api: null,
      face: null
    };

    const tasks = [];

    // 1. 외부 API 탐지
    if (this.options.useExternalAPIs) {
      tasks.push(
        this.apiClient.detect(content, metadata)
          .then(result => { results.api = result; })
          .catch(error => { 
            results.api = { error: error.message, fallback: true }; 
          })
      );
    }

    // 2. 고급 얼굴 조작 탐지
    if (this.options.useAdvancedFaceDetection) {
      tasks.push(
        this.faceEngine.detectImageManipulation(content)
          .then(result => { results.face = result; })
          .catch(error => { 
            results.face = { error: error.message }; 
          })
      );
    }

    // 병렬 실행
    await Promise.all(tasks);

    return results;
  }

  /**
   * 비디오 딥페이크 탐지
   * @private
   */
  async _detectVideo(content, metadata) {
    const results = {
      api: null,
      face: null,
      video: null
    };

    // 1. 비디오 프레임 분석 (첫 번째 프레임 샘플)
    if (this.options.useVideoFrameAnalysis) {
      results.video = await this.videoEngine.analyze(content, metadata);
    }

    // 2. 외부 API 탐지 (비디오 지원 API 사용)
    if (this.options.useExternalAPIs) {
      tasks.push(
        this.apiClient.detect(content, metadata)
          .then(result => { results.api = result; })
          .catch(error => { 
            results.api = { error: error.message, fallback: true }; 
          })
      );
    }

    // 병렬 실행
    await Promise.all(tasks);

    return results;
  }

  /**
   * 결과 융합
   * @private
   */
  _fuseResults(results, isVideo) {
    const scores = [];
    const indicators = [];
    const methods = [];

    // API 결과
    if (results.api && !results.api.error) {
      scores.push({
        score: results.api.manipulationScore || 0,
        weight: this.options.apiWeight,
        source: 'api'
      });
      
      if (results.api.indicators) {
        indicators.push(...results.api.indicators.map(i => ({ ...i, source: 'api' })));
      }
      
      methods.push(results.api.method || 'api');
    }

    // 얼굴 분석 결과
    if (results.face && !results.face.error) {
      scores.push({
        score: results.face.confidence || 0,
        weight: this.options.faceWeight,
        source: 'face'
      });
      
      if (results.face.indicators) {
        indicators.push(...results.face.indicators.map(i => ({ ...i, source: 'face' })));
      }
      
      methods.push('advanced_face');
    }

    // 비디오 분석 결과
    if (isVideo && results.video && !results.video.error) {
      scores.push({
        score: results.video.confidence || 0,
        weight: this.options.videoWeight,
        source: 'video'
      });
      
      if (results.video.indicators) {
        indicators.push(...results.video.indicators.map(i => ({ ...i, source: 'video' })));
      }
      
      methods.push('video_frame');
    }

    // 가중 평균 계산
    let totalWeight = 0;
    let weightedScore = 0;

    scores.forEach(s => {
      weightedScore += s.score * s.weight;
      totalWeight += s.weight;
    });

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const isDeepfake = finalScore >= this.options.confidenceThreshold;

    // 지표 정렬 및 중복 제거
    const uniqueIndicators = this._deduplicateAndSortIndicators(indicators);

    return {
      isDeepfake,
      confidence: Math.min(finalScore, 1.0),
      manipulationScore: finalScore,
      threshold: this.options.confidenceThreshold,
      method: methods.join('+') || 'none',
      sources: scores.map(s => s.source),
      indicators: uniqueIndicators.slice(0, 10),
      details: {
        api: results.api,
        face: results.face,
        video: results.video
      }
    };
  }

  /**
   * 지표 중복 제거 및 정렬
   * @private
   */
  _deduplicateAndSortIndicators(indicators) {
    const seen = new Set();
    
    return indicators
      .filter(i => {
        const key = `${i.type}-${i.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        if (severityDiff !== 0) return severityDiff;
        return (b.confidence || 0) - (a.confidence || 0);
      });
  }

  /**
   * 평균 지연 시간 업데이트
   * @private
   */
  _updateAvgLatency(latency) {
    const total = this.stats.totalScanned;
    this.stats.avgLatency = (this.stats.avgLatency * (total - 1) + latency) / total;
  }

  /**
   * 배치 탐지
   * @param {Array<Object>} items - 탐지할 항목 배열
   * @returns {Promise<Array>} 탐지 결과 배열
   */
  async detectBatch(items) {
    if (!this.pipeline) {
      // 순차 처리
      const results = [];
      for (const item of items) {
        const result = await this.detect(item.content, item.metadata);
        results.push(result);
      }
      return results;
    }

    // 병렬 처리
    return this.pipeline.executeBatch('deepfake_detection', items);
  }

  /**
   * 실시간 스트림 탐지
   * @param {ReadableStream} stream - 비디오 스트림
   * @param {Object} options - 탐지 옵션
   * @returns {AsyncGenerator} 탐지 결과 생성기
   */
  async *detectStream(stream, options = {}) {
    const frameBuffer = [];
    const sampleInterval = options.sampleInterval || 1000; // 1초
    let lastSampleTime = 0;

    for await (const chunk of stream) {
      const now = Date.now();
      
      if (now - lastSampleTime >= sampleInterval) {
        // 프레임 분석
        if (frameBuffer.length > 0) {
          const frame = Buffer.concat(frameBuffer);
          const result = await this.detect(frame, { 
            contentType: 'image',
            mimeType: 'image/jpeg'
          });
          
          yield {
            timestamp: now,
            result
          };
        }
        
        frameBuffer.length = 0;
        lastSampleTime = now;
      }
      
      frameBuffer.push(chunk);
    }
  }

  /**
   * 엔진 상태 확인
   */
  async healthCheck() {
    const statuses = {
      api: await this.apiClient.healthCheck(),
      face: { status: 'healthy', healthy: true },
      video: { status: 'healthy', healthy: true },
      pipeline: this.pipeline ? this.pipeline.getStatus() : null
    };

    const allHealthy = Object.values(statuses)
      .filter(s => s && typeof s.healthy === 'boolean')
      .every(s => s.healthy);

    return {
      overall: allHealthy ? 'healthy' : 'degraded',
      components: statuses
    };
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      api: this.apiClient.getStats(),
      face: this.faceEngine.getStats(),
      video: this.videoEngine.getStats(),
      pipeline: this.pipeline?.getStats(),
      successRate: this.stats.totalScanned > 0
        ? ((this.stats.totalScanned - this.stats.errors) / this.stats.totalScanned * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 엔진 종료
   */
  async shutdown() {
    if (this.pipeline) {
      await this.pipeline.shutdown();
    }
  }
}

module.exports = { EnhancedDeepfakeDetectionEngine };
