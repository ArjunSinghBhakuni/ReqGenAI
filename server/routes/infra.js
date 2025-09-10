const express = require("express");
const { apiKeyAuth } = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();

// Apply API key authentication to all routes
// No API key authentication for now
// router.use(apiKeyAuth);

// GET /api/infra/health
router.get("/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      connection: mongoose.connection.readyState,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
  });
});

// GET /api/infra/status
router.get("/status", async (req, res) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Get database stats
    const dbStats = await mongoose.connection.db.stats();

    res.json({
      message: "Service status retrieved",
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
        database: {
          status: dbStatus,
          collections: dbStats.collections,
          dataSize: Math.round(dbStats.dataSize / 1024 / 1024) + " MB",
          storageSize: Math.round(dbStats.storageSize / 1024 / 1024) + " MB",
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "development",
          port: process.env.PORT || 3000,
        },
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      error: "Failed to get service status",
      message: error.message,
    });
  }
});

// GET /api/infra/metrics
router.get("/metrics", (req, res) => {
  res.json({
    message: "Metrics retrieved successfully",
    data: {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    },
  });
});

module.exports = router;
