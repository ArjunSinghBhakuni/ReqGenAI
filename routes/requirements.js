const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Project = require("../models/Project");
const Document = require("../models/Document");
const notificationService = require("../services/notificationService");

const router = express.Router();

// No API key authentication for now

// Helper function to save document
const saveDocument = async (projectId, type, content, sourceHash = null) => {
  try {
    // Check if project exists, create minimal project if not
    let project = await Project.findOne({ project_id: projectId });
    if (!project) {
      project = new Project({
        project_id: projectId,
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
      project_id: projectId,
      type,
      content,
      ...(sourceHash && { sourceHash }),
    });

    await document.save();

    // Update project document count
    await Project.findOneAndUpdate(
      { project_id: projectId },
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

// POST /api/save-blueprint - Save generated blueprint from n8n
router.post("/save-blueprint", async (req, res) => {
  try {
    const { project_id, blueprint, preferred_format } = req.body;

    if (!project_id || !blueprint) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "project_id and blueprint are required",
      });
    }

    // Create the blueprint document content
    const blueprintContent = {
      project_id,
      blueprint,
      preferred_format: preferred_format || "Markdown",
      timestamp: new Date().toISOString(),
      source: "n8n_blueprint_generation",
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

    res.status(201).json({
      success: true,
      message: "Blueprint generated and saved successfully",
      documentId: result.documentId,
      projectId: project_id,
    });
  } catch (error) {
    console.error("Save blueprint error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/save-generated-brd - Save generated BRD from n8n
router.post("/save-generated-brd", async (req, res) => {
  try {
    const { project_id, brd } = req.body;

    if (!project_id || !brd) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "project_id and brd are required",
      });
    }

    // Create the BRD document content
    const brdContent = {
      project_id,
      brd,
      timestamp: new Date().toISOString(),
      source: "n8n_brd_generation",
    };

    const result = await saveDocument(project_id, "BRD", brdContent);

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

    res.status(201).json({
      success: true,
      message: "BRD generated and saved successfully",
      documentId: result.documentId,
      projectId: project_id,
    });
  } catch (error) {
    console.error("Save generated BRD error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/save-extracted-requirement - Save extracted requirements from n8n
router.post("/save-extracted-requirement", async (req, res) => {
  try {
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
      source: "n8n_extraction",
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

    res.status(201).json({
      success: true,
      message: "Requirements extracted and saved successfully",
      documentId: result.documentId,
      projectId: projectId,
    });
  } catch (error) {
    console.error("Save extracted requirement error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
