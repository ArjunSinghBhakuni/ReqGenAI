import React, { useState, useEffect } from "react";
import { projectAPI } from "../services/api";
import { useToast } from "../utils/toast";

const RequirementsSectionEditor = ({
  document,
  documentType,
  onSave,
  onConvert,
}) => {
  const [sections, setSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    console.log("RequirementsSectionEditor - Document received:", document);
    if (document?.content) {
      console.log("RequirementsSectionEditor - Content:", document.content);
      parseJsonContent(document.content);
    }
  }, [document]);

  const parseJsonContent = (content) => {
    try {
      console.log("RequirementsSectionEditor - Parsing content:", content);
      const data = typeof content === "string" ? JSON.parse(content) : content;
      console.log("RequirementsSectionEditor - Parsed data:", data);
      const parsedSections = {};

      // Parse Project Information
      if (data.project_info) {
        parsedSections["Project Information"] = {
          name: data.project_info.name || "",
          description: data.project_info.description || "",
          business_objectives: data.project_info.business_objectives || [],
          success_metrics: data.project_info.success_metrics || [],
          stakeholders: data.project_info.stakeholders || [],
        };
      }

      // Parse Requirements
      if (data.requirements) {
        parsedSections["Functional Requirements"] = {
          functional: data.requirements.functional || [],
        };
        parsedSections["Non-Functional Requirements"] = {
          non_functional: data.requirements.non_functional || [],
        };
      }

      // Parse Constraints
      if (data.constraints) {
        parsedSections["Constraints"] = {
          constraints: data.constraints || [],
        };
      }

      console.log(
        "RequirementsSectionEditor - Final parsed sections:",
        parsedSections
      );
      setSections(parsedSections);
    } catch (error) {
      console.error("Error parsing JSON content:", error);
      toast.error({
        title: "Parse Error",
        description: "Failed to parse document content",
      });
    }
  };

  const startEditing = (sectionName, sectionData) => {
    setEditingSection(sectionName);
    setEditData({ ...sectionData });
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
        [editingSection]: { ...editData },
      };

      // Convert sections back to the original JSON format
      const updatedJson = convertSectionsToJson(updatedSections);

      // Call the parent's onSave function with the updated JSON
      await onSave(updatedJson);

      // Update local state
      setSections(updatedSections);
      setEditingSection(null);
      setEditData({});

      toast.success({
        title: "Section Saved",
        description: `${editingSection} has been updated successfully`,
      });
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error({
        title: "Save Failed",
        description: "Failed to save section changes",
      });
    } finally {
      setSaving(false);
    }
  };

  const convertSectionsToJson = (sections) => {
    const json = {};

    // Convert Project Information
    if (sections["Project Information"]) {
      json.project_info = {
        name: sections["Project Information"].name,
        description: sections["Project Information"].description,
        business_objectives:
          sections["Project Information"].business_objectives,
        success_metrics: sections["Project Information"].success_metrics,
        stakeholders: sections["Project Information"].stakeholders,
      };
    }

    // Convert Requirements
    const functional = sections["Functional Requirements"]?.functional || [];
    const non_functional =
      sections["Non-Functional Requirements"]?.non_functional || [];

    if (functional.length > 0 || non_functional.length > 0) {
      json.requirements = {
        functional,
        non_functional,
      };
    }

    // Convert Constraints
    if (sections["Constraints"]) {
      json.constraints = sections["Constraints"].constraints;
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
      }
    } catch (error) {
      console.error("Error converting to markdown:", error);
      toast.error({
        title: "Conversion Failed",
        description: "Failed to convert to markdown",
      });
    } finally {
      setConverting(false);
    }
  };

  const renderArrayField = (label, array, onChange) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {array.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const newArray = [...array];
              newArray[index] = e.target.value;
              onChange(newArray);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`${label} ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => {
              const newArray = array.filter((_, i) => i !== index);
              onChange(newArray);
            }}
            className="px-2 py-1 text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...array, ""])}
        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
      >
        + Add {label}
      </button>
    </div>
  );

  const renderStakeholdersField = (stakeholders, onChange) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Stakeholders
      </label>
      {stakeholders.map((stakeholder, index) => (
        <div
          key={index}
          className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md"
        >
          <input
            type="text"
            value={stakeholder.role || ""}
            onChange={(e) => {
              const newStakeholders = [...stakeholders];
              newStakeholders[index] = {
                ...newStakeholders[index],
                role: e.target.value,
              };
              onChange(newStakeholders);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Role"
          />
          <input
            type="text"
            value={stakeholder.contact || ""}
            onChange={(e) => {
              const newStakeholders = [...stakeholders];
              newStakeholders[index] = {
                ...newStakeholders[index],
                contact: e.target.value,
              };
              onChange(newStakeholders);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contact"
          />
          <button
            type="button"
            onClick={() => {
              const newStakeholders = stakeholders.filter(
                (_, i) => i !== index
              );
              onChange(newStakeholders);
            }}
            className="px-2 py-1 text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...stakeholders, { role: "", contact: "" }])}
        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
      >
        + Add Stakeholder
      </button>
    </div>
  );

  const renderSectionContent = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Project Information":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
              />
            </div>
            {renderArrayField(
              "Business Objectives",
              editData.business_objectives || [],
              (value) =>
                setEditData((prev) => ({ ...prev, business_objectives: value }))
            )}
            {renderArrayField(
              "Success Metrics",
              editData.success_metrics || [],
              (value) =>
                setEditData((prev) => ({ ...prev, success_metrics: value }))
            )}
            {renderStakeholdersField(editData.stakeholders || [], (value) =>
              setEditData((prev) => ({ ...prev, stakeholders: value }))
            )}
          </div>
        );

      case "Functional Requirements":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Functional Requirements",
              editData.functional || [],
              (value) => setEditData((prev) => ({ ...prev, functional: value }))
            )}
          </div>
        );

      case "Non-Functional Requirements":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Non-Functional Requirements",
              editData.non_functional || [],
              (value) =>
                setEditData((prev) => ({ ...prev, non_functional: value }))
            )}
          </div>
        );

      case "Constraints":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Constraints",
              editData.constraints || [],
              (value) =>
                setEditData((prev) => ({ ...prev, constraints: value }))
            )}
          </div>
        );

      default:
        return <div>Unknown section type</div>;
    }
  };

  const renderSectionDisplay = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Project Information":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Project Name</h5>
              <p className="text-gray-700">
                {sectionData.name || "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Description</h5>
              <p className="text-gray-700">
                {sectionData.description || "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Business Objectives</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.business_objectives?.map((obj, index) => (
                  <li key={index}>{obj}</li>
                )) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Success Metrics</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.success_metrics?.map((metric, index) => (
                  <li key={index}>{metric}</li>
                )) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Stakeholders</h5>
              <div className="space-y-2">
                {sectionData.stakeholders?.map((stakeholder, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="font-medium">{stakeholder.role}:</span>
                    <span className="text-gray-700">{stakeholder.contact}</span>
                  </div>
                )) || <p className="text-gray-500">None specified</p>}
              </div>
            </div>
          </div>
        );

      case "Functional Requirements":
        return (
          <div>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {sectionData.functional?.map((req, index) => (
                <li key={index}>{req}</li>
              )) || <li className="text-gray-500">None specified</li>}
            </ul>
          </div>
        );

      case "Non-Functional Requirements":
        return (
          <div>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {sectionData.non_functional?.map((req, index) => (
                <li key={index}>{req}</li>
              )) || <li className="text-gray-500">None specified</li>}
            </ul>
          </div>
        );

      case "Constraints":
        return (
          <div>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {sectionData.constraints?.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              )) || <li className="text-gray-500">None specified</li>}
            </ul>
          </div>
        );

      default:
        return <div>Unknown section type</div>;
    }
  };

  if (Object.keys(sections).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No requirements data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={convertToMarkdown}
          disabled={converting}
          className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {converting ? "Converting..." : "View"}
        </button>
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

export default RequirementsSectionEditor;
