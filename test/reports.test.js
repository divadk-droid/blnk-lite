const request = require('supertest');
const express = require('express');

describe('Reports API', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/reports', require('../../src/api/routes/reports'));
  });
  
  describe('POST /api/v1/reports/generate', () => {
    it('should return 400 if targetAddress is missing', async () => {
      const res = await request(app)
        .post('/api/v1/reports/generate')
        .send({ reportFormat: 'pdf' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('targetAddress');
    });
    
    it('should return report generation result', async () => {
      const res = await request(app)
        .post('/api/v1/reports/generate')
        .send({
          targetAddress: '0x1234567890123456789012345678901234567890',
          reportFormat: 'pdf',
          dateRange: '30d'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reportId');
      expect(res.body).toHaveProperty('downloadUrl');
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('completed');
    });
    
    it('should support multiple formats', async () => {
      const formats = ['pdf', 'excel', 'csv'];
      
      for (const format of formats) {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .send({
            targetAddress: '0x1234567890123456789012345678901234567890',
            reportFormat: format
          });
        
        expect(res.status).toBe(200);
        expect(res.body.reportFormat).toBe(format);
      }
    });
  });
});