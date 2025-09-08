// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "/api",
  API_KEY: process.env.REACT_APP_API_KEY || "your-api-key-here",
  TIMEOUT: 10000,
};

// Default headers (no API key required for now)
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
