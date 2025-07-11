const request = require('supertest');
const app = require('../server');

describe('PDF Merger API', () => {
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('POST /api/auth/session', () => {
    it('should generate a session ID', async () => {
      const response = await request(app)
        .post('/api/auth/session')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });
  });

  describe('GET /api/pdf/files', () => {
    it('should return empty files list initially', async () => {
      const response = await request(app)
        .get('/api/pdf/files')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toEqual([]);
    });
  });

  describe('GET /api/pdf/stats', () => {
    it('should return PDF processing stats', async () => {
      const response = await request(app)
        .get('/api/pdf/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toBeDefined();
      expect(response.body.data.operations).toBeDefined();
    });
  });
});

// Close the server after tests
afterAll(async () => {
  if (app.server) {
    await app.server.close();
  }
});
