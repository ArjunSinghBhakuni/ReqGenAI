const express = require("express");
const Project = require("../models/Project");
const Document = require("../models/Document");
const pdfGenerationService = require("../services/pdfGeneration");
const path = require("path");

const router = express.Router();

// No API key authentication for now

// Generate PDF for a specific document
router.post("/document/:projectId/:documentId", async (req, res) => {
  try {
    const { projectId, documentId } = req.params;

    // Get project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get document
    const document = await Document.findOne({
      project_id: projectId,
      documentId,
    });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        message: `Document with ID ${documentId} not found for project ${projectId}`,
      });
    }

    // Generate PDF
    const result = await pdfGenerationService.generateDocumentPDF(
      document,
      project
    );

    res.json({
      success: true,
      message: "PDF generated successfully",
      filename: result.filename,
      url: result.url,
      downloadUrl: `/api/pdf/download/${result.filename}`,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      message: error.message,
    });
  }
});

// Generate project summary PDF
router.post("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: `Project with ID ${projectId} does not exist`,
      });
    }

    // Get all documents for this project
    const documents = await Document.find({ project_id: projectId }).sort({
      createdAt: -1,
    });

    // Generate PDF
    const result = await pdfGenerationService.generateProjectSummaryPDF(
      project,
      documents
    );

    res.json({
      success: true,
      message: "Project summary PDF generated successfully",
      filename: result.filename,
      url: result.url,
      downloadUrl: `/api/pdf/download/${result.filename}`,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      message: error.message,
    });
  }
});

// Generate PDF from Markdown content
router.post("/generate-from-markdown", async (req, res) => {
  try {
    const {
      projectId,
      documentId,
      documentType,
      markdownContent,
      projectName,
    } = req.body;

    if (!markdownContent) {
      return res.status(400).json({
        success: false,
        error: "Missing markdown content",
        message: "Markdown content is required to generate PDF",
      });
    }

    // Generate PDF from markdown
    const result = await pdfGenerationService.generatePDFFromMarkdown(
      markdownContent,
      {
        projectId,
        documentId,
        documentType,
        projectName: projectName || "Document",
      }
    );

    res.json({
      success: true,
      message: "PDF generated successfully from markdown",
      filename: result.filename,
      url: result.url,
      downloadUrl: `/api/pdf/download/${result.filename}`,
    });
  } catch (error) {
    console.error("PDF generation from markdown error:", error);
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      message: error.message,
    });
  }
});

// Download PDF file
router.get("/download/:filename", (req, res) => {
  try {
    const { filename } = req.params;

    // Use same directory logic as PDFGenerationService
    let pdfDir;
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      pdfDir = "/tmp/pdfs";
    } else {
      pdfDir = path.join(__dirname, "../public/pdfs");
    }

    const filepath = path.join(pdfDir, filename);

    // Check if file exists
    const fs = require("fs");
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: "File not found",
        message: "The requested PDF file does not exist",
      });
    }

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filepath);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({
      success: false,
      error: "Download failed",
      message: error.message,
    });
  }
});

// Generate PDF from HTML view (uses the beautiful HTML templates)
router.post("/generate-from-html-view", async (req, res) => {
  try {
    const { projectId, stage, htmlContent, projectName } = req.body;

    if (!projectId || !stage || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: projectId, stage, htmlContent",
      });
    }

    if (!["brd", "blueprint"].includes(stage.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Stage must be 'brd' or 'blueprint'",
      });
    }

    console.log(
      `Generating PDF from HTML view for project: ${projectId}, stage: ${stage}`
    );

    // Generate PDF from HTML content
    const result = await pdfGenerationService.generatePDFFromHTML(htmlContent, {
      projectId,
      documentType: stage.toUpperCase(),
      projectName: projectName || "Document",
    });

    res.json({
      success: true,
      message: "PDF generated successfully from HTML view",
      filename: result.filename,
      url: result.url,
      downloadUrl: `/api/pdf/download/${result.filename}`,
    });
  } catch (error) {
    console.error("Error generating PDF from HTML view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF from HTML view",
      error: error.message,
    });
  }
});

// Generate PDF from document (calls n8n and formats as document)
router.post("/generate-from-document", async (req, res) => {
  try {
    const { projectId, documentId, documentType, content, projectName } =
      req.body;

    if (!projectId || !documentType || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: projectId, documentType, content",
      });
    }

    // Call n8n webhook to convert JSON to markdown
    const axios = require("axios");
    const n8nPayload = {
      project_id: projectId,
      stage: documentType.toLowerCase(),
      json: content,
      preferred_format: "Markdown",
    };

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

    if (n8nResponse.status !== 200) {
      throw new Error(`N8N API returned status: ${n8nResponse.status}`);
    }

    const markdownContent = n8nResponse.data;

    // Format the markdown content as a proper document
    const documentContent = formatAsDocument(
      markdownContent,
      documentType,
      projectId
    );

    // Generate PDF from the formatted document
    const result = await pdfGenerationService.generatePDFFromMarkdown(
      documentContent,
      {
        projectId,
        documentId,
        documentType,
        projectName: projectName || "Document",
      }
    );

    res.json({
      success: true,
      message: "PDF generated successfully from document",
      filename: result.filename,
      url: result.url,
      downloadUrl: `/api/pdf/download/${result.filename}`,
    });
  } catch (error) {
    console.error("Error generating PDF from document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF from document",
      error: error.message,
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

module.exports = router;
