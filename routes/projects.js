const express = require("express");
const { apiKeyAuth } = require("../middleware/auth");
const Project = require("../models/Project");
const Document = require("../models/Document");

const router = express.Router();

// No API key authentication for now
// router.use(apiKeyAuth);

// GET /api/projects/:projectId
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return res.status(404).json({
        error: "Requirement not found",
        message: `Requirement with ID ${projectId} does not exist`,
      });
    }

    // Get all documents for this requirement
    const documents = await Document.find({ project_id: projectId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      project: {
        project_id: project.project_id,
        name: project.name,
        description: project.description,
        source: project.source,
        status: project.status,
        totalDocuments: project.totalDocuments,
        metadata: project.metadata,
        input: project.input,
        inputType: project.inputType,
        organizationName: project.organizationName,
        contactPersonName: project.contactPersonName,
        contactEmail: project.contactEmail,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      documents: documents.map((doc) => ({
        documentId: doc.documentId,
        type: doc.type,
        version: doc.version,
        content: doc.content,
        sourceHash: doc.sourceHash,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get requirement error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/projects/:reqId/documents/:documentId
router.get("/:reqId/documents/:documentId", async (req, res) => {
  try {
    const { reqId, documentId } = req.params;

    const document = await Document.findOne({ project_id: reqId, documentId });
    if (!document) {
      return res.status(404).json({
        error: "Document not found",
        message: `Document with ID ${documentId} not found for requirement ${reqId}`,
      });
    }

    res.json({
      success: true,
      document: {
        documentId: document.documentId,
        project_id: document.project_id,
        type: document.type,
        content: document.content,
        version: document.version,
        sourceHash: document.sourceHash,
        metadata: document.metadata,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// GET /api/projects (list all projects)
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/projects called with query:", req.query);

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    console.log("MongoDB filter:", filter);

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filter);

    console.log(`Found ${projects.length} projects out of ${total} total`);

    res.json({
      success: true,
      projects: projects.map((project) => ({
        project_id: project.project_id,
        name: project.name,
        description: project.description,
        source: project.source,
        status: project.status,
        totalDocuments: project.totalDocuments,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// PUT /api/projects/:reqId - Update project data
router.put("/:reqId", async (req, res) => {
  try {
    const { reqId } = req.params;
    const updateData = req.body;

    const project = await Project.findOneAndUpdate(
      { project_id: reqId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
        message: `Project with ID ${reqId} does not exist`,
      });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
      project: {
        project_id: project.project_id,
        name: project.name,
        description: project.description,
        source: project.source,
        status: project.status,
        totalDocuments: project.totalDocuments,
        metadata: project.metadata,
        input: project.input,
        inputType: project.inputType,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
      message: error.message,
    });
  }
});

// PUT /api/projects/:reqId/documents/:documentId - Update document
router.put("/:reqId/documents/:documentId", async (req, res) => {
  try {
    const { reqId, documentId } = req.params;
    const updateData = req.body;

    const document = await Document.findOneAndUpdate(
      { project_id: reqId, documentId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        message: `Document with ID ${documentId} not found for project ${reqId}`,
      });
    }

    res.json({
      success: true,
      message: "Document updated successfully",
      document: {
        documentId: document.documentId,
        project_id: document.project_id,
        type: document.type,
        content: document.content,
        version: document.version,
        sourceHash: document.sourceHash,
        metadata: document.metadata,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update document",
      message: error.message,
    });
  }
});

// POST /api/projects/:reqId/documents/:documentId/version - Create new version
router.post("/:reqId/documents/:documentId/version", async (req, res) => {
  try {
    const { reqId, documentId } = req.params;
    const { content } = req.body;

    // Find the original document
    const originalDocument = await Document.findOne({
      documentId: documentId,
      project_id: reqId,
    });

    if (!originalDocument) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        message: `Document with ID ${documentId} not found for project ${reqId}`,
      });
    }

    // Get the next version number
    const latestVersion = await Document.findOne(
      { project_id: reqId, type: originalDocument.type },
      { version: 1 },
      { sort: { version: -1 } }
    );
    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    const { v4: uuidv4 } = require("uuid");
    const newDocumentId = uuidv4();
    const newDocument = new Document({
      documentId: newDocumentId,
      project_id: reqId,
      type: originalDocument.type,
      content: content,
      version: nextVersion,
      sourceHash: originalDocument.sourceHash,
      metadata: {
        ...originalDocument.metadata,
        parentDocumentId: documentId,
        createdFromVersion: originalDocument.version,
      },
    });

    await newDocument.save();

    // Update project document count
    await Project.findOneAndUpdate(
      { project_id: reqId },
      { $inc: { totalDocuments: 1 }, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: "New version created successfully",
      document: {
        documentId: newDocument.documentId,
        project_id: newDocument.project_id,
        type: newDocument.type,
        content: newDocument.content,
        version: newDocument.version,
        sourceHash: newDocument.sourceHash,
        metadata: newDocument.metadata,
        createdAt: newDocument.createdAt,
        updatedAt: newDocument.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating new version:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create new version",
      message: error.message,
    });
  }
});

module.exports = router;
