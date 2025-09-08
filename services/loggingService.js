const { v4: uuidv4 } = require("uuid");
const ActivityLog = require("../models/ActivityLog");

class LoggingService {
  constructor() {
    this.isEnabled = process.env.LOGGING_ENABLED !== "false";
  }

  async logActivity({
    userId = null,
    projectId = null,
    action,
    description,
    details = {},
    status = "info",
    duration = null,
    req = null,
  }) {
    if (!this.isEnabled) return;

    try {
      const logData = {
        logId: uuidv4(),
        userId,
        projectId,
        action,
        description,
        details,
        status,
        duration,
        ...(req && {
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        }),
      };

      const log = new ActivityLog(logData);
      await log.save();

      // Also log to console for development
      if (process.env.NODE_ENV === "development") {
        console.log(`[${status.toUpperCase()}] ${action}: ${description}`, {
          userId,
          projectId,
          duration: duration ? `${duration}ms` : null,
        });
      }

      return log;
    } catch (error) {
      console.error("Failed to log activity:", error.message);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async logProjectActivity(
    projectId,
    action,
    description,
    details = {},
    req = null
  ) {
    return this.logActivity({
      projectId,
      action,
      description,
      details,
      req,
    });
  }

  async logUserActivity(userId, action, description, details = {}, req = null) {
    return this.logActivity({
      userId,
      action,
      description,
      details,
      req,
    });
  }

  async logApiCall(req, res, duration) {
    const action = "api_call";
    const description = `${req.method} ${req.originalUrl}`;
    const details = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
    };

    return this.logActivity({
      action,
      description,
      details,
      status: res.statusCode >= 400 ? "error" : "success",
      duration,
      req,
    });
  }

  async logError(error, context = {}) {
    const action = "error_occurred";
    const description = error.message || "Unknown error occurred";
    const details = {
      error: error.message,
      stack: error.stack,
      ...context,
    };

    return this.logActivity({
      action,
      description,
      details,
      status: "error",
    });
  }

  async logIntegrationActivity(
    projectId,
    integrationType,
    action,
    description,
    details = {}
  ) {
    return this.logActivity({
      projectId,
      action: `integration_${action}`,
      description: `[${integrationType.toUpperCase()}] ${description}`,
      details: {
        integrationType,
        ...details,
      },
    });
  }

  // Get logs with filtering
  async getLogs({
    userId = null,
    projectId = null,
    action = null,
    status = null,
    startDate = null,
    endDate = null,
    limit = 100,
    skip = 0,
  } = {}) {
    try {
      const filter = {};

      if (userId) filter.userId = userId;
      if (projectId) filter.projectId = projectId;
      if (action) filter.action = action;
      if (status) filter.status = status;

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const logs = await ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await ActivityLog.countDocuments(filter);

      return {
        success: true,
        logs,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Failed to get logs:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get project activity summary
  async getProjectActivitySummary(projectId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const summary = await ActivityLog.aggregate([
        {
          $match: {
            projectId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastOccurrence: { $max: "$createdAt" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return {
        success: true,
        summary,
        period: `${days} days`,
      };
    } catch (error) {
      console.error("Failed to get project activity summary:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get user activity summary
  async getUserActivitySummary(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const summary = await ActivityLog.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
            lastOccurrence: { $max: "$createdAt" },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return {
        success: true,
        summary,
        period: `${days} days`,
      };
    } catch (error) {
      console.error("Failed to get user activity summary:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new LoggingService();
