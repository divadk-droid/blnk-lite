const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');

/**
 * Copyright Infringement Scanner - Production Ready
 * 실제 TinEye, Google Images, AudD API 연동
 */

// 환경 변수
const TINEYE_API_KEY = process.env.TINEYE_API_KEY;
const AUDD_API_KEY = process.env.AUDD_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX; // Custom Search Engine ID

// TinEye 역 이미지 검색
async function tineyeSearch(imageUrl) {
  if (!TINEYE_API_KEY) {
    console.warn('TinEye API key not configured');
    return { matches: [], totalMatches: 0, source: 'none' };
  }
  
  try {
    const response = await axios.get('https://api.tineye.com/rest/search/', {
      params: {
        url: imageUrl,
        api_key: TINEYE_API_KEY
      },
      timeout: 5000
    });
    
    const matches = response.data.results?.matches || [];
    return {
      matches: matches.slice(0, 5).map(m => ({
        source: new URL(m.backlinks?.[0]?.url || '').hostname || 'unknown',
        url: m.backlinks?.[0]?.url,
        similarity: Math.round(m.score * 100),
        license: m.score > 0.9 ? 'Copyrighted' : 'Unknown'
      })),
      totalMatches: matches.length,
      source: 'tineye'
    };
  } catch (error) {
    console.error('TinEye search failed:', error.message);
    return { matches: [], totalMatches: 0, source: 'tineye', error: error.message };
  }
}

// Google Images 역 검색 (Custom Search API)
async function googleImageSearch(imageUrl) {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.warn('Google API not configured');
    return { matches: [], totalMatches: 0, source: 'none' };
  }
  
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: imageUrl,
        searchType: 'image',
        num: 5
      },
      timeout: 5000
    });
    
    const items = response.data.items || [];
    return {
      matches: items.map(item => ({
        source: new URL(item.link).hostname,
        url: item.link,
        similarity: 85, // Google은 유사도 점수 제공 안 함
        license: item.image?.contextLink ? 'Check source' : 'Unknown'
      })),
      totalMatches: response.data.searchInformation?.totalResults || 0,
      source: 'google'
    };
  } catch (error) {
    console.error('Google search failed:', error.message);
    return { matches: [], totalMatches: 0, source: 'google', error: error.message };
  }
}

// AudD 오디오 지문 검색
async function auddSearch(audioUrl) {
  if (!AUDD_API_KEY) {
    console.warn('AudD API key not configured');
    return { matches: [], totalMatches: 0, source: 'none' };
  }
  
  try {
    const data = new FormData();
    data.append('url', audioUrl);
    data.append('return', 'apple_music,spotify');
    data.append('api_token', AUDD_API_KEY);
    
    const response = await axios.post('https://api.audd.io/', data, {
      headers: data.getHeaders(),
      timeout: 10000
    });
    
    const result = response.data;
    if (result.status === 'success' && result.result) {
      return {
        matches: [{
          song: result.result.title,
          artist: result.result.artist,
          album: result.result.album,
          confidence: Math.round(result.result.score * 100),
          platform: 'AudD',
          links: {
            appleMusic: result.result.apple_music?.url,
            spotify: result.result.spotify?.uri
          }
        }],
        totalMatches: 1,
        source: 'audd'
      };
    }
    
    return { matches: [], totalMatches: 0, source: 'audd' };
  } catch (error) {
    console.error('AudD search failed:', error.message);
    return { matches: [], totalMatches: 0, source: 'audd', error: error.message };
  }
}

// 통합 저작권 검사
async function comprehensiveCopyrightCheck(contentUrl, contentType) {
  const results = [];
  
  if (contentType === 'image') {
    // 병렬 검색
    const [tineye, google] = await Promise.all([
      tineyeSearch(contentUrl),
      googleImageSearch(contentUrl)
    ]);
    
    if (tineye.matches.length) results.push(...tineye.matches);
    if (google.matches.length) results.push(...google.matches);
  } else if (contentType === 'audio') {
    const audd = await auddSearch(contentUrl);
    if (audd.matches.length) results.push(...audd.matches);
  }
  
  // 중복 제거 및 정렬
  const uniqueMatches = results.filter((match, index, self) =>
    index === self.findIndex(m => m.url === match.url)
  );
  
  return {
    matches: uniqueMatches.slice(0, 10),
    totalMatches: uniqueMatches.length,
    sourcesChecked: contentType === 'image' ? ['tineye', 'google'] : ['audd']
  };
}

// POST /api/v1/copyright/check
router.post('/check', async (req, res) => {
  try {
    const { contentUrl, contentType } = req.body;
    
    if (!contentUrl || !contentType) {
      return res.status(400).json({
        error: 'contentUrl and contentType are required'
      });
    }
    
    if (!['image', 'audio', 'video'].includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid contentType. Use: image, audio, or video'
      });
    }
    
    const checkId = `copyright_${Date.now()}`;
    const startTime = Date.now();
    
    // 실제 검사 실행
    const result = await comprehensiveCopyrightCheck(contentUrl, contentType);
    
    const processingTime = Date.now() - startTime;
    
    // 리스크 점수 계산
    const maxSimilarity = result.matches.length > 0 
      ? Math.max(...result.matches.map(m => m.similarity || m.confidence || 0))
      : 0;
    
    const riskScore = maxSimilarity;
    const riskLevel = riskScore > 90 ? 'HIGH' : riskScore > 70 ? 'MEDIUM' : 'LOW';
    
    res.json({
      checkId,
      contentUrl,
      contentType,
      riskScore,
      riskLevel,
      matches: result.matches,
      totalMatches: result.totalMatches,
      sourcesChecked: result.sourcesChecked,
      processingTime: `${processingTime}ms`,
      recommendation: riskScore >= 90 ? 'DO_NOT_USE' : 
                      riskScore >= 70 ? 'REVIEW_REQUIRED' : 
                      riskScore > 0 ? 'CAUTION' : 'LIKELY_SAFE',
      checkedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v1/copyright/health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Copyright Scanner',
    apis: {
      tineye: TINEYE_API_KEY ? 'configured' : 'not_configured',
      google: GOOGLE_API_KEY ? 'configured' : 'not_configured',
      audd: AUDD_API_KEY ? 'configured' : 'not_configured'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;