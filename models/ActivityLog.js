const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
  },
  projectId: {
    type: String,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "project_created",
      "project_updated",
      "requirements_extracted",
      "brd_generated",
      "blueprint_generated",
      "bitrix24_project_created",
      "task_assigned",
      "user_login",
      "user_logout",
      "api_call",
      "error_occurred",
    ],
  },
  description: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ["success", "error", "warning", "info"],
    default: "info",
  },
  duration: {
    type: Number, // in milliseconds
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes (logId already has unique index from unique: true)
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ projectId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });

// Compound indexes for common queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
