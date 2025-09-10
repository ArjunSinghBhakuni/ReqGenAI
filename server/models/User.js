const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "project_manager", "developer", "designer", "qa", "client"],
    default: "client",
  },
  department: {
    type: String,
    trim: true,
    default: "",
  },
  skills: {
    type: [String],
    default: [],
  },
  bitrix24UserId: {
    type: String,
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
    },
    theme: { type: String, default: "light" },
    language: { type: String, default: "en" },
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  lastLogin: {
    type: Date,
  },
  totalProjects: {
    type: Number,
    default: 0,
  },
  completedTasks: {
    type: Number,
    default: 0,
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
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
userSchema.index({ userId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ bitrix24UserId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual("profile").get(function () {
  return {
    userId: this.userId,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    skills: this.skills,
    status: this.status,
    totalProjects: this.totalProjects,
    completedTasks: this.completedTasks,
  };
});

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Method to increment project count
userSchema.methods.incrementProjectCount = function () {
  this.totalProjects += 1;
  return this.save();
};

// Method to increment completed tasks
userSchema.methods.incrementCompletedTasks = function () {
  this.completedTasks += 1;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
