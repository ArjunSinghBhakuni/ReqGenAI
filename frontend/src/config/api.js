// API Configuration
const getBaseURL = () => {
  // Use production URL if deployed on Netlify, otherwise use localhost for development
  if (window.location.hostname === "reqgenai.netlify.app") {
    return "https://req-gen-ai-weld.vercel.app/api";
  }
  // Development fallback
  return "http://localhost:8080/api";
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000,
};

// Default headers (no API key required for now)
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
