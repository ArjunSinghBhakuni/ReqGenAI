const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  projectId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "REQUIREMENTS",
      "BRD",
      "BLUEPRINT",
      "DRAFT",
      "PROJECT_UPDATE",
      "SYSTEM",
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["unread", "read", "archived"],
    default: "unread",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  actionUrl: {
    type: String,
    default: null,
  },
  metadata: {
    documentId: String,
    processType: String,
    source: {
      type: String,
      default: "n8n",
    },
    originalData: mongoose.Schema.Types.Mixed,
  },
  readAt: {
    type: Date,
    default: null,
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
notificationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes (notificationId already has unique index from unique: true)
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ projectId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for notification summary
notificationSchema.virtual("summary").get(function () {
  return {
    notificationId: this.notificationId,
    type: this.type,
    title: this.title,
    message: this.message,
    status: this.status,
    priority: this.priority,
    createdAt: this.createdAt,
    actionUrl: this.actionUrl,
  };
});

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function () {
  this.status = "archived";
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, status: "unread" });
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = function (
  userId,
  limit = 50,
  skip = 0
) {
  return this.find({ userId, status: { $ne: "archived" } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model("Notification", notificationSchema);
