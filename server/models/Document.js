const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true,
  },
  project_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["RAW_INPUT", "REQUIREMENTS", "BRD", "BLUEPRINT", "DRAFT"],
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  sourceHash: {
    type: String,
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
documentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes (documentId already has unique index from unique: true)
documentSchema.index({ project_id: 1, type: 1 });
documentSchema.index({ sourceHash: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
