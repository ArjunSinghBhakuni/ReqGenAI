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

// POST /api/process-auto-email - Process email from n8n and create project
router.post("/process-auto-email", async (req, res) => {
  try {
    console.log("=== N8N EMAIL WEBHOOK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Raw Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Request Body Type:", typeof req.body);
    console.log(
      "Request Body Length:",
      req.body ? Object.keys(req.body).length : 0
    );

    // Handle new n8n payload format (array with output object)
    let emailData;
    if (Array.isArray(req.body) && req.body.length > 0 && req.body[0].output) {
      emailData = req.body[0].output;
      console.log(
        "Using NEW n8n format - extracted emailData:",
        JSON.stringify(emailData, null, 2)
      );
    } else {
      // Fallback to old format
      emailData = req.body;
      console.log(
        "Using OLD format - emailData:",
        JSON.stringify(emailData, null, 2)
      );
    }

    const { source, subject, content, metadata, html, messageId } = emailData;
    console.log("Extracted fields:");
    console.log("- source:", source);
    console.log("- subject:", subject);
    console.log("- content length:", content ? content.length : 0);
    console.log("- metadata:", JSON.stringify(metadata, null, 2));
    console.log("- html length:", html ? html.length : 0);
    console.log("- messageId:", messageId);
    console.log("=== END N8N EMAIL WEBHOOK LOG ===");

    // Validate required fields
    if (!source || !subject || !content) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "source, subject, and content are required",
      });
    }

    // Generate unique project ID
    const projectId = uuidv4();

    // Extract sender information from metadata
    const senderEmail = metadata?.sender || "unknown@example.com";
    const receivedAt = metadata?.received_at || new Date().toISOString();

    // Create project name from subject (truncate if too long)
    const projectName =
      subject.length > 100 ? subject.substring(0, 100) + "..." : subject;

    // Create new project
    const project = new Project({
      project_id: projectId,
      name: projectName,
      description:
        content.substring(0, 500) + (content.length > 500 ? "..." : ""), // Truncate description
      source: "email",
      status: "created",
      totalDocuments: 0,
      inputType: "email",
      input: {
        source,
        subject,
        content,
        metadata,
        // Store HTML content separately for display
        htmlContent: html || null,
        messageId: messageId || null,
      },
      metadata: {
        emailMetadata: metadata,
        originalSubject: subject,
        originalContent: content,
        receivedAt: receivedAt,
        senderEmail: senderEmail,
        hasHtmlContent: !!html,
        messageId: messageId || null,
      },
      organizationName: extractOrganizationFromEmail(senderEmail),
      contactPersonName: extractNameFromEmail(senderEmail),
      contactEmail: senderEmail,
    });

    await project.save();

    // Create RAW_INPUT document for requirement extraction
    try {
      const rawInputDocument = new Document({
        documentId: uuidv4(),
        project_id: projectId,
        type: "RAW_INPUT",
        content: {
          source: "email",
          subject: subject,
          content: content,
          metadata: metadata,
          htmlContent: html || null,
          messageId: messageId || null,
          receivedAt: receivedAt,
          senderEmail: senderEmail,
        },
        version: 1,
        sourceHash: `email_${Date.now()}_${projectId}`,
        metadata: {
          source: "email",
          originalFormat: "email",
          hasHtmlContent: !!html,
          messageId: messageId || null,
        },
      });

      await rawInputDocument.save();

      // Update project document count
      await Project.findOneAndUpdate(
        { project_id: projectId },
        {
          $inc: { totalDocuments: 1 },
          updatedAt: new Date(),
        }
      );

      console.log(`RAW_INPUT document created for project ${projectId}`);
    } catch (documentError) {
      console.error("Failed to create RAW_INPUT document:", documentError);
      // Don't fail the API if document creation fails
    }

    // Create notification for new email requirement
    try {
      await notificationService.createNotification({
        userId: "system",
        projectId: projectId,
        type: "PROJECT_UPDATE",
        title: "📧 New Requirement Received from Email",
        message: `New requirement received from ${senderEmail}: ${subject}`,
        priority: "high",
        actionUrl: `/project/${projectId}`,
        metadata: {
          source: "email",
          senderEmail: senderEmail,
          subject: subject,
          originalData: emailData,
          hasHtmlContent: !!html,
          messageId: messageId || null,
        },
      });
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the API if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: "Email processed and project created successfully",
      project: {
        project_id: projectId,
        name: projectName,
        status: "created",
        source: "email",
        createdAt: project.createdAt,
        hasRawInput: true,
      },
    });
  } catch (error) {
    console.error("Process auto-email error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Helper function to extract organization name from email
function extractOrganizationFromEmail(email) {
  if (!email || !email.includes("@")) return "Unknown Organization";

  const domain = email.split("@")[1];
  if (!domain) return "Unknown Organization";

  // Remove common domain extensions and return the main part
  const orgName = domain.split(".")[0];
  return orgName.charAt(0).toUpperCase() + orgName.slice(1);
}

// Helper function to extract name from email
function extractNameFromEmail(email) {
  if (!email || !email.includes("@")) return "Unknown Contact";

  const localPart = email.split("@")[0];
  if (!localPart) return "Unknown Contact";

  // Try to extract name from common patterns
  if (localPart.includes(".")) {
    const parts = localPart.split(".");
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

module.exports = router;
