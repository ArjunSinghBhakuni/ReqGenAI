const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { apiKeyAuth } = require("../middleware/auth");
const Project = require("../models/Project");
const Document = require("../models/Document");
const requirementExtractionService = require("../services/requirementExtraction");
const axios = require("axios");

const router = express.Router();

// No API key authentication for now
// router.use(apiKeyAuth);

// Helper function to call N8N requirement extraction webhook
const callN8NRequirementExtraction = async (projectId, inputText) => {
  try {
    const n8nUrl = process.env.N8N_REQUIREMENT_EXTRACTION_URL;

    if (!n8nUrl) {
      console.error("N8N_REQUIREMENT_EXTRACTION_URL not configured");
      return { success: false, error: "N8N URL not configured" };
    }

    const payload = {
      project_id: projectId,
      input: inputText,
    };

    console.log(`Calling N8N requirement extraction for project: ${projectId}`);

    const response = await axios.post(n8nUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    console.log(
      `N8N requirement extraction initiated for project: ${projectId}`
    );
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Error calling N8N requirement extraction:", error.message);
    return { success: false, error: error.message };
  }
};

// Helper function to create requirement and document
const createInput = async (
  source,
  content,
  sourceDetail = null,
  projectData = {}
) => {
  try {
    const projectId = uuidv4();
    const documentId = uuidv4();

    // Create requirement
    const project = new Project({
      project_id: projectId,
      name: projectData.name || `Requirement ${projectId.substring(0, 8)}`,
      description: content.substring(0, 100) + "...",
      source: sourceDetail ? `${source}:${sourceDetail}` : source,
      status: "created", // Start as created, will be processing when extraction starts
      totalDocuments: 1,
      input: content,
      inputType: source,
      organizationName: projectData.organizationName || "",
      contactPersonName: projectData.contactPersonName || "",
      contactEmail: projectData.contactEmail || "",
    });

    await project.save();

    // Create document
    const document = new Document({
      documentId,
      project_id: projectId,
      type: "RAW_INPUT",
      content: {
        text: content,
        source: source,
        sourceDetail: sourceDetail,
      },
    });

    await document.save();

    // Project created successfully - requirement extraction will be triggered manually
    console.log(`Project created with ID: ${projectId}`);

    return {
      success: true,
      project_id: projectId,
      documentId,
      n8n_extraction_initiated: false, // Will be triggered manually
      project: {
        project_id: projectId,
        name: project.name,
        description: project.description,
        organizationName: project.organizationName,
        contactPersonName: project.contactPersonName,
        contactEmail: project.contactEmail,
        status: project.status,
        inputType: project.inputType,
      },
    };
  } catch (error) {
    console.error("Error creating input:", error);
    throw new Error("Failed to create input");
  }
};

// POST /api/inputs/manual
router.post("/manual", async (req, res) => {
  try {
    const { content, name, organizationName, contactPersonName, contactEmail } =
      req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Content is required",
        message: "Please provide content for manual input",
      });
    }

    const projectData = {
      name,
      organizationName,
      contactPersonName,
      contactEmail,
    };

    const result = await createInput("manual", content, null, projectData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Manual input error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/inputs/transcript
router.post("/transcript", async (req, res) => {
  try {
    const { content, source } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        error: "Content is required",
        message: "Please provide content for transcript input",
      });
    }

    const result = await createInput("transcript", content, source);
    res.status(201).json(result);
  } catch (error) {
    console.error("Transcript input error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// POST /api/inputs/file
router.post("/file", async (req, res) => {
  try {
    const { filename, text } = req.body;

    if (!filename || !text || text.trim() === "") {
      return res.status(400).json({
        error: "Filename and text are required",
        message: "Please provide both filename and text content",
      });
    }

    const result = await createInput("file", text, filename);
    res.status(201).json(result);
  } catch (error) {
    console.error("File input error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
