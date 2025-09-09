const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fileProcessingService = require("../services/fileProcessingService");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".docx", ".pdf", ".ppt", ".pptx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${ext}. Allowed types: ${allowedTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST /api/file-upload/extract-text
router.post("/extract-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        message: "Please select a file to upload",
      });
    }

    const { originalname, filename, path: filePath } = req.file;

    // Check if file type is supported
    if (!fileProcessingService.isSupported(originalname)) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        error: "Unsupported file type",
        message: `File type not supported. Supported types: ${fileProcessingService
          .getSupportedTypes()
          .join(", ")}`,
      });
    }

    // Extract text from file
    const result = await fileProcessingService.extractText(
      filePath,
      originalname
    );

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: "Failed to extract text from file",
      });
    }

    res.json({
      success: true,
      data: {
        filename: originalname,
        fileType: fileProcessingService.getFileType(originalname),
        extractedText: result.text,
        textLength: result.text.length,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/file-upload/supported-types
router.get("/supported-types", (req, res) => {
  res.json({
    success: true,
    data: {
      supportedTypes: fileProcessingService.getSupportedTypes(),
      maxFileSize: "10MB",
    },
  });
});

module.exports = router;
