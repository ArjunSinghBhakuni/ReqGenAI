const express = require("express");
const axios = require("axios");
const { apiKeyAuth } = require("../middleware/auth");
const Project = require("../models/Project");
const Document = require("../models/Document");
const requirementExtractionService = require("../services/requirementExtraction");
const brdGenerationService = require("../services/brdGeneration");
const requirementBlueprintService = require("../services/requirementBlueprint");
const bitrix24IntegrationService = require("../services/bitrix24Integration");

const router = express.Router();

// No API key authentication for now
// router.use(apiKeyAuth);

// Helper function to forward request to n8n
const forwardToN8N = async (url, payload) => {
  try {
    const response = await axios.post(url, payload, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("n8n request failed:", error.message);
    return { success: false, error: error.message };
  }
};

// POST /api/actions/extract/:projectId
router.post("/extract/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { metadata = {} } = req.body;

    // Check if project exists
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get the latest raw input document
    const rawInputDoc = await Document.findOne({
      project_id: projectId,
      type: "RAW_INPUT",
    }).sort({ createdAt: -1 });

    console.log(`Found latest RAW_INPUT document for project ${projectId}:`, {
      documentId: rawInputDoc?.documentId,
      createdAt: rawInputDoc?.createdAt,
      version: rawInputDoc?.version,
    });

    if (!rawInputDoc) {
      return res.status(404).json({
        error: "Raw input not found",
        message: `No raw input document found for project ${projectId}`,
      });
    }

    // Update project status to processing
    await Project.findOneAndUpdate(
      { project_id: projectId },
      { status: "processing", updatedAt: new Date() }
    );

    // Prepare payload for N8N requirement extraction webhook
    let inputText;

    // Check if this is an email project - if so, send only the content field
    if (project.source === "email" && rawInputDoc.content.content) {
      inputText = rawInputDoc.content.content;
    } else {
      // For other sources, extract the text content
      inputText = rawInputDoc.content.text || rawInputDoc.content;
    }

    const n8nPayload = {
      project_id: projectId,
      input: inputText,
    };

    console.log(`Calling N8N requirement extraction for project: ${projectId}`);
    console.log("Payload:", n8nPayload);

    // Call N8N requirement extraction webhook
    const n8nResult = await forwardToN8N(
      process.env.N8N_REQUIREMENT_EXTRACTION_URL,
      n8nPayload
    );

    if (n8nResult.success) {
      res.json({
        success: true,
        message: "Requirement extraction initiated successfully",
        project_id: projectId,
        n8nResponse: n8nResult.data,
      });
    } else {
      // Update project status back to created if n8n call failed
      await Project.findOneAndUpdate(
        { project_id: projectId },
        { status: "created", updatedAt: new Date() }
      );

      res.status(500).json({
        success: false,
        error: "Failed to initiate requirement extraction",
        details: n8nResult.error,
      });
    }
  } catch (error) {
    console.error("Extract action error:", error);

    // Update project status back to created if there was an error
    try {
      await Project.findOneAndUpdate(
        { project_id: req.params.projectId },
        { status: "created", updatedAt: new Date() }
      );
    } catch (updateError) {
      console.error("Failed to update project status:", updateError);
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/actions/brd/:projectId
router.post("/brd/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { metadata = {} } = req.body;

    // Check if project exists
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get the latest requirements document
    const requirementsDoc = await Document.findOne({
      project_id: projectId,
      type: "REQUIREMENTS",
    }).sort({ createdAt: -1 });

    console.log(
      `Found latest REQUIREMENTS document for project ${projectId}:`,
      {
        documentId: requirementsDoc?.documentId,
        createdAt: requirementsDoc?.createdAt,
        version: requirementsDoc?.version,
      }
    );

    if (!requirementsDoc) {
      return res.status(404).json({
        error: "Requirements not found",
        message: `No requirements document found for project ${projectId}. Please extract requirements first.`,
      });
    }

    // Update project status to processing
    await Project.findOneAndUpdate(
      { project_id: projectId },
      { status: "processing", updatedAt: new Date() }
    );

    // Prepare payload for N8N BRD generation webhook
    const n8nPayload = {
      project_id: projectId,
      requirements: requirementsDoc.content,
      project_name: project.name,
      organization_name: project.organizationName,
    };

    console.log(`Calling N8N BRD generation for project: ${projectId}`);
    console.log("Payload:", n8nPayload);

    // Call N8N BRD generation webhook
    const n8nResult = await forwardToN8N(
      process.env.N8N_BRD_GENERATION_URL,
      n8nPayload
    );

    if (n8nResult.success) {
      res.json({
        success: true,
        message: "BRD generation initiated successfully",
        project_id: projectId,
        n8nResponse: n8nResult.data,
      });
    } else {
      // Update project status back to created if n8n call failed
      await Project.findOneAndUpdate(
        { project_id: projectId },
        { status: "created", updatedAt: new Date() }
      );

      res.status(500).json({
        success: false,
        error: "Failed to initiate BRD generation",
        details: n8nResult.error,
      });
    }
  } catch (error) {
    console.error("BRD action error:", error);

    // Update project status back to created if there was an error
    try {
      await Project.findOneAndUpdate(
        { project_id: req.params.projectId },
        { status: "created", updatedAt: new Date() }
      );
    } catch (updateError) {
      console.error("Failed to update project status:", updateError);
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/actions/blueprint/:projectId
router.post("/blueprint/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { metadata = {} } = req.body;

    // Check if project exists
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get the latest BRD document
    const brdDoc = await Document.findOne({
      project_id: projectId,
      type: "BRD",
    }).sort({ createdAt: -1 });

    console.log(`Found latest BRD document for project ${projectId}:`, {
      documentId: brdDoc?.documentId,
      createdAt: brdDoc?.createdAt,
      version: brdDoc?.version,
    });

    if (!brdDoc) {
      return res.status(404).json({
        error: "BRD not found",
        message: `No BRD document found for project ${projectId}. Please generate BRD first.`,
      });
    }

    // Update project status to processing
    await Project.findOneAndUpdate(
      { project_id: projectId },
      { status: "processing", updatedAt: new Date() }
    );

    // Prepare payload for N8N Blueprint generation webhook
    const n8nPayload = {
      project_id: projectId,
      brd: brdDoc.content,
      project_name: project.name,
      organization_name: project.organizationName,
    };

    console.log(`Calling N8N Blueprint generation for project: ${projectId}`);
    console.log("Payload:", n8nPayload);

    // Call N8N Blueprint generation webhook
    const n8nResult = await forwardToN8N(
      process.env.N8N_REQUIREMENT_BLUEPRINT_URL,
      n8nPayload
    );

    if (n8nResult.success) {
      res.json({
        success: true,
        message: "Blueprint generation initiated successfully",
        project_id: projectId,
        n8nResponse: n8nResult.data,
      });
    } else {
      // Update project status back to created if n8n call failed
      await Project.findOneAndUpdate(
        { project_id: projectId },
        { status: "created", updatedAt: new Date() }
      );

      res.status(500).json({
        success: false,
        error: "Failed to initiate Blueprint generation",
        details: n8nResult.error,
      });
    }
  } catch (error) {
    console.error("Blueprint action error:", error);

    // Update project status back to created if there was an error
    try {
      await Project.findOneAndUpdate(
        { project_id: req.params.projectId },
        { status: "created", updatedAt: new Date() }
      );
    } catch (updateError) {
      console.error("Failed to update project status:", updateError);
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/actions/bitrix24/create-project/:projectId
router.post("/bitrix24/create-project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { assignToUserId = 1 } = req.body; // Default user ID, can be customized

    // Check if project exists
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get the latest blueprint document
    const blueprintDoc = await Document.findOne({
      project_id: projectId,
      type: "BLUEPRINT",
    }).sort({ createdAt: -1 });

    console.log(`Found latest BLUEPRINT document for project ${projectId}:`, {
      documentId: blueprintDoc?.documentId,
      createdAt: blueprintDoc?.createdAt,
      version: blueprintDoc?.version,
    });

    if (!blueprintDoc) {
      return res.status(404).json({
        error: "Blueprint not found",
        message: `No blueprint document found for project ${projectId}. Please generate blueprint first.`,
      });
    }

    console.log(
      `Creating Bitrix24 project from blueprint for project: ${projectId}`
    );

    // Create project in Bitrix24
    const projectResult = await bitrix24IntegrationService.createProject(
      blueprintDoc.content
    );

    if (!projectResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to create Bitrix24 project",
        details: projectResult.error,
      });
    }

    // Create tasks from blueprint
    const tasksResult =
      await bitrix24IntegrationService.createTasksFromBlueprint(
        projectResult.groupId,
        blueprintDoc.content
      );

    // Update project with Bitrix24 project information
    await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        metadata: {
          ...project.metadata,
          bitrix24GroupId: projectResult.groupId,
          bitrix24ProjectName: projectResult.projectName,
          bitrix24Created: true,
          bitrix24CreatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Bitrix24 project and tasks created successfully",
      bitrix24: {
        groupId: projectResult.groupId,
        projectName: projectResult.projectName,
        tasks: tasksResult.tasks || [],
        totalTasks: tasksResult.totalCreated || 0,
      },
      project: {
        project_id: projectId,
        name: project.name,
        status: project.status,
      },
    });
  } catch (error) {
    console.error("Bitrix24 project creation error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/actions/bitrix24/task/:taskId
router.get("/bitrix24/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskResult = await bitrix24IntegrationService.getTask(taskId);

    if (!taskResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to get Bitrix24 task",
        details: taskResult.error,
      });
    }

    res.json({
      success: true,
      task: taskResult.task,
    });
  } catch (error) {
    console.error("Bitrix24 get task error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/actions/bitrix24/assign/:taskId
router.post("/bitrix24/assign/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, comment } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
        message: "Please provide userId to assign the task",
      });
    }

    // Update task assignment in Bitrix24
    const updateData = {
      fields: {
        RESPONSIBLE_ID: userId,
        ...(comment && { COMMENTS: comment }),
      },
    };

    const response = await axios.post(
      `${
        process.env.BITRIX24_WEBHOOK_URL ||
        "https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/"
      }tasks.task.update`,
      {
        taskId: taskId,
        ...updateData,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data.result) {
      res.json({
        success: true,
        message: "Task assigned successfully",
        task: response.data.result.task,
      });
    } else {
      throw new Error(
        response.data.error_description || "Failed to assign task"
      );
    }
  } catch (error) {
    console.error("Bitrix24 task assignment error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Convert JSON to Markdown using n8n
router.post("/convert-json-to-markdown", async (req, res) => {
  try {
    const { jsonContent, documentType } = req.body;

    if (!jsonContent) {
      return res.status(400).json({
        success: false,
        error: "JSON content is required",
        message: "Please provide JSON content to convert",
      });
    }

    // Here you would call your n8n webhook for JSON to Markdown conversion
    // For now, we'll simulate the conversion
    console.log("Converting JSON to Markdown:", { jsonContent, documentType });

    // Simulate the conversion process
    const markdownContent = convertJsonToMarkdown(jsonContent, documentType);

    res.json({
      success: true,
      message: "JSON converted to Markdown successfully",
      markdownContent,
      originalJson: jsonContent,
    });
  } catch (error) {
    console.error("JSON to Markdown conversion error:", error);
    res.status(500).json({
      success: false,
      error: "Conversion failed",
      message: error.message,
    });
  }
});

// Convert to Document endpoint (calls n8n, generates professional document, stores in S3)
router.post("/convert-to-document", async (req, res) => {
  try {
    const { projectId, documentId, documentType, content, projectName } =
      req.body;

    console.log("Received request:", {
      projectId,
      documentId,
      documentType,
      content: typeof content,
    });

    if (!projectId || !documentType || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: projectId, documentType, content",
      });
    }

    // Parse content if it's a string
    let parsedContent = content;
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
        console.log("Parsed content from string:", parsedContent);
      } catch (error) {
        console.log("Content is not valid JSON, using as-is");
        parsedContent = content;
      }
    }

    // Call n8n webhook to convert JSON to markdown
    const n8nPayload = {
      project_id: projectId,
      stage: documentType.toLowerCase(),
      json: parsedContent,
      preferred_format: "Markdown",
    };

    console.log("Calling n8n webhook with payload:", n8nPayload);

    const n8nResponse = await axios.post(
      "https://reactaksahy57.app.n8n.cloud/webhook/generate-markdown",
      n8nPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log("N8N response status:", n8nResponse.status);

    if (n8nResponse.status !== 200) {
      throw new Error(`N8N API returned status: ${n8nResponse.status}`);
    }

    const markdownContent = n8nResponse.data;
    console.log("Received markdown content from n8n");

    // Generate professional document using DOCX
    const docxGenerationService = require("../services/docxGenerationService");
    const s3Service = require("../services/s3Service");

    const projectInfo = {
      name: projectName || "Untitled Project",
      id: projectId,
    };

    console.log("Generating professional DOCX document...");
    const docxBuffer = await docxGenerationService.generateProfessionalDocument(
      markdownContent,
      documentType,
      projectId,
      projectInfo
    );

    // Generate S3 key for DOCX file
    const s3Key = s3Service.generateDocumentKey(
      projectId,
      documentType,
      "docx"
    );

    console.log("Uploading DOCX document to S3...");
    const uploadResult = await s3Service.uploadContent(
      docxBuffer,
      s3Key,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    console.log("Document uploaded to S3:", uploadResult.url);

    res.json({
      success: true,
      documentUrl: uploadResult.url,
      s3Key: uploadResult.key,
      message: "Professional document generated and uploaded successfully",
    });
  } catch (error) {
    console.error("Error converting to document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert document",
      error: error.message,
    });
  }
});

// Helper function to convert JSON to Markdown (temporary implementation)
const convertJsonToMarkdown = (jsonContent, documentType) => {
  try {
    const data =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;

    let markdown = `# ${documentType || "Document"}\n\n`;

    // Handle different document types
    if (data.project_info) {
      markdown += `## Project Information\n\n`;
      markdown += `**Name:** ${data.project_info.name || "N/A"}\n\n`;
      markdown += `**Description:** ${
        data.project_info.description || "N/A"
      }\n\n`;

      if (data.project_info.business_objectives) {
        markdown += `### Business Objectives\n\n`;
        data.project_info.business_objectives.forEach((obj, index) => {
          markdown += `${index + 1}. ${obj}\n`;
        });
        markdown += "\n";
      }

      if (data.project_info.success_metrics) {
        markdown += `### Success Metrics\n\n`;
        data.project_info.success_metrics.forEach((metric, index) => {
          markdown += `${index + 1}. ${metric}\n`;
        });
        markdown += "\n";
      }
    }

    if (data.requirements) {
      markdown += `## Requirements\n\n`;

      if (data.requirements.functional) {
        markdown += `### Functional Requirements\n\n`;
        data.requirements.functional.forEach((req, index) => {
          markdown += `${index + 1}. ${req}\n`;
        });
        markdown += "\n";
      }

      if (data.requirements.non_functional) {
        markdown += `### Non-Functional Requirements\n\n`;
        data.requirements.non_functional.forEach((req, index) => {
          markdown += `${index + 1}. ${req}\n`;
        });
        markdown += "\n";
      }
    }

    if (data.constraints) {
      markdown += `## Constraints\n\n`;
      data.constraints.forEach((constraint, index) => {
        markdown += `${index + 1}. ${constraint}\n`;
      });
      markdown += "\n";
    }

    if (data.blueprint) {
      markdown += `## Project Blueprint\n\n`;

      if (data.blueprint.project_overview) {
        markdown += `### Project Overview\n\n`;
        if (data.blueprint.project_overview.goals) {
          markdown += `**Goals:**\n`;
          data.blueprint.project_overview.goals.forEach((goal, index) => {
            markdown += `${index + 1}. ${goal}\n`;
          });
          markdown += "\n";
        }
      }

      if (data.blueprint.feature_breakdown) {
        markdown += `### Feature Breakdown\n\n`;
        data.blueprint.feature_breakdown.forEach((feature, index) => {
          markdown += `#### ${feature.feature || `Feature ${index + 1}`}\n\n`;
          markdown += `**Priority:** ${feature.priority || "N/A"}\n\n`;
          if (feature.dependencies && feature.dependencies.length > 0) {
            markdown += `**Dependencies:** ${feature.dependencies.join(
              ", "
            )}\n\n`;
          }
        });
      }
    }

    return markdown;
  } catch (error) {
    return `# Error\n\nFailed to convert JSON to Markdown: ${error.message}`;
  }
};

// Generate next step (trigger n8n workflow)
router.post("/generate/:projectId/:stepType", async (req, res) => {
  try {
    const { projectId, stepType } = req.params;
    const { content, input } = req.body;

    console.log(`Generating ${stepType} for project ${projectId}`);
    console.log("Content:", content || input);

    // Check if project exists
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Update project status to processing
    await Project.findOneAndUpdate(
      { project_id: projectId },
      { status: "processing", updatedAt: new Date() }
    );

    // Prepare n8n webhook call
    let n8nUrl = "";
    let payload = {};

    switch (stepType.toLowerCase()) {
      case "requirements":
        n8nUrl = process.env.N8N_REQUIREMENT_EXTRACTION_URL;
        payload = {
          project_id: projectId,
          input: content || input || project.input,
          project_name: project.name,
          organization_name: project.organizationName,
          contact_person: project.contactPersonName,
          contact_email: project.contactEmail,
        };
        break;
      case "brd":
        n8nUrl = process.env.N8N_BRD_GENERATION_URL;
        payload = {
          project_id: projectId,
          requirements: content,
          project_name: project.name,
          organization_name: project.organizationName,
        };
        break;
      case "blueprint":
        n8nUrl = process.env.N8N_REQUIREMENT_BLUEPRINT_URL;
        payload = {
          project_id: projectId,
          brd: content,
          project_name: project.name,
          organization_name: project.organizationName,
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid step type",
          message: `Unknown step type: ${stepType}`,
        });
    }

    if (!n8nUrl) {
      return res.status(500).json({
        success: false,
        error: "N8N URL not configured",
        message: `N8N webhook URL for ${stepType} is not configured`,
      });
    }

    console.log(`Calling n8n webhook: ${n8nUrl}`);
    console.log("Payload:", payload);

    // Call the n8n webhook
    const n8nResult = await forwardToN8N(n8nUrl, payload);

    if (n8nResult.success) {
      res.json({
        success: true,
        message: `${stepType} generation initiated successfully`,
        stepType,
        projectId,
        n8nUrl,
        n8nResponse: n8nResult.data,
      });
    } else {
      // Update project status back to created if n8n call failed
      await Project.findOneAndUpdate(
        { project_id: projectId },
        { status: "created", updatedAt: new Date() }
      );

      res.status(500).json({
        success: false,
        error: "N8N webhook call failed",
        message: n8nResult.error,
        stepType,
        projectId,
        n8nUrl,
      });
    }
  } catch (error) {
    console.error("Generate next step error:", error);

    // Update project status back to created if there was an error
    try {
      await Project.findOneAndUpdate(
        { project_id: req.params.projectId },
        { status: "created", updatedAt: new Date() }
      );
    } catch (updateError) {
      console.error("Failed to update project status:", updateError);
    }

    res.status(500).json({
      success: false,
      error: "Generation failed",
      message: error.message,
    });
  }
});

// Helper function to format markdown content as a proper document
const formatAsDocument = (markdownContent, documentType, projectId) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  let documentHeader = "";
  let documentTitle = "";

  switch (documentType) {
    case "BRD":
      documentTitle = "Business Requirements Document";
      documentHeader = `
# ${documentTitle}

**Project ID:** ${projectId}  
**Document Type:** Business Requirements Document  
**Generated On:** ${currentDate} at ${currentTime}  
**Version:** 1.0  

---

`;
      break;
    case "BLUEPRINT":
      documentTitle = "Requirements Blueprint Document";
      documentHeader = `
# ${documentTitle}

**Project ID:** ${projectId}  
**Document Type:** Requirements Blueprint Document  
**Generated On:** ${currentDate} at ${currentTime}  
**Version:** 1.0  

---

`;
      break;
    default:
      documentTitle = "Project Document";
      documentHeader = `
# ${documentTitle}

**Project ID:** ${projectId}  
**Document Type:** ${documentType}  
**Generated On:** ${currentDate} at ${currentTime}  
**Version:** 1.0  

---

`;
  }

  // Combine header with markdown content
  const formattedDocument = documentHeader + markdownContent;

  return formattedDocument;
};

// Generate HTML view for BRD or Blueprint using local templates
router.post("/generate-view/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { stage } = req.body; // "brd" or "blueprint"

    if (!stage || !["brd", "blueprint"].includes(stage.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Stage must be 'brd' or 'blueprint'",
      });
    }

    // Find the latest document of the specified type
    const documentType = stage.toLowerCase() === "brd" ? "BRD" : "BLUEPRINT";
    const latestDoc = await Document.findOne({
      project_id: projectId,
      type: documentType,
    }).sort({ createdAt: -1 });

    if (!latestDoc) {
      return res.status(404).json({
        success: false,
        message: `No ${documentType} document found for this project`,
      });
    }

    // Get project information
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.log(
      `Generating ${stage.toUpperCase()} HTML view for project: ${projectId}`
    );

    // Generate HTML using local template
    const html = await generateHtmlFromTemplate(
      stage,
      latestDoc.content,
      project,
      latestDoc
    );

    res.json({
      success: true,
      message: `${stage.toUpperCase()} HTML view generated successfully`,
      html: html,
      projectId: projectId,
      stage: stage,
    });
  } catch (error) {
    console.error("Generate view error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Helper function to generate HTML from template
const generateHtmlFromTemplate = async (
  stage,
  documentContent,
  project,
  document
) => {
  const fs = require("fs").promises;
  const path = require("path");

  try {
    // Read the appropriate template
    const templatePath = path.join(
      __dirname,
      "..",
      "html-template",
      `${stage}.html`
    );
    let template = await fs.readFile(templatePath, "utf8");

    // Get current date
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Replace common placeholders
    template = template.replace(
      /\{\{projectName\}\}/g,
      project.name || "Unnamed Project"
    );
    template = template.replace(
      /\{\{projectId\}\}/g,
      project.project_id || "N/A"
    );
    template = template.replace(/\{\{currentDate\}\}/g, currentDate);

    // Add document information
    template = template.replace(
      /\{\{documentId\}\}/g,
      document.documentId || "N/A"
    );
    template = template.replace(
      /\{\{documentVersion\}\}/g,
      document.version || "1"
    );
    template = template.replace(
      /\{\{documentType\}\}/g,
      document.type || stage.toUpperCase()
    );

    if (stage === "brd") {
      template = await generateBrdHtml(
        template,
        documentContent,
        project,
        document
      );
    } else if (stage === "blueprint") {
      template = await generateBlueprintHtml(
        template,
        documentContent,
        project,
        document
      );
    }

    return template;
  } catch (error) {
    console.error("Error generating HTML from template:", error);
    throw error;
  }
};

// Generate BRD HTML content
const generateBrdHtml = async (template, content, project, document) => {
  try {
    // Extract data from document content - handle both old and new structure
    const brdData = content.brd || content;
    const projectInfo = brdData.project_info || {};
    const requirements = brdData.requirements || {};
    const constraints = brdData.constraints || [];

    // Project description
    const projectDescription =
      projectInfo.description ||
      project.description ||
      "Project description to be provided.";
    template = template.replace(
      /\{\{projectDescription\}\}/g,
      projectDescription
    );

    // Business objectives
    const businessObjectives = projectInfo.business_objectives || [];
    const businessObjectivesHtml =
      businessObjectives.length > 0
        ? `<ol>${businessObjectives
            .map((obj) => `<li>${obj}</li>`)
            .join("")}</ol>`
        : "<p><em>Business objectives to be provided.</em></p>";
    template = template.replace(
      /\{\{businessObjectives\}\}/g,
      businessObjectivesHtml
    );

    // Success metrics
    const successMetrics = projectInfo.success_metrics || [];
    const successMetricsHtml =
      successMetrics.length > 0
        ? `<ol>${successMetrics
            .map((metric) => `<li>${metric}</li>`)
            .join("")}</ol>`
        : "<p><em>Success metrics to be provided.</em></p>";
    template = template.replace(/\{\{successMetrics\}\}/g, successMetricsHtml);

    // Stakeholders
    const stakeholders = projectInfo.stakeholders || [];
    const stakeholdersHtml =
      stakeholders.length > 0
        ? stakeholders
            .map(
              (stakeholder) =>
                `<tr>
            <td>${stakeholder.role || "N/A"}</td>
            <td>${stakeholder.contact || "N/A"}</td>
            <td>${stakeholder.responsibilities || "To be defined"}</td>
          </tr>`
            )
            .join("")
        : '<tr><td colspan="3"><em>Stakeholder information to be provided.</em></td></tr>';
    template = template.replace(/\{\{stakeholdersTable\}\}/g, stakeholdersHtml);

    // Functional requirements
    const functionalReqs = requirements.functional || [];
    const functionalReqsHtml =
      functionalReqs.length > 0
        ? `<ol>${functionalReqs.map((req) => `<li>${req}</li>`).join("")}</ol>`
        : "<p><em>Functional requirements to be provided.</em></p>";
    template = template.replace(
      /\{\{functionalRequirements\}\}/g,
      functionalReqsHtml
    );

    // Non-functional requirements
    const nonFunctionalReqs = requirements.non_functional || [];
    const nonFunctionalReqsHtml =
      nonFunctionalReqs.length > 0
        ? `<ol>${nonFunctionalReqs
            .map((req) => `<li>${req}</li>`)
            .join("")}</ol>`
        : "<p><em>Non-functional requirements to be provided.</em></p>";
    template = template.replace(
      /\{\{nonFunctionalRequirements\}\}/g,
      nonFunctionalReqsHtml
    );

    // Constraints
    const constraintsHtml =
      constraints.length > 0
        ? `<ul>${constraints
            .map((constraint) => `<li>${constraint}</li>`)
            .join("")}</ul>`
        : "<p><em>Project constraints to be provided.</em></p>";
    template = template.replace(/\{\{constraintsList\}\}/g, constraintsHtml);

    return template;
  } catch (error) {
    console.error("Error generating BRD HTML:", error);
    throw error;
  }
};

// Generate Blueprint HTML content
const generateBlueprintHtml = async (template, content, project, document) => {
  try {
    // Extract data from document content - handle both old and new structure
    const blueprintData = content.blueprint || content;
    const projectOverview = blueprintData.project_overview || {};
    const featureBreakdown = blueprintData.feature_breakdown || [];
    const techArch = blueprintData.technical_architecture || {};
    const userFlow = blueprintData.user_experience_flow || {};
    const timeline = blueprintData.timeline_milestones || [];
    const resources = blueprintData.resource_requirements || [];
    const risks = blueprintData.risk_assessment || [];
    const assumptions = blueprintData.assumptions || [];
    const nextSteps = blueprintData.next_steps || [];

    // Project goals
    const goals = projectOverview.goals || [];
    const goalsHtml =
      goals.length > 0
        ? `<ul>${goals.map((goal) => `<li>${goal}</li>`).join("")}</ul>`
        : "<p><em>Project goals to be provided.</em></p>";
    template = template.replace(/\{\{projectGoals\}\}/g, goalsHtml);

    // Target audience
    const audience = projectOverview.target_audience || [];
    const audienceHtml =
      audience.length > 0
        ? `<ul>${audience.map((aud) => `<li>${aud}</li>`).join("")}</ul>`
        : "<p><em>Target audience to be provided.</em></p>";
    template = template.replace(/\{\{targetAudience\}\}/g, audienceHtml);

    // Success metrics
    const metrics = projectOverview.success_metrics || [];
    const metricsHtml =
      metrics.length > 0
        ? `<ul>${metrics.map((metric) => `<li>${metric}</li>`).join("")}</ul>`
        : "<p><em>Success metrics to be provided.</em></p>";
    template = template.replace(/\{\{successMetrics\}\}/g, metricsHtml);

    // Feature breakdown
    const featuresHtml =
      featureBreakdown.length > 0
        ? featureBreakdown
            .map((feature) => {
              const priority = feature.priority || "Medium";
              const priorityClass =
                priority.toLowerCase() === "high"
                  ? "priority-high"
                  : priority.toLowerCase() === "low"
                  ? "priority-low"
                  : "priority-medium";
              return `<tr>
            <td>${feature.feature || "N/A"}</td>
            <td><span class="${priorityClass}">${priority}</span></td>
            <td>${(feature.dependencies || []).join(", ") || "None"}</td>
            <td>${
              feature.description || "Feature description to be provided"
            }</td>
          </tr>`;
            })
            .join("")
        : '<tr><td colspan="4"><em>Feature breakdown to be provided.</em></td></tr>';
    template = template.replace(/\{\{featureBreakdown\}\}/g, featuresHtml);

    // Tech stack
    const techStack = techArch.recommended_stack || [];
    const techStackHtml =
      techStack.length > 0
        ? techStack
            .map(
              (tech) => `<div class="tech-card">
          <h4>${tech.layer || "Technology"}</h4>
          <p>${tech.technology || tech}</p>
        </div>`
            )
            .join("")
        : '<div class="tech-card"><h4>Technology Stack</h4><p><em>Technology stack to be provided.</em></p></div>';
    template = template.replace(/\{\{techStack\}\}/g, techStackHtml);

    // Architecture justification
    const justification =
      techArch.justification || "Architecture justification to be provided.";
    template = template.replace(
      /\{\{architectureJustification\}\}/g,
      justification
    );

    // User journeys
    const journeys = userFlow.journeys || [];
    const journeysHtml =
      journeys.length > 0
        ? `<ol>${journeys
            .map((journey) => `<li>${journey}</li>`)
            .join("")}</ol>`
        : "<p><em>User journeys to be provided.</em></p>";
    template = template.replace(/\{\{userJourneys\}\}/g, journeysHtml);

    // Key interactions
    const interactions = userFlow.key_interactions || [];
    const interactionsHtml =
      interactions.length > 0
        ? `<ul>${interactions
            .map((interaction) => `<li>${interaction}</li>`)
            .join("")}</ul>`
        : "<p><em>Key interactions to be provided.</em></p>";
    template = template.replace(/\{\{keyInteractions\}\}/g, interactionsHtml);

    // Timeline milestones
    const timelineHtml =
      timeline.length > 0
        ? timeline
            .map(
              (milestone, index) => `<div class="timeline-item">
          <div class="timeline-marker">${index + 1}</div>
          <div class="timeline-content">
            <h4>${milestone.phase || "Phase " + (index + 1)}</h4>
            <ul>${(milestone.deliverables || [])
              .map((del) => `<li>${del}</li>`)
              .join("")}</ul>
            <div class="estimate">Estimated Duration: ${
              milestone.estimate || "To be determined"
            }</div>
          </div>
        </div>`
            )
            .join("")
        : '<div class="timeline-item"><div class="timeline-marker">1</div><div class="timeline-content"><h4>Project Timeline</h4><p><em>Timeline and milestones to be provided.</em></p></div></div>';
    template = template.replace(/\{\{timelineMilestones\}\}/g, timelineHtml);

    // Resource requirements
    const resourcesHtml =
      resources.length > 0
        ? resources
            .map(
              (resource) => `<tr>
          <td>${resource.role || "N/A"}</td>
          <td>${resource.responsibilities || "To be defined"}</td>
          <td>${resource.skills || "To be defined"}</td>
          <td>${resource.duration || "To be determined"}</td>
        </tr>`
            )
            .join("")
        : '<tr><td colspan="4"><em>Resource requirements to be provided.</em></td></tr>';
    template = template.replace(/\{\{resourceRequirements\}\}/g, resourcesHtml);

    // Risk assessment
    const risksHtml =
      risks.length > 0
        ? risks
            .map(
              (risk) => `<div class="risk-item">
          <h4>${risk.risk || "Risk"}</h4>
          <p><strong>Mitigation:</strong> ${
            risk.mitigation || "Mitigation strategy to be provided"
          }</p>
        </div>`
            )
            .join("")
        : '<div class="risk-item"><h4>Risk Assessment</h4><p><em>Risk assessment to be provided.</em></p></div>';
    template = template.replace(/\{\{riskAssessment\}\}/g, risksHtml);

    // Project assumptions
    const assumptionsHtml =
      assumptions.length > 0
        ? `<ul>${assumptions
            .map((assumption) => `<li>${assumption}</li>`)
            .join("")}</ul>`
        : "<p><em>Project assumptions to be provided.</em></p>";
    template = template.replace(/\{\{projectAssumptions\}\}/g, assumptionsHtml);

    // Next steps
    const nextStepsHtml =
      nextSteps.length > 0
        ? `<ol>${nextSteps.map((step) => `<li>${step}</li>`).join("")}</ol>`
        : "<p><em>Next steps to be provided.</em></p>";
    template = template.replace(/\{\{nextSteps\}\}/g, nextStepsHtml);

    return template;
  } catch (error) {
    console.error("Error generating Blueprint HTML:", error);
    throw error;
  }
};

module.exports = router;
