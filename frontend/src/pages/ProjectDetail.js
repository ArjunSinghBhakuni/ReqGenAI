import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requirementAPI, pdfAPI, projectAPI, actionAPI } from "../services/api";
import { useToast } from "../utils/toast";
import JsonSectionEditor from "../components/JsonSectionEditor";
import RequirementsSectionEditor from "../components/RequirementsSectionEditor";
import BRDSectionEditor from "../components/BRDSectionEditor";
import BlueprintSectionEditor from "../components/BlueprintSectionEditor";

const ProjectDetail = () => {
  const { project_id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeDocument, setActiveDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [editingTab, setEditingTab] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [convertedMarkdown, setConvertedMarkdown] = useState(null);
  const [showMarkdownView, setShowMarkdownView] = useState(false);
  const [markdownCache, setMarkdownCache] = useState({});
  const [loadingMarkdown, setLoadingMarkdown] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  useEffect(() => {
    if (project_id) {
      loadProjectDetails(project_id);
    }
  }, [project_id]);

  const loadProjectDetails = async (projectId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await requirementAPI.getById(projectId);

      if (response.data.success) {
        setProject(response.data.project);
        setDocuments(response.data.documents);
      } else {
        setError("Failed to load project details");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setError(
        error.response?.data?.message || "Failed to load project details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = async (document) => {
    setActiveDocument(document);
    setLoadingDocument(true);
    try {
      const result = await requirementAPI.getDocument(
        project_id,
        document.documentId
      );
      setDocumentContent(result.data.document);
    } catch (error) {
      toast.error({
        title: "Error Loading Document",
        description: "Failed to load document content.",
      });
    } finally {
      setLoadingDocument(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case "RAW_INPUT":
        return "bg-gray-100 text-gray-800";
      case "REQUIREMENTS":
        return "bg-blue-100 text-blue-800";
      case "BRD":
        return "bg-green-100 text-green-800";
      case "BLUEPRINT":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case "RAW_INPUT":
        return "Raw Input";
      case "REQUIREMENTS":
        return "Requirements";
      case "BRD":
        return "Business Requirements";
      case "BLUEPRINT":
        return "Project Blueprint";
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Organize documents by type and version
  const organizeDocumentsByType = useCallback(() => {
    const organized = {
      REQUIREMENTS: [],
      BRD: [],
      BLUEPRINT: [],
      RAW_INPUT: [],
      DRAFT: [],
    };

    documents.forEach((doc) => {
      if (organized[doc.type]) {
        organized[doc.type].push(doc);
      }
    });

    // Sort each type by version (newest first)
    Object.keys(organized).forEach((type) => {
      organized[type].sort((a, b) => (b.version || 1) - (a.version || 1));
    });

    return organized;
  }, [documents]);

  // Get document count by type
  const getDocumentCounts = useCallback(() => {
    const organized = organizeDocumentsByType();
    const counts = {};

    Object.keys(organized).forEach((type) => {
      counts[type] = organized[type].length;
    });

    return counts;
  }, [organizeDocumentsByType]);

  // Save project data
  const saveProjectData = async (data) => {
    try {
      setSaving(true);
      const response = await projectAPI.updateProject(project_id, data);

      if (response.data.success) {
        setProject(response.data.project);
        toast.success({
          title: "Saved Successfully",
          description: "Project data has been updated.",
        });
        setEditingTab(null);
        setEditData({});
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error({
        title: "Save Failed",
        description:
          error.response?.data?.message || "Failed to save project data.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Save document data
  const saveDocumentData = async (documentId, data) => {
    try {
      setSaving(true);
      const response = await projectAPI.updateDocument(
        project_id,
        documentId,
        data
      );

      if (response.data.success) {
        // Update the document in the local state
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.documentId === documentId ? response.data.document : doc
          )
        );
        toast.success({
          title: "Saved Successfully",
          description: "Document has been updated.",
        });
        setEditingTab(null);
        setEditData({});
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error({
        title: "Save Failed",
        description:
          error.response?.data?.message || "Failed to save document.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate next step
  const generateNextStep = async (stepType, data) => {
    try {
      toast.info({
        title: "Generating Next Step",
        description: `Starting ${stepType} generation...`,
      });

      let response;
      switch (stepType.toLowerCase()) {
        case "requirements":
          response = await actionAPI.extractRequirements(project_id, data);
          break;
        case "brd":
          response = await actionAPI.generateBRD(project_id, data);
          break;
        case "blueprint":
          response = await actionAPI.generateBlueprint(project_id, data);
          break;
        default:
          throw new Error(`Unknown step type: ${stepType}`);
      }

      if (response.data.success) {
        toast.success({
          title: "Generation Started",
          description: `${stepType} generation has been initiated. You'll be notified when it's complete.`,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error({
        title: "Generation Failed",
        description:
          error.response?.data?.message || "Failed to start generation.",
      });
    }
  };

  // Start editing
  const startEditing = (tabType, data = {}) => {
    setEditingTab(tabType);
    setEditData(data);
  };

  // Handle input change with better state management
  const handleInputChange = useCallback((field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Cancel editing
  const cancelEditing = () => {
    setEditingTab(null);
    setEditData({});
  };

  // Handle JSON section save
  const handleJsonSectionSave = async (updatedJson) => {
    try {
      setSaving(true);

      // Create a new version instead of updating the existing document
      const response = await projectAPI.createDocumentVersion(
        project_id,
        activeDocument.documentId,
        { content: updatedJson }
      );

      if (response.data.success) {
        // Add the new document to the local state
        setDocuments((prev) => [response.data.document, ...prev]);

        // Update the active document to the new version
        setActiveDocument(response.data.document);

        toast.success({
          title: "New Version Created",
          description: `Version ${response.data.document.version} has been created successfully.`,
        });
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error({
        title: "Save Failed",
        description: "Failed to save document changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle markdown conversion
  const handleMarkdownConversion = (markdownContent) => {
    setConvertedMarkdown(markdownContent);
    setShowMarkdownView(true);
  };

  // Generate PDF for document
  const generatePDF = async (document) => {
    try {
      toast.info({
        title: "Generating PDF",
        description: `Creating PDF for ${getDocumentTypeLabel(
          document.type
        )}...`,
      });

      const response = await pdfAPI.generateDocumentPDF(
        project_id,
        document.documentId
      );

      if (response.data.success) {
        toast.success({
          title: "PDF Generated",
          description: `PDF for ${getDocumentTypeLabel(
            document.type
          )} has been generated successfully!`,
        });

        // Open download link
        const downloadUrl = `http://localhost:8080${response.data.downloadUrl}`;
        window.open(downloadUrl, "_blank");
      } else {
        throw new Error(response.data.message || "PDF generation failed");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error({
        title: "PDF Generation Failed",
        description:
          error.response?.data?.message ||
          "Failed to generate PDF. Please try again.",
      });
    }
  };

  // Convert JSON to Markdown using n8n webhook
  const convertJsonToMarkdown = async (document, documentType) => {
    try {
      setLoadingMarkdown(true);

      // Create cache key based on document ID and content hash
      const cacheKey = `${document.documentId}_${document.version}`;

      // Check if we have cached markdown for this document
      if (markdownCache[cacheKey]) {
        return markdownCache[cacheKey];
      }

      // Prepare the payload for n8n webhook
      const payload = {
        project_id: project_id,
        stage: documentType.toLowerCase(),
        json: document.content,
        preferred_format: "Markdown",
      };

      // Call n8n webhook
      const response = await fetch(
        "https://reactaksahy57.app.n8n.cloud/webhook/generate-markdown",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const markdownContent = await response.text();

      // Cache the result
      setMarkdownCache((prev) => ({
        ...prev,
        [cacheKey]: markdownContent,
      }));

      return markdownContent;
    } catch (error) {
      console.error("Error converting JSON to Markdown:", error);
      throw error;
    } finally {
      setLoadingMarkdown(false);
    }
  };

  // Handle View & PDF Download button click
  const handleViewAndDownloadDocument = async (document, documentType) => {
    try {
      console.log("=== BUTTON CLICKED ===");
      console.log("Document object:", document);
      console.log("Document type:", documentType);

      setLoadingMarkdown(true);

      // If document doesn't have content, fetch it first
      let documentContent = document.content;
      if (!documentContent) {
        console.log("Document content not available, fetching...");
        try {
          const result = await requirementAPI.getDocument(
            project_id,
            document.documentId
          );
          documentContent = result.data.content;
          console.log("Fetched document content:", documentContent);
        } catch (error) {
          console.error("Error fetching document content:", error);
          throw new Error("Failed to load document content");
        }
      }

      toast.info({
        title: "Generating Professional Document",
        description:
          "Creating professional Word document and uploading to cloud...",
      });

      // Call backend API to generate professional document and upload to S3
      const requestBody = {
        projectId: project_id,
        documentId: document.documentId,
        documentType: documentType,
        content: documentContent,
        projectName: project?.name || "Document",
      };

      console.log("Sending request to backend:", requestBody);

      const response = await fetch(
        `http://localhost:8080/api/actions/convert-to-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Backend response:", result);

      if (result.success && result.documentUrl) {
        console.log("Opening document URL:", result.documentUrl);

        // Open the document in a new tab
        const newWindow = window.open(result.documentUrl, "_blank");

        if (newWindow) {
          console.log("New window opened successfully");
          toast.success({
            title: "Document Generated Successfully",
            description:
              "Professional Word document has been generated and opened in a new tab.",
          });
        } else {
          console.error("Failed to open new window - popup blocked?");

          // Try alternative method - create a temporary link and click it
          const link = document.createElement("a");
          link.href = result.documentUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success({
            title: "Document Generated Successfully",
            description:
              "Professional Word document has been generated and opened in a new tab.",
          });
        }
      } else {
        console.error("Backend error:", result);
        throw new Error(result.message || "Failed to generate document");
      }
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error({
        title: "Failed to Generate Document",
        description:
          "Could not generate professional Word document. Please try again.",
      });
    } finally {
      setLoadingMarkdown(false);
    }
  };

  // Handle PDF Generation button click
  const handlePDFGeneration = async (document, documentType) => {
    try {
      toast.info({
        title: "Generating PDF",
        description: "Converting document and generating PDF...",
      });

      // Call backend API to convert to document and generate PDF
      const response = await fetch(
        "http://localhost:8080/api/pdf/generate-from-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project_id,
            documentId: document.documentId,
            documentType: documentType,
            content: document.content,
            projectName: project?.name || "Document",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const downloadUrl = `http://localhost:8080${result.downloadUrl}`;
          window.open(downloadUrl, "_blank");

          toast.success({
            title: "PDF Generated",
            description: "PDF has been generated and downloaded.",
          });
        } else {
          throw new Error(result.message || "PDF generation failed");
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error({
        title: "PDF Generation Failed",
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  // Tab Components
  // InputTab removed - functionality moved to OverviewTab
  const InputTabRemoved = () => {
    const isEditing = editingTab === "input";
    const inputData = editData.input || project?.input || "";
    const inputType = editData.inputType || project?.inputType || "manual";

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📝</span>
            <h3 className="text-lg font-semibold text-gray-900">
              Project Input
            </h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {inputType}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() =>
                    startEditing("input", {
                      input: project?.input,
                      inputType: project?.inputType,
                      name: project?.name,
                      organizationName: project?.organizationName,
                      contactPersonName: project?.contactPersonName,
                      contactEmail: project?.contactEmail,
                    })
                  }
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() =>
                    generateNextStep("requirements", { input: project?.input })
                  }
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Extract Requirements
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    saveProjectData({
                      input: editData.input,
                      inputType: editData.inputType,
                    })
                  }
                  disabled={saving}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Project Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Project Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              {isEditing ? (
                <input
                  key="project-name-input"
                  type="text"
                  value={editData.name || project?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">{project?.name || "N/A"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              {isEditing ? (
                <input
                  key="organization-name-input"
                  type="text"
                  value={
                    editData.organizationName || project?.organizationName || ""
                  }
                  onChange={(e) =>
                    handleInputChange("organizationName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.organizationName || "N/A"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              {isEditing ? (
                <input
                  key="contact-person-input"
                  type="text"
                  value={
                    editData.contactPersonName ||
                    project?.contactPersonName ||
                    ""
                  }
                  onChange={(e) =>
                    handleInputChange("contactPersonName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact person name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.contactPersonName || "N/A"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              {isEditing ? (
                <input
                  key="contact-email-input"
                  type="email"
                  value={editData.contactEmail || project?.contactEmail || ""}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact email"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.contactEmail || "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Type
                </label>
                <select
                  value={inputType}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      inputType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual Input</option>
                  <option value="transcript">Transcript</option>
                  <option value="file">File Upload</option>
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Content
                </label>
                <textarea
                  value={inputData}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, input: e.target.value }))
                  }
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your project input here..."
                />
              </div>
            </div>
          ) : (
            <div>
              {project?.input ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                    {typeof project.input === "string"
                      ? project.input
                      : JSON.stringify(project.input, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No input data
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click Edit to add input data for this project.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const OverviewTab = useCallback(() => {
    const counts = getDocumentCounts();
    const isEditing = editingTab === "input";
    const inputData = editData.input || project?.input || "";
    const inputType = editData.inputType || project?.inputType || "manual";

    return (
      <div className="space-y-6">
        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  Total Documents
                </p>
                <p className="text-2xl font-semibold text-blue-900">
                  {project.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  Requirements
                </p>
                <p className="text-2xl font-semibold text-green-900">
                  {counts.REQUIREMENTS}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">BRD</p>
                <p className="text-2xl font-semibold text-purple-900">
                  {counts.BRD}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">
                  Blueprints
                </p>
                <p className="text-2xl font-semibold text-orange-900">
                  {counts.BLUEPRINT}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Project Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Information
            </h3>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() =>
                      startEditing("input", {
                        input: project?.input,
                        inputType: project?.inputType,
                        name: project?.name,
                        organizationName: project?.organizationName,
                        contactPersonName: project?.contactPersonName,
                        contactEmail: project?.contactEmail,
                      })
                    }
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Input
                  </button>
                  <button
                    onClick={() =>
                      generateNextStep("requirements", {
                        input: project?.input,
                      })
                    }
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Extract Requirements
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={cancelEditing}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveProjectData(editData)}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              {isEditing ? (
                <input
                  key="project-name-input"
                  type="text"
                  value={editData.name || project?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">{project?.name || "N/A"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              {isEditing ? (
                <input
                  key="organization-name-input"
                  type="text"
                  value={
                    editData.organizationName || project?.organizationName || ""
                  }
                  onChange={(e) =>
                    handleInputChange("organizationName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.organizationName || "N/A"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              {isEditing ? (
                <input
                  key="contact-person-input"
                  type="text"
                  value={
                    editData.contactPersonName ||
                    project?.contactPersonName ||
                    ""
                  }
                  onChange={(e) =>
                    handleInputChange("contactPersonName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact person name"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.contactPersonName || "N/A"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              {isEditing ? (
                <input
                  key="contact-email-input"
                  type="email"
                  value={editData.contactEmail || project?.contactEmail || ""}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact email"
                  autoComplete="off"
                />
              ) : (
                <p className="text-gray-700">
                  {project?.contactEmail || "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Project Input */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Input
            </h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {inputType}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Type
                </label>
                <select
                  value={inputType}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      inputType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual Input</option>
                  <option value="transcript">Transcript</option>
                  <option value="file">File Upload</option>
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Content
                </label>
                <textarea
                  value={inputData}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, input: e.target.value }))
                  }
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your project input here..."
                />
              </div>
            </div>
          ) : (
            <div>
              {project?.input ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                    {typeof project.input === "string"
                      ? project.input
                      : JSON.stringify(project.input, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No input content available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    project,
    editData,
    editingTab,
    getDocumentCounts,
    handleInputChange,
    startEditing,
    generateNextStep,
    cancelEditing,
    saveProjectData,
    saving,
  ]);

  const DocumentTab = ({ documentType, title, icon, color, nextStepType }) => {
    const organized = organizeDocumentsByType();
    const docs = organized[documentType] || [];
    const isEditing = editingTab === documentType;
    const latestDoc = docs[0];

    console.log(`DocumentTab ${documentType}:`, {
      docsCount: docs.length,
      latestDoc: latestDoc,
      hasContent: latestDoc?.content ? "yes" : "no",
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {docs.length} version{docs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {(documentType === "REQUIREMENTS" ||
              documentType === "BRD" ||
              documentType === "BLUEPRINT") && (
              <>
                {docs.length > 0 ? (
                  <button
                    onClick={(e) => {
                      console.log("Button clicked!", {
                        documentType,
                        latestDoc,
                      });
                      e.preventDefault();
                      handleViewAndDownloadDocument(latestDoc, documentType);
                    }}
                    disabled={loadingMarkdown}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      loadingMarkdown
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    }`}
                  >
                    {loadingMarkdown ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating Document...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        View & PDF Download
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={true}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    No Document Available
                  </button>
                )}
                {nextStepType && (
                  <button
                    onClick={() =>
                      generateNextStep(nextStepType, {
                        content: latestDoc?.content,
                      })
                    }
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate {nextStepType}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Current Version Display */}
        {docs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Current Version
              </h4>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Latest
                </span>
                <span className="text-sm text-gray-500">
                  Version {latestDoc.version || 1}
                </span>
              </div>
            </div>
            {/* Check if content is JSON and render accordingly */}
            {(() => {
              try {
                const content =
                  typeof latestDoc.content === "string"
                    ? JSON.parse(latestDoc.content)
                    : latestDoc.content;
                if (typeof content === "object" && content !== null) {
                  // It's JSON, use the appropriate section editor
                  if (documentType === "REQUIREMENTS") {
                    return (
                      <RequirementsSectionEditor
                        document={latestDoc}
                        documentType={documentType}
                        onSave={handleJsonSectionSave}
                        onConvert={handleMarkdownConversion}
                      />
                    );
                  } else if (documentType === "BRD") {
                    return (
                      <BRDSectionEditor
                        document={latestDoc}
                        documentType={documentType}
                        onSave={handleJsonSectionSave}
                        onConvert={handleMarkdownConversion}
                      />
                    );
                  } else if (documentType === "BLUEPRINT") {
                    return (
                      <BlueprintSectionEditor
                        document={latestDoc}
                        documentType={documentType}
                        onSave={handleJsonSectionSave}
                        onConvert={handleMarkdownConversion}
                      />
                    );
                  } else {
                    return (
                      <JsonSectionEditor
                        document={latestDoc}
                        documentType={documentType}
                        onSave={handleJsonSectionSave}
                        onConvert={handleMarkdownConversion}
                      />
                    );
                  }
                } else {
                  // It's not JSON, show as plain text
                  return (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                        {typeof latestDoc.content === "string"
                          ? latestDoc.content
                          : JSON.stringify(latestDoc.content, null, 2)}
                      </pre>
                    </div>
                  );
                }
              } catch (error) {
                // Not valid JSON, show as plain text
                return (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                      {typeof latestDoc.content === "string"
                        ? latestDoc.content
                        : JSON.stringify(latestDoc.content, null, 2)}
                    </pre>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Version History */}
        {docs.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Version History
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {docs.map((doc, index) => (
                    <tr
                      key={doc.documentId}
                      className={index === 0 ? "bg-green-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span>v{doc.version || 1}</span>
                          {index === 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.documentId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            index === 0
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {index === 0 ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDocumentClick(doc)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => generatePDF(doc)}
                            className="text-red-600 hover:text-red-900"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Editing Mode */}
        {isEditing && latestDoc && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Edit {title}
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    saveDocumentData(latestDoc.documentId, {
                      content: editData.content,
                    })
                  }
                  disabled={saving}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            <textarea
              value={editData.content || ""}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter document content here..."
            />
          </div>
        )}

        {/* No Documents Message */}
        {docs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No {title.toLowerCase()} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This project doesn't have any {title.toLowerCase()} yet.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Error loading project!
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Project not found!
              </h3>
              <p className="text-yellow-700">
                The project you're looking for doesn't exist or has been
                deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {project.name}
          </h1>
          <div className="flex items-center space-x-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {project.status}
            </span>
            <span className="text-sm text-gray-500">ID: {project.req_id}</span>
            <span className="text-sm text-gray-500">
              Created: {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              {
                id: "requirements",
                label: "Requirements",
                icon: "📋",
                count: getDocumentCounts().REQUIREMENTS,
              },
              {
                id: "brd",
                label: "BRD",
                icon: "📄",
                count: getDocumentCounts().BRD,
              },
              {
                id: "blueprint",
                label: "Blueprint",
                icon: "🏗️",
                count: getDocumentCounts().BLUEPRINT,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "requirements" && (
            <DocumentTab
              documentType="REQUIREMENTS"
              title="Requirements"
              icon="📋"
              color="blue"
              nextStepType="BRD"
            />
          )}
          {activeTab === "brd" && (
            <DocumentTab
              documentType="BRD"
              title="Business Requirements Document"
              icon="📄"
              color="green"
              nextStepType="Blueprint"
            />
          )}
          {activeTab === "blueprint" && (
            <DocumentTab
              documentType="BLUEPRINT"
              title="Project Blueprint"
              icon="🏗️"
              color="purple"
              nextStepType="Implementation"
            />
          )}
        </div>
      </div>

      {/* Markdown View Modal */}
      {showMarkdownView && convertedMarkdown && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Converted Document
                  </h3>
                  <button
                    onClick={() => {
                      setShowMarkdownView(false);
                      setConvertedMarkdown(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {convertedMarkdown}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setShowMarkdownView(false);
                    setConvertedMarkdown(null);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && convertedMarkdown && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Document Viewer
                  </h3>
                  <button
                    onClick={() => setShowDocumentViewer(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {convertedMarkdown}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowDocumentViewer(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Content Modal */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getDocumentTypeLabel(activeDocument.type)} - Version{" "}
                    {activeDocument.version || 1}
                  </h3>
                  <button
                    onClick={() => {
                      setActiveDocument(null);
                      setDocumentContent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingDocument ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  ) : documentContent ? (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {typeof documentContent.content === "string"
                          ? documentContent.content
                          : JSON.stringify(documentContent.content, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No content available</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setActiveDocument(null);
                    setDocumentContent(null);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
