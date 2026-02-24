/**
 * Copyright Check Engine
 * 
 * 저작권 침해 가능성을 검사하는 엔진
 * Phase 3에서 역 이미지 검색 API 연동 예정
 */

class CopyrightCheckEngine {
  constructor(options = {}) {
    this.options = {
      similarityThreshold: 0.85,
      apiEndpoint: process.env.COPYRIGHT_API_URL,
      apiKey: process.env.COPYRIGHT_API_KEY,
      ...options
    };
    
    // 알려진 아티스트 스타일 데이터베이스 (Phase 3에서 확장)
    this.knownArtists = [
      { name: 'Van Gogh', keywords: ['swirling', 'starry', 'post-impressionist'] },
      { name: 'Picasso', keywords: ['cubist', 'abstract', 'geometric'] },
      { name: 'Monet', keywords: ['impressionist', 'water lilies', 'light'] }
    ];

    this.stats = {
      totalChecked: 0,
      matchesFound: 0,
      errors: 0
    };
  }

  /**
   * 저작권 검사 실행
   * @param {Buffer|string} content - 콘텐츠 데이터
   * @param {Object} metadata - 콘텐츠 메타데이터
   * @returns {Promise<Object>} 검사 결과
   */
  async check(content, metadata = {}) {
    this.stats.totalChecked++;

    try {
      const checks = await Promise.all([
        this._reverseImageSearch(content, metadata),
        this._styleSimilarityCheck(content, metadata),
        this._metadataAnalysis(metadata),
        this._watermarkDetection(content)
      ]);

      const [reverseSearch, styleCheck, metaAnalysis, watermarkCheck] = checks;

      // 종합 리스크 평가
      const hasMatches = reverseSearch.matches.length > 0 || 
                        styleCheck.similarity > this.options.similarityThreshold ||
                        metaAnalysis.copyrightFlags.length > 0;

      if (hasMatches) {
        this.stats.matchesFound++;
      }

      return {
        hasMatches,
        riskLevel: this._calculateRiskLevel(reverseSearch, styleCheck, metaAnalysis),
        matches: reverseSearch.matches,
        styleSimilarity: styleCheck,
        metadataAnalysis: metaAnalysis,
        watermarkCheck,
        details: {
          totalChecks: 4,
          passedChecks: checks.filter(c => !c.error).length
        }
      };
    } catch (error) {
      this.stats.errors++;
      return {
        hasMatches: null,
        riskLevel: 'unknown',
        error: error.message,
        matches: [],
        styleSimilarity: null,
        metadataAnalysis: null
      };
    }
  }

  /**
   * 역 이미지 검색
   * @private
   */
  async _reverseImageSearch(content, metadata) {
    // Phase 3: Google Reverse Image Search, TinEye API 연동
    
    // 시뮬레이션 결과
    const simulatedMatches = [];
    
    // 실제 구현에서는 외부 API 호출
    // const results = await this._callReverseImageAPI(content);

    return {
      searched: true,
      matches: simulatedMatches,
      apiUsed: 'none', // Phase 3에서 변경
      searchTime: 0
    };
  }

  /**
   * 스타일 유사도 검사
   * @private
   */
  async _styleSimilarityCheck(content, metadata) {
    // Phase 3: 스타일 전이 모델 연동
    
    const styleMatches = [];
    let maxSimilarity = 0;

    // 간단한 키워드 기반 매칭 (임시)
    if (metadata.description || metadata.tags) {
      const text = `${metadata.description || ''} ${(metadata.tags || []).join(' ')}`;
      
      for (const artist of this.knownArtists) {
        const matches = artist.keywords.filter(kw => 
          text.toLowerCase().includes(kw.toLowerCase())
        );
        
        if (matches.length > 0) {
          const similarity = matches.length / artist.keywords.length;
          styleMatches.push({
            artist: artist.name,
            similarity,
            matchedKeywords: matches
          });
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
      }
    }

    return {
      analyzed: true,
      similarity: maxSimilarity,
      matches: styleMatches,
      threshold: this.options.similarityThreshold,
      exceeded: maxSimilarity > this.options.similarityThreshold
    };
  }

  /**
   * 메타데이터 저작권 분석
   * @private
   */
  async _metadataAnalysis(metadata) {
    const flags = [];

    // 저작권 관련 메타데이터 확인
    if (metadata.copyright) {
      flags.push({
        type: 'explicit_copyright',
        value: metadata.copyright,
        severity: 'high'
      });
    }

    if (metadata.license) {
      const restrictiveLicenses = ['CC-BY-NC', 'CC-BY-ND', 'All Rights Reserved'];
      if (restrictiveLicenses.some(l => metadata.license.includes(l))) {
        flags.push({
          type: 'restrictive_license',
          value: metadata.license,
          severity: 'medium'
        });
      }
    }

    // AI 생성 콘텐츠의 저작권 상태
    if (metadata.aiGenerated) {
      flags.push({
        type: 'ai_generated',
        value: 'Content is AI generated',
        severity: 'medium',
        note: 'Copyright status of AI generated content varies by jurisdiction'
      });
    }

    return {
      analyzed: true,
      copyrightFlags: flags,
      hasCopyrightInfo: flags.length > 0
    };
  }

  /**
   * 워터마크 검출
   * @private
   */
  async _watermarkDetection(content) {
    // Phase 3: 워터마크 검출 알고리즘
    
    return {
      analyzed: false,
      watermarksFound: [],
      confidence: 0
    };
  }

  /**
   * 리스크 레벨 계산
   * @private
   */
  _calculateRiskLevel(reverseSearch, styleCheck, metaAnalysis) {
    let score = 0;

    // 역 이미지 검색 매칭
    if (reverseSearch.matches.length > 0) {
      score += reverseSearch.matches.length * 20;
    }

    // 스타일 유사도
    if (styleCheck.exceeded) {
      score += 30;
    }

    // 메타데이터 플래그
    for (const flag of metaAnalysis.copyrightFlags) {
      if (flag.severity === 'high') score += 25;
      else if (flag.severity === 'medium') score += 15;
      else score += 5;
    }

    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  /**
   * 엔진 통계 조회
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalChecked > 0
        ? ((this.stats.totalChecked - this.stats.errors) / this.stats.totalChecked * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }
}

module.exports = { CopyrightCheckEngine };
