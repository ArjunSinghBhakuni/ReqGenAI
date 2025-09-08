const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { logApiRequest, logError } = require("./middleware/logging");
require("dotenv").config();

// Import routes
const inputRoutes = require("./routes/inputs");
const actionRoutes = require("./routes/actions");
const webhookRoutes = require("./routes/webhooks");
const projectRoutes = require("./routes/projects");
const infraRoutes = require("./routes/infra");
const notificationRoutes = require("./routes/notifications");
const requirementRoutes = require("./routes/requirements");
const pdfRoutes = require("./routes/pdf"); // PDF generation routes

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

// Logging
app.use(morgan("combined"));
app.use(logApiRequest);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI environment variable is not set");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// API Routes
app.use("/api/inputs", inputRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/infra", infraRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", requirementRoutes);
app.use("/api/pdf", pdfRoutes); // PDF generation routes

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  app.use(express.static(path.join(__dirname, "frontend/build")));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION || "local",
  });
});

// Simple ping endpoint for basic connectivity test
app.get("/ping", (req, res) => {
  res
    .status(200)
    .json({ message: "pong", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "ReqGenAI API Server",
    version: "1.0.0",
    endpoints: {
      inputs: "/api/inputs",
      actions: "/api/actions",
      webhooks: "/api/webhooks",
      projects: "/api/projects",
      infra: "/api/infra",
      notifications: "/api/notifications",
      requirements: "/api/save-extracted-requirement",
      brd: "/api/save-generated-brd",
      blueprint: "/api/save-blueprint",
      pdf: "/api/pdf", // PDF generation
      processAutoEmail: "/api/process-auto-email", // Process emails from n8n
    },
  });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    const path = require("path");
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
  });
} else {
  // 404 handler for development
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Route not found",
      path: req.originalUrl,
      method: req.method,
    });
  });
}

// Error handling middleware
app.use(logError);
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: "Duplicate field value",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Don't exit in serverless environment
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit in serverless environment
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ReqGenAI API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
});

module.exports = app;
