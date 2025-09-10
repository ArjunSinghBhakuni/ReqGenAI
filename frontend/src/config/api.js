// API Configuration
const getBaseURL = () => {
  return "https://reqgenai-server.onrender.com";
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000,
};

// Default headers (no API key required for now)
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
