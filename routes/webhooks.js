const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { apiKeyAuth } = require("../middleware/auth");
const Project = require("../models/Project");
const Document = require("../models/Document");
const notificationService = require("../services/notificationService");

const router = express.Router();

// Apply API key authentication to all routes
// No API key authentication for now
// router.use(apiKeyAuth);

// Helper function to save document
const saveDocument = async (projectId, type, content, sourceHash = null) => {
  try {
    // Check if project exists, create minimal project if not
    let project = await Project.findOne({ projectId });
    if (!project) {
      project = new Project({
        projectId,
        name: `Project ${projectId.substring(0, 8)}`,
        description: "Auto-created from webhook",
        source: "webhook",
        status: "created",
        totalDocuments: 0,
      });
      await project.save();
    }

    // Generate document ID
    const documentId = uuidv4();

    // Create document
    const document = new Document({
      documentId,
      projectId,
      type,
      content,
      ...(sourceHash && { sourceHash }),
    });

    await document.save();

    // Update project document count
    await Project.findOneAndUpdate(
      { projectId },
      {
        $inc: { totalDocuments: 1 },
        status: "completed",
        updatedAt: new Date(),
      }
    );

    return {
      success: true,
      documentId,
    };
  } catch (error) {
    console.error("Error saving document:", error);
    throw new Error("Failed to save document");
  }
};

// POST /api/webhooks/requirements
router.post("/requirements", async (req, res) => {
  try {
    // Handle n8n response format
    const { project_info, requirements, constraints, preferred_format } =
      req.body;

    // Extract project ID from project_info
    const projectId = project_info?.id;

    if (!projectId || !requirements) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "project_info.id and requirements are required",
      });
    }

    // Create the requirements document content
    const requirementsContent = {
      project_info,
      requirements,
      constraints: constraints || [],
      preferred_format: preferred_format || "Markdown",
      timestamp: new Date().toISOString(),
    };

    const result = await saveDocument(
      projectId,
      "REQUIREMENTS",
      requirementsContent
    );

    // Create notification for requirements extraction completion
    try {
      await notificationService.createProcessNotification(
        {
          ...req.body,
          documentId: result.documentId,
        },
        "REQUIREMENTS"
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the webhook if notification creation fails
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Requirements webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/webhooks/brd
router.post("/brd", async (req, res) => {
  try {
    // Handle n8n BRD response format (text response)
    const { project_info, brd_text, format = "Markdown" } = req.body;

    // Extract project ID from project_info
    const projectId = project_info?.id;

    if (!projectId || !brd_text) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "project_info.id and brd_text are required",
      });
    }

    // Create the BRD document content
    const brdContent = {
      text: brd_text,
      format: format,
      project_info: project_info,
      generatedAt: new Date().toISOString(),
    };

    const result = await saveDocument(projectId, "BRD", brdContent);

    // Create notification for BRD generation completion
    try {
      await notificationService.createProcessNotification(
        {
          ...req.body,
          documentId: result.documentId,
        },
        "BRD"
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the webhook if notification creation fails
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("BRD webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/webhooks/blueprint
router.post("/blueprint", async (req, res) => {
  try {
    // Handle n8n blueprint response format
    const { project_id, blueprint, preferred_format } = req.body;

    if (!project_id || !blueprint) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "project_id and blueprint are required",
      });
    }

    // Create the blueprint document content
    const blueprintContent = {
      blueprint: blueprint,
      project_id: project_id,
      preferred_format: preferred_format || "Markdown",
      generatedAt: new Date().toISOString(),
    };

    const result = await saveDocument(
      project_id,
      "BLUEPRINT",
      blueprintContent
    );

    // Create notification for blueprint generation completion
    try {
      await notificationService.createProcessNotification(
        {
          ...req.body,
          documentId: result.documentId,
        },
        "BLUEPRINT"
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the webhook if notification creation fails
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Blueprint webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/webhooks/draft
router.post("/draft", async (req, res) => {
  try {
    const { projectId, draft, timestamp } = req.body;

    if (!projectId || !draft) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "projectId and draft are required",
      });
    }

    const content = {
      ...draft,
      timestamp: timestamp || new Date().toISOString(),
    };

    const result = await saveDocument(projectId, "DRAFT", content);

    // Create notification for draft creation completion
    try {
      await notificationService.createProcessNotification(
        {
          ...req.body,
          documentId: result.documentId,
        },
        "DRAFT"
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the webhook if notification creation fails
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Draft webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
