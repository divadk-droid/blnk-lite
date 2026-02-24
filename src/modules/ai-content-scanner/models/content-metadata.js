/**
 * Content Metadata Model
 * 
 * AI 콘텐츠 메타데이터 모델
 */

class ContentMetadata {
  constructor(data = {}) {
    this.filename = data.filename || null;
    this.mimeType = data.mimeType || null;
    this.size = data.size || 0;
    this.dimensions = data.dimensions || null; // { width, height }
    this.duration = data.duration || null; // 비디오용 (초)
    this.createdAt = data.createdAt || null;
    this.modifiedAt = data.modifiedAt || null;
    
    // EXIF/메타데이터
    this.exif = data.exif || {};
    this.xmp = data.xmp || {};
    this.icc = data.icc || {};
    
    // AI 생성 정보
    this.aiGenerated = data.aiGenerated || null;
    this.aiTool = data.aiTool || null;
    this.aiModel = data.aiModel || null;
    this.aiPrompt = data.aiPrompt || null;
    
    // 저작권 정보
    this.copyright = data.copyright || null;
    this.license = data.license || null;
    this.creator = data.creator || null;
    this.attribution = data.attribution || null;
    
    // C2PA 정보
    this.c2paManifest = data.c2paManifest || null;
    
    // 사용자 제공 메타데이터
    this.userMetadata = data.userMetadata || {};
  }

  /**
   * AI 생성 여부 확인
   */
  isAIGenerated() {
    if (this.aiGenerated !== null) return this.aiGenerated;
    
    // 메타데이터에서 추론
    if (this.aiTool || this.aiModel) return true;
    
    // EXIF에서 AI 생성 툴 확인
    const aiTools = ['Midjourney', 'DALL-E', 'Stable Diffusion', 'Sora', 'Runway', 'Pika', 'Firefly'];
    const exifString = JSON.stringify(this.exif).toLowerCase();
    return aiTools.some(tool => exifString.includes(tool.toLowerCase()));
  }

  /**
   * 저작권 정보 추출
   */
  getCopyrightInfo() {
    return {
      copyright: this.copyright,
      license: this.license,
      creator: this.creator,
      attribution: this.attribution,
      hasExplicitInfo: !!(this.copyright || this.license)
    };
  }

  /**
   * C2PA 정보 추출
   */
  getC2PAInfo() {
    if (!this.c2paManifest) return null;
    
    return {
      hasC2PA: true,
      version: this.c2paManifest.version,
      creator: this.c2paManifest.claims?.[0]?.claimGenerator,
      createdAt: this.c2paManifest.claims?.[0]?.created,
      assertions: this.c2paManifest.assertions?.map(a => a.type) || []
    };
  }

  /**
   * 파일 해시 계산
   */
  async calculateHash(content) {
    const crypto = require('crypto');
    
    if (typeof content === 'string') {
      return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    if (Buffer.isBuffer(content)) {
      return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    return null;
  }

  /**
   * JSON 변환
   */
  toJSON() {
    return {
      filename: this.filename,
      mimeType: this.mimeType,
      size: this.size,
      dimensions: this.dimensions,
      duration: this.duration,
      createdAt: this.createdAt,
      modifiedAt: this.modifiedAt,
      exif: this.exif,
      xmp: this.xmp,
      icc: this.icc,
      aiGenerated: this.aiGenerated,
      aiTool: this.aiTool,
      aiModel: this.aiModel,
      aiPrompt: this.aiPrompt,
      copyright: this.copyright,
      license: this.license,
      creator: this.creator,
      attribution: this.attribution,
      c2paManifest: this.c2paManifest,
      userMetadata: this.userMetadata
    };
  }

  /**
   * 정적 팩토리 메서드 - 파일에서 메타데이터 추출
   */
  static async fromFile(filePath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    const metadata = new ContentMetadata({
      filename: path.basename(filePath),
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    });

    // MIME 타입 설정
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime'
    };
    metadata.mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Phase 2: EXIF 추출 구현
    // const exif = await extractEXIF(filePath);
    // metadata.exif = exif;

    return metadata;
  }

  /**
   * 정적 팩토리 메서드 - 버퍼에서 메타데이터 추출
   */
  static async fromBuffer(buffer, options = {}) {
    const metadata = new ContentMetadata({
      filename: options.filename || 'unknown',
      mimeType: options.mimeType || 'application/octet-stream',
      size: buffer.length
    });

    // Phase 2: 버퍼에서 메타데이터 추출 구현
    // - 이미지 크기
    // - EXIF 데이터
    // - C2PA 매니페스트

    return metadata;
  }
}

module.exports = { ContentMetadata };
