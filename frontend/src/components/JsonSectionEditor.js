import React, { useState, useEffect } from "react";
import { projectAPI } from "../services/api";
import { useToast } from "../utils/toast";

const JsonSectionEditor = ({ document, documentType, onSave, onConvert }) => {
  const [sections, setSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (document?.content) {
      parseJsonContent(document.content);
    }
  }, [document]);

  const parseJsonContent = (content) => {
    try {
      const data = typeof content === "string" ? JSON.parse(content) : content;
      const parsedSections = {};

      // Parse different document types
      if (data.project_info) {
        parsedSections["Project Information"] = {
          name: data.project_info.name || "",
          description: data.project_info.description || "",
          business_objectives: data.project_info.business_objectives || [],
          success_metrics: data.project_info.success_metrics || [],
          stakeholders: data.project_info.stakeholders || [],
        };
      }

      if (data.requirements) {
        parsedSections["Requirements"] = {
          functional: data.requirements.functional || [],
          non_functional: data.requirements.non_functional || [],
        };
      }

      if (data.constraints) {
        parsedSections["Constraints"] = {
          constraints: data.constraints || [],
        };
      }

      if (data.blueprint) {
        parsedSections["Project Blueprint"] = {
          project_overview: data.blueprint.project_overview || {},
          feature_breakdown: data.blueprint.feature_breakdown || [],
          technical_architecture: data.blueprint.technical_architecture || {},
          user_experience_flow: data.blueprint.user_experience_flow || {},
          timeline_milestones: data.blueprint.timeline_milestones || [],
          resource_requirements: data.blueprint.resource_requirements || [],
          risk_assessment: data.blueprint.risk_assessment || [],
          assumptions: data.blueprint.assumptions || [],
          next_steps: data.blueprint.next_steps || [],
        };
      }

      setSections(parsedSections);
    } catch (error) {
      console.error("Error parsing JSON content:", error);
      toast.error({
        title: "Parse Error",
        description: "Failed to parse JSON content. Please check the format.",
      });
    }
  };

  const startEditing = (sectionName, sectionData) => {
    setEditingSection(sectionName);
    setEditData(sectionData);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveSection = async () => {
    try {
      setSaving(true);

      // Update the sections with edited data
      const updatedSections = {
        ...sections,
        [editingSection]: editData,
      };

      // Convert back to original JSON format
      const updatedJson = convertSectionsToJson(updatedSections);

      // Save to database
      await onSave(updatedJson);

      // Update local state
      setSections(updatedSections);
      setEditingSection(null);
      setEditData({});

      toast.success({
        title: "Section Saved",
        description: `${editingSection} has been updated successfully.`,
      });
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error({
        title: "Save Failed",
        description: "Failed to save section changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const convertSectionsToJson = (sections) => {
    const json = {};

    if (sections["Project Information"]) {
      json.project_info = sections["Project Information"];
    }

    if (sections["Requirements"]) {
      json.requirements = sections["Requirements"];
    }

    if (sections["Constraints"]) {
      json.constraints = sections["Constraints"].constraints;
    }

    if (sections["Project Blueprint"]) {
      json.blueprint = sections["Project Blueprint"];
    }

    return json;
  };

  const convertToMarkdown = async () => {
    try {
      setConverting(true);

      const jsonContent = convertSectionsToJson(sections);
      const response = await projectAPI.convertJsonToMarkdown(
        jsonContent,
        documentType
      );

      if (response.data.success) {
        onConvert(response.data.markdownContent);
        toast.success({
          title: "Conversion Successful",
          description: "JSON has been converted to Markdown successfully.",
        });
      }
    } catch (error) {
      console.error("Error converting to Markdown:", error);
      toast.error({
        title: "Conversion Failed",
        description: "Failed to convert JSON to Markdown.",
      });
    } finally {
      setConverting(false);
    }
  };

  const renderSectionContent = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Project Information":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Objectives
              </label>
              <textarea
                value={editData.business_objectives?.join("\n") || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    business_objectives: e.target.value
                      .split("\n")
                      .filter((item) => item.trim()),
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each objective on a new line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Success Metrics
              </label>
              <textarea
                value={editData.success_metrics?.join("\n") || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    success_metrics: e.target.value
                      .split("\n")
                      .filter((item) => item.trim()),
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each metric on a new line"
              />
            </div>
          </div>
        );

      case "Requirements":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Functional Requirements
              </label>
              <textarea
                value={editData.functional?.join("\n") || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    functional: e.target.value
                      .split("\n")
                      .filter((item) => item.trim()),
                  }))
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each requirement on a new line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Non-Functional Requirements
              </label>
              <textarea
                value={editData.non_functional?.join("\n") || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    non_functional: e.target.value
                      .split("\n")
                      .filter((item) => item.trim()),
                  }))
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter each requirement on a new line"
              />
            </div>
          </div>
        );

      case "Constraints":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Constraints
            </label>
            <textarea
              value={editData.constraints?.join("\n") || ""}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  constraints: e.target.value
                    .split("\n")
                    .filter((item) => item.trim()),
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter each constraint on a new line"
            />
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={JSON.stringify(editData, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditData(parsed);
                } catch (error) {
                  // Keep the text as is if it's not valid JSON
                }
              }}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        );
    }
  };

  const renderSectionDisplay = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Project Information":
        return (
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900">Project Name</h4>
              <p className="text-gray-700">{sectionData.name || "N/A"}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Description</h4>
              <p className="text-gray-700">
                {sectionData.description || "N/A"}
              </p>
            </div>
            {sectionData.business_objectives?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">
                  Business Objectives
                </h4>
                <ul className="list-disc list-inside text-gray-700">
                  {sectionData.business_objectives.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            {sectionData.success_metrics?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">Success Metrics</h4>
                <ul className="list-disc list-inside text-gray-700">
                  {sectionData.success_metrics.map((metric, index) => (
                    <li key={index}>{metric}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "Requirements":
        return (
          <div className="space-y-4">
            {sectionData.functional?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">
                  Functional Requirements
                </h4>
                <ul className="list-disc list-inside text-gray-700">
                  {sectionData.functional.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {sectionData.non_functional?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">
                  Non-Functional Requirements
                </h4>
                <ul className="list-disc list-inside text-gray-700">
                  {sectionData.non_functional.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "Constraints":
        return (
          <div>
            {sectionData.constraints?.length > 0 && (
              <ul className="list-disc list-inside text-gray-700">
                {sectionData.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            )}
          </div>
        );

      default:
        return (
          <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md overflow-x-auto">
            {JSON.stringify(sectionData, null, 2)}
          </pre>
        );
    }
  };

  if (Object.keys(sections).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>
          No structured content found. This document may not be in the expected
          JSON format.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Document Sections
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={convertToMarkdown}
            disabled={converting}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {converting ? "Converting..." : "Convert to Markdown"}
          </button>
        </div>
      </div>

      {/* Sections */}
      {Object.entries(sections).map(([sectionName, sectionData]) => (
        <div
          key={sectionName}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {sectionName}
            </h4>
            <button
              onClick={() => startEditing(sectionName, sectionData)}
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
          </div>

          {editingSection === sectionName ? (
            <div className="space-y-4">
              {renderSectionContent(sectionName, sectionData)}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSection}
                  disabled={saving}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            renderSectionDisplay(sectionName, sectionData)
          )}
        </div>
      ))}
    </div>
  );
};

export default JsonSectionEditor;
