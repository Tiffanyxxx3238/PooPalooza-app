// constants/API.ts

export const API_CONFIG = {
  // 🔗 請替換為你的實際 API URL
  BASE_URL: 'https://your-flask-api-url.herokuapp.com', // 或你的 API 網址
  ENDPOINTS: {
    TOILETS: '/toilets',
    NEARBY_TOILETS: '/toilets/nearby',
    TOILET_CHECKINS: '/toilet_checkins',
    USERS: '/users',
    ACHIEVEMENTS: '/achievements',
  },
  // 分頁參數
  PAGE_SIZE: 50,
  MAX_NEARBY_DISTANCE: 5000, // 5km 範圍內
  TIMEOUT: 10000, // 10秒超時
};