const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { logApiRequest, logError } = require("../middleware/logging");
require("dotenv").config();

// Import routes
const inputRoutes = require("../routes/inputs");
const actionRoutes = require("../routes/actions");
const webhookRoutes = require("../routes/webhooks");
const projectRoutes = require("../routes/projects");
const infraRoutes = require("../routes/infra");
const notificationRoutes = require("../routes/notifications");
const requirementRoutes = require("../routes/requirements");
const pdfRoutes = require("../routes/pdf"); // PDF generation routes
const fileUploadRoutes = require("../routes/fileUpload"); // File upload routes

const app = express();
const PORT = process.env.PORT || 8080;

// Add version for debugging
const APP_VERSION = "1.0.1";
console.log(`ReqGenAI API Server v${APP_VERSION} starting...`);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  "https://reqgenai-frontend.vercel.app/" || "http://localhost:3000",
  "https://reqgenai.netlify.app", // Production frontend
  "http://localhost:3000", // Development
  "http://localhost:3001", // Alternative dev port
  "http://127.0.0.1:3000", // Alternative localhost
  "http://127.0.0.1:3001", // Alternative localhost
];

console.log("CORS Configuration:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(`CORS request from origin: ${origin}`);
      console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log("CORS: Allowing request with no origin");
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log(`CORS: Allowing origin ${origin}`);
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    preflightContinue: false,
  })
);

// Handle preflight requests
app.options("*", cors());

// CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Logging
app.use(morgan("combined"));
app.use(logApiRequest);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || typeof mongoUri !== "string" || mongoUri.trim() === "") {
      console.error("MONGODB_URI environment variable is not set or invalid");
      console.log("App will run without database connection");
      return;
    }

    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("App will run without database connection");
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// Connect to database (only if URI is available and valid)
const mongoUri = process.env.MONGODB_URI;
if (mongoUri && typeof mongoUri === "string" && mongoUri.trim() !== "") {
  console.log("MongoDB URI found, attempting connection...");
  connectDB();
} else {
  console.log("Skipping database connection - MONGODB_URI not set or invalid");
  console.log("MongoDB URI value:", mongoUri);
}

// Database connection status middleware
app.use((req, res, next) => {
  req.dbConnected = mongoose.connection.readyState === 1;
  next();
});

// API Routes
app.use("/api/inputs", inputRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/infra", infraRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", requirementRoutes);
app.use("/api/pdf", pdfRoutes); // PDF generation routes
app.use("/api/file-upload", fileUploadRoutes); // File upload routes

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  app.use(express.static(path.join(__dirname, "frontend/build")));
}

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText =
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[dbStatus] || "unknown";

  res.status(200).json({
    status: "OK",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION || "local",
    database: {
      status: dbStatusText,
      connected: dbStatus === 1,
      uri_configured: !!process.env.MONGODB_URI,
    },
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

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 ReqGenAI API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/`);
  });
}

module.exports = app;
