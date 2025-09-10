const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema({
  integrationId: {
    type: String,
    required: true,
    unique: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["bitrix24", "n8n", "slack", "email", "webhook"],
  },
  status: {
    type: String,
    enum: ["active", "inactive", "error", "pending"],
    default: "active",
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastSync: {
    type: Date,
  },
  syncCount: {
    type: Number,
    default: 0,
  },
  errorCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    message: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
integrationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
integrationSchema.index({ integrationId: 1 });
integrationSchema.index({ projectId: 1 });
integrationSchema.index({ type: 1 });
integrationSchema.index({ status: 1 });
integrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Integration", integrationSchema);
