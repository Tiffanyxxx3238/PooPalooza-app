// config.ts - Replace your entire config.ts file with this

// Keep your original Heroku URL for poop records
const API_URL = 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com';

// Add the Render URL for assistant
const ASSISTANT_API_URL = 'https://poopalooza-server.onrender.com';

// Export the API configuration
export const API_CONFIG = {
  BASE_URL: API_URL,
  ASSISTANT_URL: ASSISTANT_API_URL,
  ENDPOINTS: {
    POOP_RECORDS: '/poop-records',
    ASSISTANT: '/assistant',
  },
  TIMEOUT: 30000,
};

// Keep the default export for backward compatibility
export default API_URL;