import axios from "axios";
import { API_CONFIG, DEFAULT_HEADERS } from "../config/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const requirementAPI = {
  // Create new requirement from manual input
  createManual: (content, projectData = {}) =>
    api.post("/inputs/manual", { content, ...projectData }),

  // Create new requirement from transcript
  createTranscript: (content, source) =>
    api.post("/inputs/transcript", { content, source }),

  // Create new requirement from file
  createFile: (filename, text) => api.post("/inputs/file", { filename, text }),

  // Get all requirements (projects)
  getAll: (page = 1, limit = 10, status) =>
    api.get("/projects", { params: { page, limit, status } }),

  // Get requirement by ID
  getById: (projectId) => api.get(`/projects/${projectId}`),

  // Get document by ID
  getDocument: (projectId, documentId) =>
    api.get(`/projects/${projectId}/documents/${documentId}`),
};

// New API endpoints for n8n integration
export const n8nAPI = {
  // Save extracted requirements
  saveExtractedRequirement: (data) =>
    api.post("/save-extracted-requirement", data),

  // Save generated BRD
  saveGeneratedBRD: (data) => api.post("/save-generated-brd", data),

  // Save blueprint
  saveBlueprint: (data) => api.post("/save-blueprint", data),
};

// Notification API endpoints
export const notificationAPI = {
  // Get all notifications (dashboard app)
  getAll: () => api.get(`/notifications`),

  // Get unread count
  getUnreadCount: () => api.get(`/notifications/count`),

  // Mark notification as read
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () => api.put("/notifications/read-all"),

  // Archive notification
  archive: (notificationId) =>
    api.put(`/notifications/${notificationId}/archive`),

  // Create notification
  create: (data) => api.post("/notifications", data),

  // Cleanup old notifications
  cleanup: () => api.delete("/notifications/cleanup"),
};

// PDF API endpoints
export const pdfAPI = {
  // Generate PDF for a specific document
  generateDocumentPDF: (projectId, documentId) =>
    api.post(`/pdf/document/${projectId}/${documentId}`),

  // Generate project summary PDF
  generateProjectPDF: (projectId) => api.post(`/pdf/project/${projectId}`),

  // Download PDF file
  downloadPDF: (filename) => api.get(`/pdf/download/${filename}`),
};

// Project API endpoints
export const projectAPI = {
  // Update project data
  updateProject: (projectId, data) => api.put(`/projects/${projectId}`, data),

  // Update document
  updateDocument: (projectId, documentId, data) =>
    api.put(`/projects/${projectId}/documents/${documentId}`, data),

  // Create new version of document
  createDocumentVersion: (projectId, documentId, data) =>
    api.post(`/projects/${projectId}/documents/${documentId}/version`, data),

  // Generate next step (trigger n8n workflow)
  generateNextStep: (projectId, stepType, data) =>
    api.post(`/actions/generate/${projectId}/${stepType}`, data),

  // Convert JSON to Markdown
  convertJsonToMarkdown: (jsonContent, documentType) =>
    api.post("/actions/convert-json-to-markdown", {
      jsonContent,
      documentType,
    }),

  // Create notification
  createNotification: (notificationData) =>
    api.post("/notifications", notificationData),
};

export const actionAPI = {
  // Extract requirements
  extractRequirements: (projectId, metadata = {}) =>
    api.post(`/actions/extract/${projectId}`, { metadata }),

  // Generate BRD
  generateBRD: (projectId, metadata = {}) =>
    api.post(`/actions/brd/${projectId}`, { metadata }),

  // Generate blueprint
  generateBlueprint: (projectId, metadata = {}) =>
    api.post(`/actions/blueprint/${projectId}`, { metadata }),

  // Create Bitrix24 project
  createBitrix24Project: (projectId, assignToUserId = 1) =>
    api.post(`/actions/bitrix24/create-project/${projectId}`, {
      assignToUserId,
    }),

  // Get Bitrix24 task
  getBitrix24Task: (taskId) => api.get(`/actions/bitrix24/task/${taskId}`),

  // Assign Bitrix24 task
  assignBitrix24Task: (taskId, userId, comment) =>
    api.post(`/actions/bitrix24/assign/${taskId}`, { userId, comment }),

  // Generate HTML view for BRD or Blueprint
  generateView: (projectId, stage) =>
    api.post(`/actions/generate-view/${projectId}`, { stage }),

  // Generate PDF from HTML view
  generatePDFFromHTMLView: (projectId, stage, htmlContent, projectName) =>
    api.post(`/pdf/generate-from-html-view`, {
      projectId,
      stage,
      htmlContent,
      projectName,
    }),
};

export const infraAPI = {
  // Get system health
  getHealth: () => api.get("/infra/health"),

  // Get system status
  getStatus: () => api.get("/infra/status"),
};

export { api };
export default api;
