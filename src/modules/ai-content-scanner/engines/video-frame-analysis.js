/**
 * Video Frame Analysis Engine
 * 
 * 비디오 프레임 단위 분석 엔진
 * 1fps 샘플링, 시계적 일관성 분석, 배경/조명 불일치 탐지
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

class VideoFrameAnalysisEngine {
  constructor(options = {}) {
    this.options = {
      sampleRate: 1,              // fps (1프레임/초)
      maxDuration: 300,           // 최대 분석 시간 (초)
      maxFrames: 300,             // 최대 분석 프레임 수
      tempDir: os.tmpdir(),
      resolution: { width: 640, height: 480 },
      ...options
    };

    this.stats = {
      totalVideos: 0,
      totalFrames: 0,
      errors: 0
    };
  }

  /**
   * 비디오 분석 실행
   * @param {Buffer|string} videoInput - 비디오 버퍼 또는 파일 경로
   * @param {Object} metadata - 비디오 메타데이터
   * @returns {Promise<Object>} 분석 결과
   */
  async analyze(videoInput, metadata = {}) {
    const startTime = Date.now();
    this.stats.totalVideos++;

    const tempDir = path.join(this.options.tempDir, `video_analysis_${Date.now()}`);
    
    try {
      // 임시 디렉토리 생성
      await fs.mkdir(tempDir, { recursive: true });

      // 비디오 파일 저장 (버퍼인 경우)
      const videoPath = Buffer.isBuffer(videoInput)
        ? path.join(tempDir, 'input.mp4')
        : videoInput;

      if (Buffer.isBuffer(videoInput)) {
        await fs.writeFile(videoPath, videoInput);
      }

      // 1. 비디오 메타데이터 추출
      const videoInfo = await this._extractVideoInfo(videoPath);

      // 2. 프레임 샘플링
      const frames = await this._sampleFrames(videoPath, tempDir, videoInfo);

      // 3. 프레임 분석
      const frameAnalysis = await this._analyzeFrames(frames);

      // 4. 시계적 일관성 분석
      const temporalAnalysis = this._analyzeTemporalConsistency(frameAnalysis);

      // 5. 배경/조명 분석
      const sceneAnalysis = await this._analyzeSceneConsistency(frames, frameAnalysis);

      // 6. 종합 결과 생성
      const result = this._generateResult({
        videoInfo,
        frameAnalysis,
        temporalAnalysis,
        sceneAnalysis,
        startTime
      });

      this.stats.totalFrames += frames.length;

      return result;

    } catch (error) {
      this.stats.errors++;
      return {
        error: true,
        errorMessage: error.message,
        latencyMs: Date.now() - startTime
      };
    } finally {
      // 임시 파일 정리
      await this._cleanup(tempDir);
    }
  }

  /**
   * 비디오 정보 추출
   * @private
   */
  async _extractVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          duration: parseFloat(metadata.format.duration) || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          fps: this._parseFps(videoStream?.r_frame_rate),
          codec: videoStream?.codec_name,
          bitrate: parseInt(metadata.format.bit_rate) || 0,
          hasAudio: !!audioStream,
          audioCodec: audioStream?.codec_name,
          format: metadata.format.format_name
        });
      });
    });
  }

  /**
   * FPS 파싱
   * @private
   */
  _parseFps(fpsString) {
    if (!fpsString) return 30;
    const [num, den] = fpsString.split('/').map(Number);
    return den ? num / den : num;
  }

  /**
   * 프레임 샘플링
   * @private
   */
  async _sampleFrames(videoPath, tempDir, videoInfo) {
    const duration = Math.min(videoInfo.duration, this.options.maxDuration);
    const frameCount = Math.min(
      Math.floor(duration * this.options.sampleRate),
      this.options.maxFrames
    );

    const framePaths = [];
    const interval = duration / frameCount;

    // ffmpeg로 프레임 추출
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .fps(this.options.sampleRate)
        .size(`${this.options.resolution.width}x${this.options.resolution.height}`)
        .output(path.join(tempDir, 'frame_%04d.jpg'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // 추출된 프레임 파일 목록
    const files = await fs.readdir(tempDir);
    const frameFiles = files
      .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()
      .slice(0, frameCount);

    for (let i = 0; i < frameFiles.length; i++) {
      const filePath = path.join(tempDir, frameFiles[i]);
      const timestamp = i * interval;
      
      framePaths.push({
        path: filePath,
        index: i,
        timestamp,
        timestampFormatted: this._formatTimestamp(timestamp)
      });
    }

    return framePaths;
  }

  /**
   * 타임스탬프 포맷팅
   * @private
   */
  _formatTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 프레임 분석
   * @private
   */
  async _analyzeFrames(frames) {
    const results = [];

    for (const frame of frames) {
      try {
        const buffer = await fs.readFile(frame.path);
        
        // 이미지 특징 분석
        const features = await this._extractFrameFeatures(buffer);
        
        // 품질 메트릭
        const quality = await this._analyzeFrameQuality(buffer);

        results.push({
          index: frame.index,
          timestamp: frame.timestamp,
          timestampFormatted: frame.timestampFormatted,
          features,
          quality
        });

      } catch (error) {
        results.push({
          index: frame.index,
          timestamp: frame.timestamp,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 프레임 특징 추출
   * @private
   */
  async _extractFrameFeatures(buffer) {
    // sharp를 사용한 이미지 분석
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();

    // 히스토그램 계산
    const histogram = await this._calculateHistogram(buffer);

    // 에지 밀도
    const edgeDensity = await this._calculateEdgeDensity(buffer);

    // 색상 분포
    const colorDistribution = await this._analyzeColorDistribution(buffer);

    return {
      width: metadata.width,
      height: metadata.height,
      brightness: stats.mean,
      contrast: stats.std,
      histogram,
      edgeDensity,
      colorDistribution,
      dominantColors: colorDistribution.slice(0, 5)
    };
  }

  /**
   * 히스토그램 계산
   * @private
   */
  async _calculateHistogram(buffer) {
    const { data, info } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const histogram = new Array(256).fill(0);
    
    // 그레이스케일 변환 및 히스토그램 계산
    for (let i = 0; i < data.length; i += info.channels) {
      const gray = Math.round(
        0.299 * data[i] + 
        0.587 * data[i + 1] + 
        0.114 * data[i + 2]
      );
      histogram[gray]++;
    }

    return histogram;
  }

  /**
   * 에지 밀도 계산
   * @private
   */
  async _calculateEdgeDensity(buffer) {
    // 간단한 에지 검출 (라플라시안)
    const { data, info } = await sharp(buffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let edgePixels = 0;
    const threshold = 30;

    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = y * info.width + x;
        
        // 라플라시안 근사
        const center = data[idx];
        const laplacian = 
          Math.abs(4 * center - 
                   data[idx - 1] - 
                   data[idx + 1] - 
                   data[idx - info.width] - 
                   data[idx + info.width]);

        if (laplacian > threshold) {
          edgePixels++;
        }
      }
    }

    return edgePixels / (info.width * info.height);
  }

  /**
   * 색상 분포 분석
   * @private
   */
  async _analyzeColorDistribution(buffer) {
    const { data, info } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 색상 양자화 (64개 색상)
    const colorMap = new Map();

    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.floor(data[i] / 64);
      const g = Math.floor(data[i + 1] / 64);
      const b = Math.floor(data[i + 2] / 64);
      const colorKey = `${r},${g},${b}`;
      
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    // 상위 색상 추출
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => ({
        color: color.split(',').map(c => parseInt(c) * 64),
        frequency: count / (data.length / info.channels)
      }));

    return sortedColors;
  }

  /**
   * 프레임 품질 분석
   * @private
   */
  async _analyzeFrameQuality(buffer) {
    const { data, info } = await sharp(buffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 블러 검출 (라플라시안 분산)
    let laplacianSum = 0;
    let laplacianSumSq = 0;
    let count = 0;

    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = y * info.width + x;
        const center = data[idx];
        const laplacian = Math.abs(
          4 * center - 
          data[idx - 1] - 
          data[idx + 1] - 
          data[idx - info.width] - 
          data[idx + info.width]
        );
        
        laplacianSum += laplacian;
        laplacianSumSq += laplacian * laplacian;
        count++;
      }
    }

    const mean = laplacianSum / count;
    const variance = (laplacianSumSq / count) - (mean * mean);

    // 압축 아티팩트 검출 (DCT 계수 분석)
    const compressionArtifacts = await this._detectCompressionArtifacts(buffer);

    return {
      blurScore: Math.min(variance / 500, 1.0), // 높을수록 선명
      compressionArtifacts,
      noiseLevel: this._estimateNoiseLevel(data, info),
      overall: this._calculateQualityScore(variance, compressionArtifacts)
    };
  }

  /**
   * 압축 아티팩트 검출
   * @private
   */
  async _detectCompressionArtifacts(buffer) {
    // 블록 경계 검출
    const { data, info } = await sharp(buffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let blockArtifacts = 0;
    const blockSize = 8;

    for (let y = 0; y < info.height - blockSize; y += blockSize) {
      for (let x = 0; x < info.width - blockSize; x += blockSize) {
        // 블록 경계에서의 불연속성 검사
        const rightEdge = Math.abs(
          data[y * info.width + x + blockSize - 1] - 
          data[y * info.width + x + blockSize]
        );
        const bottomEdge = Math.abs(
          data[(y + blockSize - 1) * info.width + x] - 
          data[(y + blockSize) * info.width + x]
        );

        if (rightEdge > 20 || bottomEdge > 20) {
          blockArtifacts++;
        }
      }
    }

    const totalBlocks = (info.height / blockSize) * (info.width / blockSize);
    return blockArtifacts / totalBlocks;
  }

  /**
   * 노이즈 레벨 추정
   * @private
   */
  _estimateNoiseLevel(data, info) {
    // 간단한 노이즈 추정 (고주파 성분)
    let highFreqEnergy = 0;
    
    for (let i = 1; i < data.length - 1; i++) {
      highFreqEnergy += Math.abs(data[i] - data[i - 1]);
    }

    return Math.min(highFreqEnergy / data.length / 255, 1.0);
  }

  /**
   * 품질 점수 계산
   * @private
   */
  _calculateQualityScore(variance, artifacts) {
    const sharpnessScore = Math.min(variance / 1000, 1.0);
    const artifactScore = Math.max(0, 1 - artifacts * 10);
    
    return (sharpnessScore * 0.6 + artifactScore * 0.4);
  }

  /**
   * 시계적 일관성 분석
   * @private
   */
  _analyzeTemporalConsistency(frameAnalysis) {
    const validFrames = frameAnalysis.filter(f => !f.error);
    
    if (validFrames.length < 2) {
      return { insufficient: true };
    }

    const indicators = [];

    // 1. 밝기 변화 분석
    const brightnessValues = validFrames.map(f => f.features.brightness);
    const brightnessVariance = this._calculateVariance(brightnessValues);
    
    if (brightnessVariance > 1000) {
      indicators.push({
        type: 'brightness_flicker',
        severity: 'medium',
        confidence: Math.min(brightnessVariance / 5000, 1.0),
        variance: brightnessVariance
      });
    }

    // 2. 색상 변화 분석
    const colorChanges = this._analyzeColorChanges(validFrames);
    if (colorChanges.isAbrupt) {
      indicators.push({
        type: 'abrupt_color_change',
        severity: 'high',
        confidence: colorChanges.confidence,
        changePoints: colorChanges.changePoints
      });
    }

    // 3. 에지 밀도 변화
    const edgeDensityValues = validFrames.map(f => f.features.edgeDensity);
    const edgeVariance = this._calculateVariance(edgeDensityValues);
    
    if (edgeVariance > 0.001) {
      indicators.push({
        type: 'edge_inconsistency',
        severity: 'medium',
        confidence: Math.min(edgeVariance * 100, 1.0)
      });
    }

    // 4. 품질 변화 분석
    const qualityChanges = this._analyzeQualityChanges(validFrames);
    if (qualityChanges.hasChange) {
      indicators.push({
        type: 'quality_inconsistency',
        severity: 'medium',
        confidence: qualityChanges.confidence
      });
    }

    return {
      indicators,
      brightnessVariance,
      edgeVariance,
      frameCount: validFrames.length
    };
  }

  /**
   * 색상 변화 분석
   * @private
   */
  _analyzeColorChanges(frames) {
    const dominantColors = frames.map(f => 
      f.features.dominantColors[0]?.color || [0, 0, 0]
    );

    const changes = [];
    let totalChange = 0;

    for (let i = 1; i < dominantColors.length; i++) {
      const prev = dominantColors[i - 1];
      const curr = dominantColors[i];
      
      const distance = Math.sqrt(
        Math.pow(prev[0] - curr[0], 2) +
        Math.pow(prev[1] - curr[1], 2) +
        Math.pow(prev[2] - curr[2], 2)
      );

      if (distance > 100) {
        changes.push(i);
      }
      totalChange += distance;
    }

    const avgChange = totalChange / (dominantColors.length - 1);

    return {
      isAbrupt: changes.length > frames.length * 0.1,
      confidence: Math.min(changes.length / frames.length * 5, 1.0),
      changePoints: changes,
      averageChange: avgChange
    };
  }

  /**
   * 품질 변화 분석
   * @private
   */
  _analyzeQualityChanges(frames) {
    const qualityScores = frames.map(f => f.quality.overall);
    
    const variance = this._calculateVariance(qualityScores);
    const hasSignificantDrop = qualityScores.some((score, i) => 
      i > 0 && score < qualityScores[i - 1] * 0.7
    );

    return {
      hasChange: variance > 0.05 || hasSignificantDrop,
      confidence: Math.min(variance * 10, 1.0),
      variance
    };
  }

  /**
   * 분산 계산
   * @private
   */
  _calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 장면 일관성 분석
   * @private
   */
  async _analyzeSceneConsistency(frames, frameAnalysis) {
    const validFrames = frameAnalysis.filter(f => !f.error);
    
    if (validFrames.length < 2) {
      return { insufficient: true };
    }

    const indicators = [];

    // 1. 배경 변화 감지
    const backgroundChanges = await this._detectBackgroundChanges(frames, validFrames);
    if (backgroundChanges.hasChange) {
      indicators.push({
        type: 'background_change',
        severity: 'high',
        confidence: backgroundChanges.confidence,
        description: 'Significant background changes detected'
      });
    }

    // 2. 조명 방향 일관성
    const lightingConsistency = this._analyzeLightingConsistency(validFrames);
    if (!lightingConsistency.isConsistent) {
      indicators.push({
        type: 'lighting_inconsistency',
        severity: 'high',
        confidence: lightingConsistency.confidence
      });
    }

    // 3. 카메라 움직임 분석
    const cameraMovement = this._analyzeCameraMovement(validFrames);
    if (cameraMovement.isUnnatural) {
      indicators.push({
        type: 'unnatural_camera_movement',
        severity: 'medium',
        confidence: cameraMovement.confidence
      });
    }

    return {
      indicators,
      backgroundChanges,
      lightingConsistency,
      cameraMovement
    };
  }

  /**
   * 배경 변화 감지
   * @private
   */
  async _detectBackgroundChanges(frames, frameAnalysis) {
    // 간단한 배경 변화 감지 (히스토그램 비교)
    const histograms = frameAnalysis.map(f => f.features.histogram);
    
    const changes = [];
    
    for (let i = 1; i < histograms.length; i++) {
      const similarity = this._calculateHistogramSimilarity(
        histograms[i - 1], 
        histograms[i]
      );
      
      if (similarity < 0.7) {
        changes.push(i);
      }
    }

    return {
      hasChange: changes.length > histograms.length * 0.2,
      confidence: Math.min(changes.length / histograms.length * 3, 1.0),
      changeCount: changes.length
    };
  }

  /**
   * 히스토그램 유사도 계산
   * @private
   */
  _calculateHistogramSimilarity(hist1, hist2) {
    // 코사인 유사도
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < hist1.length; i++) {
      dotProduct += hist1[i] * hist2[i];
      norm1 += hist1[i] * hist1[i];
      norm2 += hist2[i] * hist2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) + 1e-10);
  }

  /**
   * 조명 일관성 분석
   * @private
   */
  _analyzeLightingConsistency(frames) {
    const brightnessValues = frames.map(f => f.features.brightness);
    const contrastValues = frames.map(f => f.features.contrast);

    const brightnessVariance = this._calculateVariance(brightnessValues);
    const contrastVariance = this._calculateVariance(contrastValues);

    const isConsistent = brightnessVariance < 500 && contrastVariance < 200;

    return {
      isConsistent,
      confidence: isConsistent ? 0.3 : Math.min(
        (brightnessVariance / 2000 + contrastVariance / 1000) / 2, 
        1.0
      ),
      brightnessVariance,
      contrastVariance
    };
  }

  /**
   * 카메라 움직임 분석
   * @private
   */
  _analyzeCameraMovement(frames) {
    // 프레임 간 특징점 변화 분석
    const edgeDensities = frames.map(f => f.features.edgeDensity);
    
    const variations = [];
    for (let i = 1; i < edgeDensities.length; i++) {
      variations.push(Math.abs(edgeDensities[i] - edgeDensities[i - 1]));
    }

    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    const maxVariation = Math.max(...variations);

    // 비정상적으로 큰 변화가 있는지 확인
    const isUnnatural = maxVariation > avgVariation * 5;

    return {
      isUnnatural,
      confidence: isUnnatural ? Math.min(maxVariation / avgVariation / 10, 1.0) : 0.3,
      averageVariation: avgVariation,
      maxVariation
    };
  }

  /**
   * 종합 결과 생성
   * @private
   */
  _generateResult({ videoInfo, frameAnalysis, temporalAnalysis, sceneAnalysis, startTime }) {
    const allIndicators = [
      ...(temporalAnalysis.indicators || []),
      ...(sceneAnalysis.indicators || [])
    ];

    // 조작 가능성 점수 계산
    let manipulationScore = 0;
    
    allIndicators.forEach(indicator => {
      const severityWeight = {
        low: 0.1,
        medium: 0.2,
        high: 0.35
      }[indicator.severity] || 0.1;

      manipulationScore += severityWeight * indicator.confidence;
    });

    manipulationScore = Math.min(manipulationScore, 1.0);

    return {
      isSuspicious: manipulationScore >= 0.5,
      confidence: manipulationScore,
      videoInfo: {
        duration: videoInfo.duration,
        resolution: `${videoInfo.width}x${videoInfo.height}`,
        fps: videoInfo.fps,
        codec: videoInfo.codec
      },
      analysisSummary: {
        framesAnalyzed: frameAnalysis.filter(f => !f.error).length,
        temporalIndicators: temporalAnalysis.indicators?.length || 0,
        sceneIndicators: sceneAnalysis.indicators?.length || 0
      },
      indicators: allIndicators.slice(0, 10),
      details: {
        temporalAnalysis,
        sceneAnalysis,
        manipulationScore
      },
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * 임시 파일 정리
   * @private
   */
  async _cleanup(tempDir) {
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(tempDir, file)))
      );
      await fs.rmdir(tempDir);
    } catch (error) {
      // 정리 실패는 무시
    }
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      averageFramesPerVideo: this.stats.totalVideos > 0
        ? (this.stats.totalFrames / this.stats.totalVideos).toFixed(2)
        : 0
    };
  }
}

module.exports = { VideoFrameAnalysisEngine };
