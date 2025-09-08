// Utility functions for the ReqGenAI frontend

/**
 * Format date to a readable string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get status color for Chakra UI
 * @param {string} status - Status string
 * @returns {string} Color scheme name
 */
export const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "green";
    case "processing":
      return "blue";
    case "failed":
      return "red";
    default:
      return "gray";
  }
};

/**
 * Get status icon for Chakra UI
 * @param {string} status - Status string
 * @returns {string} Icon name
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return "✓";
    case "processing":
      return "⏳";
    case "failed":
      return "✗";
    default:
      return "○";
  }
};

/**
 * Get document type label
 * @param {string} type - Document type
 * @returns {string} Human readable label
 */
export const getDocumentTypeLabel = (type) => {
  switch (type) {
    case "RAW_INPUT":
      return "Raw Input";
    case "REQUIREMENTS":
      return "Extracted Requirements";
    case "BRD":
      return "Business Requirements Document";
    case "BLUEPRINT":
      return "Project Blueprint";
    default:
      return type;
  }
};

/**
 * Get document type color for Chakra UI
 * @param {string} type - Document type
 * @returns {string} Color scheme name
 */
export const getDocumentTypeColor = (type) => {
  switch (type) {
    case "RAW_INPUT":
      return "gray";
    case "REQUIREMENTS":
      return "blue";
    case "BRD":
      return "green";
    case "BLUEPRINT":
      return "purple";
    default:
      return "gray";
  }
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

/**
 * Generate a short ID from UUID
 * @param {string} uuid - Full UUID
 * @returns {string} Short ID (first 8 characters)
 */
export const getShortId = (uuid) => {
  if (!uuid) return "";
  return uuid.substring(0, 8) + "...";
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
