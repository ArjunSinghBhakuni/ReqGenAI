const express = require("express");
const { apiKeyAuth } = require("../middleware/auth");
const notificationService = require("../services/notificationService");

const router = express.Router();

// Apply API key authentication to all routes
// No API key authentication for now
// router.use(apiKeyAuth);

// GET /api/notifications - Get all notifications (dashboard app)
router.get("/", async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const notifications = await notificationService.getUserNotifications(
      "system", // Always use system for dashboard app
      parseInt(limit),
      parseInt(skip)
    );

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/notifications/count - Get unread notification count
router.get("/count", async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount("system"); // Always use system for dashboard app

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const notification = await notificationService.markAsRead(
      notificationId,
      userId
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// PUT /api/notifications/:notificationId/archive - Archive notification
router.put("/:notificationId/archive", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const notification = await notificationService.archiveNotification(
      notificationId,
      userId
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error archiving notification:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/notifications - Create a new notification (for testing or manual creation)
router.post("/", async (req, res) => {
  try {
    const {
      projectId,
      type,
      title,
      message,
      priority = "medium",
      actionUrl = null,
      metadata = {},
    } = req.body;

    if (!projectId || !type || !title || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "projectId, type, title, and message are required",
      });
    }

    const notification = await notificationService.createNotification({
      userId: "system", // Always use system for dashboard app
      projectId,
      type,
      title,
      message,
      priority,
      actionUrl,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// DELETE /api/notifications/cleanup - Cleanup old notifications (admin only)
router.delete("/cleanup", async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;

    const result = await notificationService.cleanupOldNotifications(
      parseInt(daysOld)
    );

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
