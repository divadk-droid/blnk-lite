/**
 * BLNK i18n - Internationalization
 * Korean, Chinese, Japanese support
 */

const translations = {
  // Korean
  ko: {
    risk: {
      SAFE: '안전',
      LOW: '낮음',
      MEDIUM: '중간',
      HIGH: '높음',
      CRITICAL: '위험'
    },
    decision: {
      PASS: '통과',
      WARN: '주의',
      BLOCK: '차단'
    },
    signals: {
      ownership: '소유권 패턴',
      mintable: '발행 가능',
      blacklist: '블랙리스트 기능',
      upgradeable: '업그레이드 가능',
      pausable: '일시정지 가능',
      suspicious: '의심스러운 패턴',
      liquidity: '유동성 위험'
    },
    reasons: {
      whitelist: '알려진 안전한 컨트랙트',
      critical_patterns: '위험 패턴 감지',
      caution_patterns: '주의 패턴 감지',
      not_contract: '컨트랙트 아님 (EOA)',
      system_error: '시스템 오류'
    },
    ui: {
      risk_score: '리스크 점수',
      confidence: '신뢰도',
      latency: '응답 시간',
      cached: '캐시됨',
      rpc_calls: 'RPC 호출',
      recommended_action: '권장 조치',
      upgrade_tier: '티어 업그레이드'
    }
  },
  
  // Chinese (Simplified)
  zh: {
    risk: {
      SAFE: '安全',
      LOW: '低',
      MEDIUM: '中',
      HIGH: '高',
      CRITICAL: '危险'
    },
    decision: {
      PASS: '通过',
      WARN: '警告',
      BLOCK: '阻止'
    },
    signals: {
      ownership: '所有权模式',
      mintable: '可铸造',
      blacklist: '黑名单功能',
      upgradeable: '可升级',
      pausable: '可暂停',
      suspicious: '可疑模式',
      liquidity: '流动性风险'
    },
    reasons: {
      whitelist: '已知安全合约',
      critical_patterns: '检测到危险模式',
      caution_patterns: '检测到警告模式',
      not_contract: '非合约 (EOA)',
      system_error: '系统错误'
    },
    ui: {
      risk_score: '风险评分',
      confidence: '置信度',
      latency: '响应时间',
      cached: '已缓存',
      rpc_calls: 'RPC调用',
      recommended_action: '建议操作',
      upgrade_tier: '升级等级'
    }
  },
  
  // Japanese
  ja: {
    risk: {
      SAFE: '安全',
      LOW: '低',
      MEDIUM: '中',
      HIGH: '高',
      CRITICAL: '危険'
    },
    decision: {
      PASS: '合格',
      WARN: '警告',
      BLOCK: 'ブロック'
    },
    signals: {
      ownership: '所有権パターン',
      mintable: '発行可能',
      blacklist: 'ブラックリスト機能',
      upgradeable: 'アップグレード可能',
      pausable: '一時停止可能',
      suspicious: '疑わしいパターン',
      liquidity: '流動性リスク'
    },
    reasons: {
      whitelist: '既知の安全なコントラクト',
      critical_patterns: '危険パターン検出',
      caution_patterns: '警告パターン検出',
      not_contract: 'コントラクトではない (EOA)',
      system_error: 'システムエラー'
    },
    ui: {
      risk_score: 'リスクスコア',
      confidence: '信頼度',
      latency: '応答時間',
      cached: 'キャッシュ済み',
      rpc_calls: 'RPC呼び出し',
      recommended_action: '推奨アクション',
      upgrade_tier: 'ティアアップグレード'
    }
  },
  
  // English (default)
  en: {
    risk: {
      SAFE: 'SAFE',
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL'
    },
    decision: {
      PASS: 'PASS',
      WARN: 'WARN',
      BLOCK: 'BLOCK'
    },
    signals: {
      ownership: 'Ownership Pattern',
      mintable: 'Mintable',
      blacklist: 'Blacklist Function',
      upgradeable: 'Upgradeable',
      pausable: 'Pausable',
      suspicious: 'Suspicious Pattern',
      liquidity: 'Liquidity Risk'
    },
    reasons: {
      whitelist: 'Known Safe Contract',
      critical_patterns: 'Critical Patterns Detected',
      caution_patterns: 'Caution Patterns Detected',
      not_contract: 'Not a Contract (EOA)',
      system_error: 'System Error'
    },
    ui: {
      risk_score: 'Risk Score',
      confidence: 'Confidence',
      latency: 'Latency',
      cached: 'Cached',
      rpc_calls: 'RPC Calls',
      recommended_action: 'Recommended Action',
      upgrade_tier: 'Upgrade Tier'
    }
  }
};

class I18n {
  constructor(defaultLang = 'en') {
    this.defaultLang = defaultLang;
    this.supportedLangs = ['en', 'ko', 'zh', 'ja'];
  }
  
  /**
   * Get translation for key
   */
  t(key, lang = 'en') {
    const language = this.supportedLangs.includes(lang) ? lang : this.defaultLang;
    const keys = key.split('.');
    
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    return value || key;
  }
  
  /**
   * Translate risk response
   */
  translateResponse(response, lang = 'en') {
    if (!response) return response;
    
    const translated = { ...response };
    
    // Translate risk level
    if (response.risk_level) {
      translated.risk_level_localized = this.t(`risk.${response.risk_level}`, lang);
    }
    
    // Translate decision
    if (response.decision) {
      translated.decision_localized = this.t(`decision.${response.decision}`, lang);
    }
    
    // Translate reason
    if (response.reason) {
      // Map reason to translation key
      const reasonKey = this.mapReasonToKey(response.reason);
      if (reasonKey) {
        translated.reason_localized = this.t(`reasons.${reasonKey}`, lang);
      }
    }
    
    // Translate signals
    if (response.signals) {
      translated.signals_localized = response.signals.map(signal => ({
        ...signal,
        type_localized: this.t(`signals.${signal.type.toLowerCase()}`, lang)
      }));
    }
    
    // Add language info
    translated.language = lang;
    translated.language_name = this.getLanguageName(lang);
    
    return translated;
  }
  
  /**
   * Map reason string to translation key
   */
  mapReasonToKey(reason) {
    const mappings = {
      'Known safe contract': 'whitelist',
      'Critical patterns': 'critical_patterns',
      'Caution patterns': 'caution_patterns',
      'Not a contract': 'not_contract',
      'System error': 'system_error'
    };
    
    for (const [pattern, key] of Object.entries(mappings)) {
      if (reason?.includes(pattern)) return key;
    }
    return null;
  }
  
  /**
   * Get language name
   */
  getLanguageName(lang) {
    const names = {
      en: 'English',
      ko: '한국어',
      zh: '简体中文',
      ja: '日本語'
    };
    return names[lang] || 'English';
  }
  
  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLangs.map(lang => ({
      code: lang,
      name: this.getLanguageName(lang)
    }));
  }
  
  /**
   * Detect language from header or query
   */
  detectLanguage(req) {
    // Check query parameter
    if (req.query?.lang) {
      return this.supportedLangs.includes(req.query.lang) ? req.query.lang : 'en';
    }
    
    // Check Accept-Language header
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const preferred = acceptLang.split(',')[0].split('-')[0].toLowerCase();
      return this.supportedLangs.includes(preferred) ? preferred : 'en';
    }
    
    return 'en';
  }
}

module.exports = { I18n };
