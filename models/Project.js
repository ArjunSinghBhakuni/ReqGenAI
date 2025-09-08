const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  source: {
    type: String,
    required: true,
    enum: ["manual", "transcript", "file", "email", "webhook"],
  },
  status: {
    type: String,
    default: "created",
    enum: ["created", "processing", "completed", "failed"],
  },
  totalDocuments: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  inputType: {
    type: String,
    enum: ["manual", "transcript", "file", "email", "webhook"],
    default: "manual",
  },
  // Organization and Contact Information
  organizationName: {
    type: String,
    default: "",
  },
  contactPersonName: {
    type: String,
    default: "",
  },
  contactEmail: {
    type: String,
    default: "",
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
projectSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes (project_id already has unique index from unique: true)
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
