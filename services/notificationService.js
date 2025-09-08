const { v4: uuidv4 } = require("uuid");
const Notification = require("../models/Notification");

class NotificationService {
  constructor() {
    this.defaultUserId = process.env.DEFAULT_USER_ID || "system";
  }

  /**
   * Create a notification for a user
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const {
        userId,
        projectId,
        type,
        title,
        message,
        priority = "medium",
        actionUrl = null,
        metadata = {},
      } = notificationData;

      const notificationId = uuidv4();

      const notification = new Notification({
        notificationId,
        userId: userId || this.defaultUserId,
        projectId,
        type,
        title,
        message,
        priority,
        actionUrl,
        metadata,
      });

      await notification.save();

      console.log(
        `Notification created: ${notificationId} for user: ${userId}`
      );
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Create notification for n8n process completion
   * @param {Object} processData - Process data from n8n
   * @param {string} processType - Type of process (REQUIREMENTS, BRD, BLUEPRINT)
   * @returns {Promise<Object>} Created notification
   */
  async createProcessNotification(processData, processType) {
    try {
      const { project_info, projectId } = processData;
      const projectIdValue = project_info?.id || projectId;

      if (!projectIdValue) {
        throw new Error("Project ID is required for notification");
      }

      const notificationConfig = this.getNotificationConfig(processType);

      const notification = await this.createNotification({
        userId: project_info?.userId || this.defaultUserId,
        projectId: projectIdValue,
        type: processType,
        title: notificationConfig.title,
        message: notificationConfig.message,
        priority: notificationConfig.priority,
        actionUrl: notificationConfig.actionUrl(projectIdValue),
        metadata: {
          documentId: processData.documentId,
          processType,
          source: "n8n",
          originalData: processData,
        },
      });

      return notification;
    } catch (error) {
      console.error("Error creating process notification:", error);
      throw error;
    }
  }

  /**
   * Get notification configuration for different process types
   * @param {string} processType - Type of process
   * @returns {Object} Notification configuration
   */
  getNotificationConfig(processType) {
    const configs = {
      REQUIREMENTS: {
        title: "✅ Requirements Extracted",
        message:
          "Your project requirements have been successfully extracted and are ready for review.",
        priority: "high",
        actionUrl: (projectId) => `/project/${projectId}`,
      },
      BRD: {
        title: "📄 BRD Generated",
        message:
          "Your Business Requirements Document has been generated and is ready for review.",
        priority: "high",
        actionUrl: (projectId) => `/project/${projectId}`,
      },
      BLUEPRINT: {
        title: "🏗️ Blueprint Created",
        message:
          "Your technical blueprint has been created and is ready for implementation.",
        priority: "high",
        actionUrl: (projectId) => `/project/${projectId}`,
      },
      DRAFT: {
        title: "📝 Draft Document Created",
        message: "A new draft document has been created for your project.",
        priority: "medium",
        actionUrl: (projectId) => `/project/${projectId}`,
      },
    };

    return (
      configs[processType] || {
        title: "✅ Process Completed",
        message: "Your process has been completed successfully.",
        priority: "medium",
        actionUrl: (projectId) => `/project/${projectId}`,
      }
    );
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId || this.defaultUserId);
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of notifications to fetch
   * @param {number} skip - Number of notifications to skip
   * @returns {Promise<Array>} Array of notifications
   */
  async getUserNotifications(userId, limit = 50, skip = 0) {
    try {
      return await Notification.getUserNotifications(
        userId || this.defaultUserId,
        limit,
        skip
      );
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        notificationId,
        userId: userId || this.defaultUserId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return await notification.markAsRead();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { userId: userId || this.defaultUserId, status: "unread" },
        { status: "read", readAt: new Date() }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Archive notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        notificationId,
        userId: userId || this.defaultUserId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return await notification.archive();
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup)
   * @param {number} daysOld - Number of days old to delete
   * @returns {Promise<Object>} Delete result
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await Notification.deleteMany({
        status: "archived",
        updatedAt: { $lt: cutoffDate },
      });
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
