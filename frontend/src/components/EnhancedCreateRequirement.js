import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requirementAPI } from "../services/api";
import { useToast } from "../utils/toast";
import VoiceInput from "./VoiceInput";
import FileUpload from "./FileUpload";

const EnhancedCreateRequirement = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [inputType, setInputType] = useState("manual");
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    organizationName: "",
    contactPersonName: "",
    contactEmail: "",
    filename: "",
  });

  // Separate content state for each input method
  const [inputContent, setInputContent] = useState({
    manual: "",
    voice: "",
    transcript: "",
    file: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContentChange = (method, content) => {
    setInputContent((prev) => ({
      ...prev,
      [method]: content,
    }));
  };

  const handleFileTextExtracted = (text, filename) => {
    setInputContent((prev) => ({
      ...prev,
      file: text,
    }));
    setFormData((prev) => ({
      ...prev,
      filename: filename,
    }));
  };

  const handleFileError = (error) => {
    toast.error({
      title: "File Upload Error",
      description: error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentContent = inputContent[inputType];
    if (
      !currentContent ||
      typeof currentContent !== "string" ||
      !currentContent.trim()
    ) {
      toast.error({
        title: "Content Required",
        description: "Please provide content for your requirement.",
      });
      return;
    }

    try {
      setLoading(true);

      let response;
      const projectData = {
        name: formData.name,
        organizationName: formData.organizationName,
        contactPersonName: formData.contactPersonName,
        contactEmail: formData.contactEmail,
      };

      switch (inputType) {
        case "manual":
          response = await requirementAPI.createManual(
            currentContent,
            projectData
          );
          break;
        case "voice":
          response = await requirementAPI.createVoice(
            currentContent,
            projectData
          );
          break;
        case "transcript":
          response = await requirementAPI.createTranscript(
            currentContent,
            formData.filename || "transcript"
          );
          break;
        case "file":
          response = await requirementAPI.createFile(
            formData.filename,
            currentContent
          );
          break;
        default:
          throw new Error("Invalid input type");
      }

      if (response.data.success) {
        toast.success({
          title: "Project Created",
          description: "Your project has been created successfully!",
        });

        // Navigate to project detail page
        navigate(`/project/${response.data.project_id}`);
      }
    } catch (error) {
      console.error("Error creating requirement:", error);
      toast.error({
        title: "Creation Failed",
        description:
          error.response?.data?.message ||
          "Failed to create requirement. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInputForm = () => {
    switch (inputType) {
      case "manual":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={inputContent.manual}
                onChange={(e) => handleContentChange("manual", e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your project requirements, goals, and any specific details..."
                required
              />
            </div>
          </div>
        );

      case "voice":
        return (
          <div className="space-y-4">
            <VoiceInput
              onTranscriptChange={(transcript) => {
                handleContentChange("voice", transcript);
              }}
              initialValue={inputContent.voice}
            />
          </div>
        );

      case "transcript":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source/Meeting Name
              </label>
              <input
                type="text"
                name="filename"
                value={formData.filename}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Client Meeting, Stakeholder Discussion"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transcript Content *
              </label>
              <textarea
                value={inputContent.transcript}
                onChange={(e) =>
                  handleContentChange("transcript", e.target.value)
                }
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your transcript content here..."
                required
              />
            </div>
          </div>
        );

      case "file":
        return (
          <div className="space-y-4">
            {/* File Upload Component */}
            <FileUpload
              onTextExtracted={handleFileTextExtracted}
              onError={handleFileError}
            />

            {/* Manual File Name Input (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name (Optional)
              </label>
              <input
                type="text"
                name="filename"
                value={formData.filename}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., requirements.docx, project-brief.pdf"
              />
            </div>

            {/* Extracted/Manual Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Content *
              </label>
              <textarea
                value={inputContent.file}
                onChange={(e) => handleContentChange("file", e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Upload a file above to extract text automatically, or paste content manually here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Upload a DOCX, PDF, PPT, or PPTX file to automatically
                extract text, or paste content manually.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Project
          </h1>
          <p className="text-gray-600">
            Add your project requirements using different input methods
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Project Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact email"
                />
              </div>
            </div>
          </div>

          {/* Input Type Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Input Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  value: "manual",
                  label: "Manual Input",
                  icon: "✍️",
                  description: "Type your requirements directly",
                },
                {
                  value: "voice",
                  label: "Voice Input",
                  icon: "🎙️",
                  description: "Speak your requirements",
                },
                {
                  value: "transcript",
                  label: "Transcript",
                  icon: "🎤",
                  description: "Paste meeting or call transcript",
                },
                {
                  value: "file",
                  label: "File Content",
                  icon: "📄",
                  description: "Extract content from documents",
                },
              ].map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    inputType === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setInputType(option.value)}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <h3 className="font-semibold text-gray-900">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Content
            </h2>
            {renderInputForm()}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedCreateRequirement;
