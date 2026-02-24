/**
 * Advanced Face Manipulation Detection
 * 
 * FaceForensics++ 기반 얼굴 조작 탐지 알고리즘
 * 눈 깜빡임, 얼굴 경계선, 메타데이터 불일치 탐지
 */

const cv = require('opencv4nodejs');
const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');

class AdvancedFaceDetectionEngine {
  constructor(options = {}) {
    this.options = {
      blinkThreshold: 0.2,        // 눈 감김 임계값 (EAR)
      normalBlinkRate: { min: 12, max: 20 }, // 정상 분당 깜빡임 횟수
      boundaryThreshold: 0.15,    // 경계 불안정성 임계값
      temporalWindow: 30,         // 시계적 분석 윈도우 (프레임)
      ...options
    };

    this.faceCascade = new cv.CascadeClassifier(
      cv.HAAR_FRONTALFACE_DEFAULT
    );
    
    this.eyeCascade = new cv.CascadeClassifier(
      cv.HAAR_EYE
    );

    this.stats = {
      totalAnalyzed: 0,
      manipulationsDetected: 0,
      errors: 0
    };
  }

  /**
   * 이미지 얼굴 조작 탐지
   * @param {Buffer} imageBuffer - 이미지 버퍼
   * @returns {Promise<Object>} 탐지 결과
   */
  async detectImageManipulation(imageBuffer) {
    const startTime = Date.now();
    this.stats.totalAnalyzed++;

    try {
      // 이미지 전처리
      const processed = await this._preprocessImage(imageBuffer);
      
      // 얼굴 검출
      const faces = await this._detectFaces(processed);
      
      if (faces.length === 0) {
        return {
          hasFace: false,
          isManipulated: false,
          confidence: 0,
          indicators: [],
          latencyMs: Date.now() - startTime
        };
      }

      const indicators = [];
      let manipulationScore = 0;

      // 각 얼굴에 대해 분석
      for (const face of faces) {
        // 1. 얼굴 경계 불안정성 검사
        const boundaryResult = await this._analyzeFaceBoundary(processed, face);
        if (boundaryResult.hasArtifacts) {
          indicators.push({
            type: 'face_boundary_artifact',
            severity: 'high',
            confidence: boundaryResult.confidence,
            location: face
          });
          manipulationScore += 0.3;
        }

        // 2. 피부 텍스처 불일치
        const textureResult = await this._analyzeSkinTexture(processed, face);
        if (textureResult.hasInconsistency) {
          indicators.push({
            type: 'skin_texture_inconsistency',
            severity: 'medium',
            confidence: textureResult.confidence
          });
          manipulationScore += 0.2;
        }

        // 3. 조명 방향 불일치
        const lightingResult = await this._analyzeLightingDirection(processed, face);
        if (lightingResult.hasInconsistency) {
          indicators.push({
            type: 'lighting_direction_inconsistency',
            severity: 'high',
            confidence: lightingResult.confidence
          });
          manipulationScore += 0.25;
        }

        // 4. 눈 비대칭성 검사
        const eyeResult = await this._analyzeEyeSymmetry(processed, face);
        if (eyeResult.isAsymmetric) {
          indicators.push({
            type: 'eye_asymmetry',
            severity: 'medium',
            confidence: eyeResult.confidence
          });
          manipulationScore += 0.15;
        }

        // 5. 메타데이터 분석
        const metadataResult = await this._analyzeMetadata(imageBuffer);
        if (metadataResult.hasAnomaly) {
          indicators.push({
            type: 'metadata_anomaly',
            severity: 'low',
            confidence: 0.6,
            details: metadataResult.anomalies
          });
          manipulationScore += 0.1;
        }
      }

      const isManipulated = manipulationScore >= 0.5;
      if (isManipulated) {
        this.stats.manipulationsDetected++;
      }

      return {
        hasFace: true,
        faceCount: faces.length,
        isManipulated,
        confidence: Math.min(manipulationScore, 1.0),
        indicators: indicators.slice(0, 5),
        details: {
          manipulationScore,
          faces: faces.map(f => ({
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height
          }))
        },
        latencyMs: Date.now() - startTime
      };

    } catch (error) {
      this.stats.errors++;
      return {
        hasFace: null,
        isManipulated: null,
        confidence: 0,
        error: error.message,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * 비디오 얼굴 조작 탐지
   * @param {Array<Buffer>} frames - 프레임 버퍼 배열
   * @returns {Promise<Object>} 탐지 결과
   */
  async detectVideoManipulation(frames) {
    const startTime = Date.now();
    this.stats.totalAnalyzed++;

    try {
      const frameResults = [];
      const temporalFeatures = {
        blinkPatterns: [],
        faceBoundaries: [],
        lightingConsistency: []
      };

      // 각 프레임 분석
      for (let i = 0; i < frames.length; i++) {
        const frameResult = await this._analyzeFrame(frames[i], i);
        frameResults.push(frameResult);

        if (frameResult.hasFace) {
          temporalFeatures.blinkPatterns.push(frameResult.blinkState);
          temporalFeatures.faceBoundaries.push(frameResult.faceBoundary);
          temporalFeatures.lightingConsistency.push(frameResult.lightingDirection);
        }
      }

      const indicators = [];
      let manipulationScore = 0;

      // 1. 눈 깜빡임 패턴 분석
      const blinkAnalysis = this._analyzeBlinkPattern(temporalFeatures.blinkPatterns);
      if (blinkAnalysis.isAbnormal) {
        indicators.push({
          type: 'abnormal_blink_pattern',
          severity: 'high',
          confidence: blinkAnalysis.confidence,
          details: {
            blinkRate: blinkAnalysis.blinkRate,
            expectedRate: this.options.normalBlinkRate,
            irregularBlinks: blinkAnalysis.irregularBlinks
          }
        });
        manipulationScore += 0.35;
      }

      // 2. 얼굴 경계 안정성 분석
      const boundaryAnalysis = this._analyzeBoundaryStability(temporalFeatures.faceBoundaries);
      if (boundaryAnalysis.isUnstable) {
        indicators.push({
          type: 'unstable_face_boundary',
          severity: 'high',
          confidence: boundaryAnalysis.confidence,
          details: {
            jitterScore: boundaryAnalysis.jitterScore,
            frameCount: frames.length
          }
        });
        manipulationScore += 0.3;
      }

      // 3. 조명 일관성 분석
      const lightingAnalysis = this._analyzeLightingConsistency(temporalFeatures.lightingConsistency);
      if (lightingAnalysis.isInconsistent) {
        indicators.push({
          type: 'lighting_temporal_inconsistency',
          severity: 'medium',
          confidence: lightingAnalysis.confidence
        });
        manipulationScore += 0.2;
      }

      // 4. 프레임 간 얼굴 특징 불일치
      const featureAnalysis = this._analyzeFeatureConsistency(frameResults);
      if (featureAnalysis.hasInconsistency) {
        indicators.push({
          type: 'facial_feature_inconsistency',
          severity: 'high',
          confidence: featureAnalysis.confidence
        });
        manipulationScore += 0.25;
      }

      const isManipulated = manipulationScore >= 0.5;
      if (isManipulated) {
        this.stats.manipulationsDetected++;
      }

      return {
        isManipulated,
        confidence: Math.min(manipulationScore, 1.0),
        frameCount: frames.length,
        analyzedFrames: frameResults.filter(r => r.hasFace).length,
        indicators: indicators.slice(0, 5),
        details: {
          manipulationScore,
          blinkAnalysis,
          boundaryAnalysis,
          lightingAnalysis,
          featureAnalysis
        },
        latencyMs: Date.now() - startTime
      };

    } catch (error) {
      this.stats.errors++;
      return {
        isManipulated: null,
        confidence: 0,
        error: error.message,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * 단일 프레임 분석
   * @private
   */
  async _analyzeFrame(frameBuffer, frameIndex) {
    const processed = await this._preprocessImage(frameBuffer);
    const faces = await this._detectFaces(processed);

    if (faces.length === 0) {
      return { hasFace: false, frameIndex };
    }

    const face = faces[0]; // 주 얼굴 사용
    
    // 눈 상태 감지
    const eyes = await this._detectEyes(processed, face);
    const blinkState = this._calculateEyeAspectRatio(eyes);

    // 얼굴 경계 추출
    const faceBoundary = await this._extractFaceBoundary(processed, face);

    // 조명 방향 추정
    const lightingDirection = await this._estimateLightingDirection(processed, face);

    return {
      hasFace: true,
      frameIndex,
      blinkState,
      faceBoundary,
      lightingDirection,
      faceFeatures: await this._extractFacialFeatures(processed, face)
    };
  }

  /**
   * 이미지 전처리
   * @private
   */
  async _preprocessImage(buffer) {
    // sharp를 사용하여 표준화
    const processed = await sharp(buffer)
      .resize(640, 480, { fit: 'inside' })
      .normalize()
      .toBuffer();

    // OpenCV Mat으로 변환
    const mat = cv.imdecode(processed);
    return mat;
  }

  /**
   * 얼굴 검출
   * @private
   */
  async _detectFaces(mat) {
    const gray = mat.bgrToGray();
    const faces = this.faceCascade.detectMultiScale(gray, {
      scaleFactor: 1.1,
      minNeighbors: 5,
      minSize: new cv.Size(50, 50)
    });

    return faces.objects;
  }

  /**
   * 눈 검출
   * @private
   */
  async _detectEyes(mat, face) {
    const faceROI = mat.getRegion(face);
    const gray = faceROI.bgrToGray();
    
    const eyes = this.eyeCascade.detectMultiScale(gray, {
      scaleFactor: 1.1,
      minNeighbors: 3,
      minSize: new cv.Size(20, 20)
    });

    return eyes.objects;
  }

  /**
   * 눈 종횡비 계산 (EAR - Eye Aspect Ratio)
   * @private
   */
  _calculateEyeAspectRatio(eyes) {
    if (eyes.length < 2) return { isOpen: null, ratio: 0 };

    const earValues = eyes.map(eye => {
      // 눈의 수직/수평 비율 계산
      const height = eye.height;
      const width = eye.width;
      return height / width;
    });

    const avgEar = earValues.reduce((a, b) => a + b, 0) / earValues.length;
    
    return {
      isOpen: avgEar > this.options.blinkThreshold,
      ratio: avgEar
    };
  }

  /**
   * 눈 깜빡임 패턴 분석
   * @private
   */
  _analyzeBlinkPattern(blinkStates) {
    const validStates = blinkStates.filter(s => s.isOpen !== null);
    
    if (validStates.length < 10) {
      return { isAbnormal: false, confidence: 0 };
    }

    // 깜빡임 감지 (눈이 감겼다 뜨는 패턴)
    let blinkCount = 0;
    let wasClosed = false;
    const blinkIntervals = [];
    let lastBlinkFrame = 0;

    validStates.forEach((state, index) => {
      if (!state.isOpen && !wasClosed) {
        wasClosed = true;
      } else if (state.isOpen && wasClosed) {
        blinkCount++;
        if (lastBlinkFrame > 0) {
          blinkIntervals.push(index - lastBlinkFrame);
        }
        lastBlinkFrame = index;
        wasClosed = false;
      }
    });

    // 분당 깜빡임률 계산 (30fps 가정)
    const durationMinutes = validStates.length / 30 / 60;
    const blinkRate = durationMinutes > 0 ? blinkCount / durationMinutes : 0;

    // 정상 범위 확인
    const isNormalRate = blinkRate >= this.options.normalBlinkRate.min && 
                         blinkRate <= this.options.normalBlinkRate.max;

    // 깜빡임 간격 불규칙성
    const irregularBlinks = blinkIntervals.filter(interval => 
      interval < 5 || interval > 60 // 너무 빠르거나 느린 깜빡임
    ).length;

    const isAbnormal = !isNormalRate || irregularBlinks > blinkCount * 0.3;

    return {
      isAbnormal,
      blinkRate,
      blinkCount,
      irregularBlinks,
      confidence: isAbnormal ? 0.8 : 0.3
    };
  }

  /**
   * 얼굴 경계 분석
   * @private
   */
  async _analyzeFaceBoundary(mat, face) {
    const faceROI = mat.getRegion(face);
    
    // 엣지 검출
    const gray = faceROI.bgrToGray();
    const edges = gray.canny(50, 150);
    
    // 경계 주변의 아티팩트 검출
    const boundaryRegion = edges.getRegion(new cv.Rect(
      Math.max(0, face.width * 0.1),
      Math.max(0, face.height * 0.1),
      face.width * 0.8,
      face.height * 0.8
    ));

    // 아티팩트 밀도 계산
    const artifactDensity = cv.countNonZero(boundaryRegion) / 
                           (boundaryRegion.cols * boundaryRegion.rows);

    return {
      hasArtifacts: artifactDensity > this.options.boundaryThreshold,
      confidence: Math.min(artifactDensity * 2, 1.0),
      density: artifactDensity
    };
  }

  /**
   * 얼굴 경계 안정성 분석
   * @private
   */
  _analyzeBoundaryStability(boundaries) {
    if (boundaries.length < 10) {
      return { isUnstable: false, jitterScore: 0, confidence: 0 };
    }

    // 프레임 간 경계 변화 계산
    const variations = [];
    for (let i = 1; i < boundaries.length; i++) {
      const prev = boundaries[i - 1];
      const curr = boundaries[i];
      
      const variation = Math.abs(curr.x - prev.x) + 
                       Math.abs(curr.y - prev.y) +
                       Math.abs(curr.width - prev.width) +
                       Math.abs(curr.height - prev.height);
      variations.push(variation);
    }

    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    const jitterScore = avgVariation / 100; // 정규화

    return {
      isUnstable: jitterScore > this.options.boundaryThreshold,
      jitterScore,
      confidence: Math.min(jitterScore * 2, 1.0)
    };
  }

  /**
   * 피부 텍스처 분석
   * @private
   */
  async _analyzeSkinTexture(mat, face) {
    const faceROI = mat.getRegion(face);
    const gray = faceROI.bgrToGray();

    // 주파수 분석을 통한 텍스처 분석
    const laplacian = gray.laplacian(cv.CV_64F);
    const variance = laplacian.mean().x;

    // GAN 생성 이미지는 일반적으로 낮은 고주파 성분을 가짐
    const hasInconsistency = variance < 100 || variance > 1000;

    return {
      hasInconsistency,
      confidence: hasInconsistency ? 0.7 : 0.3,
      variance
    };
  }

  /**
   * 조명 방향 분석
   * @private
   */
  async _analyzeLightingDirection(mat, face) {
    const faceROI = mat.getRegion(face);
    
    // 그라데이션 기반 조명 방향 추정
    const gray = faceROI.bgrToGray();
    const sobelX = gray.sobel(cv.CV_64F, 1, 0);
    const sobelY = gray.sobel(cv.CV_64F, 0, 1);

    // 주요 조명 방향 계산
    const meanX = sobelX.mean().x;
    const meanY = sobelY.mean().y;
    const direction = Math.atan2(meanY, meanX) * 180 / Math.PI;

    return {
      direction,
      magnitude: Math.sqrt(meanX * meanX + meanY * meanY),
      hasInconsistency: false // 단일 이미지에서는 판단 어려움
    };
  }

  /**
   * 조명 일관성 분석 (시계적)
   * @private
   */
  _analyzeLightingConsistency(directions) {
    if (directions.length < 10) {
      return { isInconsistent: false, confidence: 0 };
    }

    const validDirections = directions.filter(d => d && !isNaN(d.direction));
    
    if (validDirections.length < 5) {
      return { isInconsistent: false, confidence: 0 };
    }

    // 방향 분산 계산
    const mean = validDirections.reduce((a, b) => a + b.direction, 0) / validDirections.length;
    const variance = validDirections.reduce((a, b) => a + Math.pow(b.direction - mean, 2), 0) / validDirections.length;

    const isInconsistent = variance > 500; // 임계값

    return {
      isInconsistent,
      confidence: isInconsistent ? Math.min(variance / 1000, 1.0) : 0.3,
      variance
    };
  }

  /**
   * 눈 비대칭성 분석
   * @private
   */
  async _analyzeEyeSymmetry(mat, face) {
    const eyes = await this._detectEyes(mat, face);
    
    if (eyes.length < 2) {
      return { isAsymmetric: false, confidence: 0 };
    }

    // 양쪽 눈 크기 비교
    const leftEye = eyes[0];
    const rightEye = eyes[1];

    const sizeDiff = Math.abs(leftEye.width * leftEye.height - 
                              rightEye.width * rightEye.height);
    const avgSize = (leftEye.width * leftEye.height + 
                    rightEye.width * rightEye.height) / 2;
    
    const asymmetryRatio = sizeDiff / avgSize;

    return {
      isAsymmetric: asymmetryRatio > 0.3,
      confidence: Math.min(asymmetryRatio * 2, 1.0),
      ratio: asymmetryRatio
    };
  }

  /**
   * 얼굴 특징 추출
   * @private
   */
  async _extractFacialFeatures(mat, face) {
    // 간단한 특징 추출 (랜드마크 기반)
    const faceROI = mat.getRegion(face);
    
    return {
      faceRect: {
        x: face.x,
        y: face.y,
        width: face.width,
        height: face.height
      },
      aspectRatio: face.width / face.height
    };
  }

  /**
   * 얼굴 특징 일관성 분석
   * @private
   */
  _analyzeFeatureConsistency(frameResults) {
    const validResults = frameResults.filter(r => r.hasFace && r.faceFeatures);
    
    if (validResults.length < 10) {
      return { hasInconsistency: false, confidence: 0 };
    }

    // 종횡비 변화 분석
    const aspectRatios = validResults.map(r => r.faceFeatures.aspectRatio);
    const mean = aspectRatios.reduce((a, b) => a + b, 0) / aspectRatios.length;
    const variance = aspectRatios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / aspectRatios.length;

    const hasInconsistency = variance > 0.01;

    return {
      hasInconsistency,
      confidence: hasInconsistency ? Math.min(variance * 50, 1.0) : 0.3,
      variance
    };
  }

  /**
   * 메타데이터 분석
   * @private
   */
  async _analyzeMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const anomalies = [];

      // EXIF 데이터 검사
      if (!metadata.exif) {
        anomalies.push('Missing EXIF data');
      }

      // 비정상적인 해상도
      if (metadata.width && metadata.height) {
        const ratio = metadata.width / metadata.height;
        if (ratio < 0.5 || ratio > 3) {
          anomalies.push('Unusual aspect ratio');
        }
      }

      // 압축 아티팩트 검사
      if (metadata.chromaSubsampling === '4:2:0' && metadata.quality < 60) {
        anomalies.push('High compression artifacts');
      }

      return {
        hasAnomaly: anomalies.length > 0,
        anomalies
      };

    } catch (error) {
      return {
        hasAnomaly: true,
        anomalies: ['Failed to parse metadata']
      };
    }
  }

  /**
   * 얼굴 경계 추출
   * @private
   */
  async _extractFaceBoundary(mat, face) {
    return {
      x: face.x,
      y: face.y,
      width: face.width,
      height: face.height
    };
  }

  /**
   * 조명 방향 추정
   * @private
   */
  async _estimateLightingDirection(mat, face) {
    const result = await this._analyzeLightingDirection(mat, face);
    return result;
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalAnalyzed > 0
        ? ((this.stats.totalAnalyzed - this.stats.errors) / this.stats.totalAnalyzed * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

module.exports = { AdvancedFaceDetectionEngine };
