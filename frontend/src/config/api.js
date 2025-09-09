// API Configuration
const getBaseURL = () => {
  // Check if we're in production (Netlify deployment)
  if (window.location.hostname === "reqgenai.netlify.app") {
    return "https://req-gen-ai-weld.vercel.app/api";
  }
  
  // Check if we're in development with environment variable
  if (process.env.NODE_ENV === "development" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8080/api";
  }
  
  // Fallback to production URL for any other environment
  return "https://req-gen-ai-weld.vercel.app/api";
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000,
};

// Default headers (no API key required for now)
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};
