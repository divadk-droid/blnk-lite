/**
 * Parallel Processing Pipeline
 * 
 * 병렬 처리 및 캐싱을 위한 고성능 파이프라인
 */

const { Worker } = require('worker_threads');
const os = require('os');
const crypto = require('crypto');
const EventEmitter = require('events');

class ParallelProcessingPipeline extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxWorkers: options.maxWorkers || os.cpus().length,
      taskTimeout: options.taskTimeout || 30000,
      cacheEnabled: options.cacheEnabled !== false,
      cacheTTL: options.cacheTTL || 300000, // 5분
      batchSize: options.batchSize || 10,
      ...options
    };

    this.workers = new Map();
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.cache = new Map();
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLatency: 0
    };

    this._initializeWorkers();
  }

  /**
   * 워커 초기화
   * @private
   */
  _initializeWorkers() {
    for (let i = 0; i < this.options.maxWorkers; i++) {
      this._createWorker(i);
    }
  }

  /**
   * 개별 워커 생성
   * @private
   */
  _createWorker(id) {
    // 인라인 워커 코드
    const workerCode = `
      const { parentPort } = require('worker_threads');
      
      parentPort.on('message', async (task) => {
        try {
          const result = await processTask(task);
          parentPort.postMessage({ success: true, result, taskId: task.id });
        } catch (error) {
          parentPort.postMessage({ 
            success: false, 
            error: error.message, 
            taskId: task.id 
          });
        }
      });

      async function processTask(task) {
        const { type, data, options } = task;
        
        switch (type) {
          case 'deepfake_api':
            return await processDeepfakeAPI(data, options);
          case 'face_analysis':
            return await processFaceAnalysis(data, options);
          case 'frame_analysis':
            return await processFrameAnalysis(data, options);
          case 'image_preprocessing':
            return await processImagePreprocessing(data, options);
          default:
            throw new Error('Unknown task type: ' + type);
        }
      }

      async function processDeepfakeAPI(data, options) {
        // API 클라이언트 로직 (메인 스레드에서 처리)
        return { type: 'deepfake_api', processed: true };
      }

      async function processFaceAnalysis(data, options) {
        // 얼굴 분석 로직
        return { type: 'face_analysis', processed: true };
      }

      async function processFrameAnalysis(data, options) {
        // 프레임 분석 로직
        return { type: 'frame_analysis', processed: true };
      }

      async function processImagePreprocessing(data, options) {
        // 이미지 전처리 로직
        return { type: 'image_preprocessing', processed: true };
      }
    `;

    const worker = new Worker(workerCode, { eval: true });
    
    worker.on('message', (message) => {
      this._handleWorkerMessage(id, message);
    });

    worker.on('error', (error) => {
      this.emit('workerError', { workerId: id, error });
      this._recreateWorker(id);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this._recreateWorker(id);
      }
    });

    this.workers.set(id, {
      worker,
      busy: false,
      currentTask: null
    });
  }

  /**
   * 워커 재생성
   * @private
   */
  _recreateWorker(id) {
    const existing = this.workers.get(id);
    if (existing) {
      existing.worker.terminate().catch(() => {});
    }
    this._createWorker(id);
  }

  /**
   * 워커 메시지 처리
   * @private
   */
  _handleWorkerMessage(workerId, message) {
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.busy = false;
      workerInfo.currentTask = null;
    }

    const { taskId, success, result, error } = message;
    const taskInfo = this.activeTasks.get(taskId);

    if (taskInfo) {
      this.activeTasks.delete(taskId);

      if (success) {
        taskInfo.resolve(result);
        this.stats.completedTasks++;
        
        // 캐시 저장
        if (this.options.cacheEnabled && taskInfo.cacheKey) {
          this._cacheResult(taskInfo.cacheKey, result);
        }
      } else {
        taskInfo.reject(new Error(error));
        this.stats.failedTasks++;
      }

      // 지연 시간 업데이트
      const latency = Date.now() - taskInfo.startTime;
      this._updateAvgLatency(latency);

      // 다음 작업 처리
      this._processQueue();
    }
  }

  /**
   * 평균 지연 시간 업데이트
   * @private
   */
  _updateAvgLatency(latency) {
    const total = this.stats.completedTasks + this.stats.failedTasks;
    this.stats.avgLatency = 
      (this.stats.avgLatency * (total - 1) + latency) / total;
  }

  /**
   * 작업 실행
   * @param {string} type - 작업 유형
   * @param {Object} data - 작업 데이터
   * @param {Object} options - 작업 옵션
   * @returns {Promise<Object>} 작업 결과
   */
  async execute(type, data, options = {}) {
    this.stats.totalTasks++;

    const taskId = crypto.randomUUID();
    const cacheKey = this.options.cacheEnabled 
      ? this._generateCacheKey(type, data)
      : null;

    // 캐시 확인
    if (cacheKey) {
      const cached = this._getCachedResult(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
      this.stats.cacheMisses++;
    }

    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        type,
        data,
        options
      };

      const taskInfo = {
        task,
        resolve,
        reject,
        startTime: Date.now(),
        cacheKey
      };

      // 타임아웃 설정
      if (this.options.taskTimeout > 0) {
        setTimeout(() => {
          if (this.activeTasks.has(taskId)) {
            this.activeTasks.delete(taskId);
            reject(new Error('Task timeout'));
            this.stats.failedTasks++;
            this._processQueue();
          }
        }, this.options.taskTimeout);
      }

      this.taskQueue.push(taskInfo);
      this._processQueue();
    });
  }

  /**
   * 배치 작업 실행
   * @param {string} type - 작업 유형
   * @param {Array<Object>} items - 작업 항목 배열
   * @param {Object} options - 작업 옵션
   * @returns {Promise<Array>} 작업 결과 배열
   */
  async executeBatch(type, items, options = {}) {
    const batchSize = options.batchSize || this.options.batchSize;
    const results = [];

    // 배치 단위로 처리
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(item => 
        this.execute(type, item, options).catch(error => ({
          error: true,
          message: error.message,
          item
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 진행 상황 이벤트
      this.emit('batchProgress', {
        completed: Math.min(i + batchSize, items.length),
        total: items.length,
        percentage: Math.round((Math.min(i + batchSize, items.length) / items.length) * 100)
      });
    }

    return results;
  }

  /**
   * 큐 처리
   * @private
   */
  _processQueue() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this._getAvailableWorker();
      
      if (!availableWorker) break;

      const taskInfo = this.taskQueue.shift();
      this.activeTasks.set(taskInfo.task.id, taskInfo);

      availableWorker.busy = true;
      availableWorker.currentTask = taskInfo.task.id;
      availableWorker.worker.postMessage(taskInfo.task);
    }
  }

  /**
   * 사용 가능한 워커 조회
   * @private
   */
  _getAvailableWorker() {
    for (const workerInfo of this.workers.values()) {
      if (!workerInfo.busy) {
        return workerInfo;
      }
    }
    return null;
  }

  /**
   * 캐시 키 생성
   * @private
   */
  _generateCacheKey(type, data) {
    const hash = crypto.createHash('sha256');
    hash.update(type);
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * 캐시된 결과 조회
   * @private
   */
  _getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.options.cacheTTL) {
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

    // 캐시 크기 관리 (LRU)
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 파이프라인 상태 조회
   */
  getStatus() {
    return {
      workers: {
        total: this.workers.size,
        busy: Array.from(this.workers.values()).filter(w => w.busy).length,
        idle: Array.from(this.workers.values()).filter(w => !w.busy).length
      },
      queue: {
        pending: this.taskQueue.length,
        active: this.activeTasks.size
      },
      cache: {
        size: this.cache.size,
        hitRate: this.stats.totalTasks > 0
          ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      stats: this.stats
    };
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalTasks > 0
        ? (this.stats.completedTasks / this.stats.totalTasks * 100).toFixed(2) + '%'
        : 'N/A',
      avgLatencyMs: Math.round(this.stats.avgLatency)
    };
  }

  /**
   * 파이프라인 종료
   */
  async shutdown() {
    // 대기 중인 작업 취소
    for (const taskInfo of this.taskQueue) {
      taskInfo.reject(new Error('Pipeline shutting down'));
    }
    this.taskQueue = [];

    // 활성 작업 완료 대기
    const activeTaskPromises = Array.from(this.activeTasks.values()).map(taskInfo => 
      new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.activeTasks.has(taskInfo.task.id)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // 최대 5초 대기
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      })
    );

    await Promise.all(activeTaskPromises);

    // 워커 종료
    const terminatePromises = Array.from(this.workers.values()).map(w => 
      w.worker.terminate().catch(() => {})
    );

    await Promise.all(terminatePromises);
    this.workers.clear();
    this.cache.clear();
  }
}

module.exports = { ParallelProcessingPipeline };
