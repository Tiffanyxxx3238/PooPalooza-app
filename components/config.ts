// config.ts
export const API_CONFIG = {
  BASE_URL: 'https://poopalooza-server.onrender.com',
  TIMEOUT: 60000, // 60秒超時，給服務器充足時間啟動
  ENDPOINTS: {
    ASSISTANT: '/api/assistant',
    MODELS: '/api/models/free',
    USAGE: '/api/usage',
    HEALTH: '/api/health'
  }
};