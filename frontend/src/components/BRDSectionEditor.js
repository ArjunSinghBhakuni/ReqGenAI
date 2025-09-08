import React, { useState, useEffect } from "react";
import { projectAPI } from "../services/api";
import { useToast } from "../utils/toast";

const BRDSectionEditor = ({ document, documentType, onSave, onConvert }) => {
  const [sections, setSections] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    console.log("BRDSectionEditor - Document received:", document);
    if (document?.content) {
      console.log("BRDSectionEditor - Content:", document.content);
      parseJsonContent(document.content);
    }
  }, [document]);

  const parseJsonContent = (content) => {
    try {
      console.log("BRDSectionEditor - Parsing content:", content);
      const data = typeof content === "string" ? JSON.parse(content) : content;
      console.log("BRDSectionEditor - Parsed data:", data);
      const parsedSections = {};

      // Parse BRD content - handle both old and new formats
      let brd = null;
      if (data.brd) {
        brd = data.brd;
      } else if (data.project_info || data.requirements || data.constraints) {
        // Handle direct BRD format from N8N
        brd = data;
      }

      if (brd) {
        // Executive Summary
        if (brd.executive_summary) {
          parsedSections["Executive Summary"] = {
            executive_summary: brd.executive_summary,
          };
        }

        // Business Objectives
        if (brd.business_objectives) {
          parsedSections["Business Objectives"] = {
            business_objectives: brd.business_objectives,
          };
        }

        // Functional Requirements
        if (brd.functional_requirements) {
          // Convert string values to arrays if needed
          const functionalReqs = {};
          Object.entries(brd.functional_requirements).forEach(
            ([key, value]) => {
              if (typeof value === "string") {
                // Split by common separators and clean up
                functionalReqs[key] = value
                  .split(/[,\n]/)
                  .map((item) => item.trim())
                  .filter((item) => item);
              } else {
                functionalReqs[key] = value;
              }
            }
          );
          parsedSections["Functional Requirements"] = {
            functional_requirements: functionalReqs,
          };
        }

        // Non-Functional Requirements
        if (brd.non_functional_requirements) {
          // Convert string values to arrays if needed
          const nonFunctionalReqs = {};
          Object.entries(brd.non_functional_requirements).forEach(
            ([key, value]) => {
              if (typeof value === "string") {
                // Split by common separators and clean up
                nonFunctionalReqs[key] = value
                  .split(/[,\n]/)
                  .map((item) => item.trim())
                  .filter((item) => item);
              } else {
                nonFunctionalReqs[key] = value;
              }
            }
          );
          parsedSections["Non-Functional Requirements"] = {
            non_functional_requirements: nonFunctionalReqs,
          };
        }

        // Technical Specifications
        if (brd.technical_specifications) {
          parsedSections["Technical Specifications"] = {
            technical_specifications: brd.technical_specifications,
          };
        }

        // Project Timeline
        if (brd.project_timeline) {
          parsedSections["Project Timeline"] = {
            project_timeline: brd.project_timeline,
          };
        }

        // Budget Estimation
        if (brd.budget_estimation) {
          parsedSections["Budget Estimation"] = {
            budget_estimation: brd.budget_estimation,
          };
        }

        // NEW N8N FORMAT SECTIONS
        // Project Information
        if (brd.project_info) {
          parsedSections["Project Information"] = {
            project_info: brd.project_info,
          };
        }

        // Requirements (from N8N format)
        if (brd.requirements) {
          parsedSections["Requirements"] = {
            requirements: brd.requirements,
          };
        }

        // Constraints (from N8N format)
        if (brd.constraints) {
          parsedSections["Constraints"] = {
            constraints: brd.constraints,
          };
        }
      }

      // Parse Constraints
      if (data.constraints) {
        parsedSections["Constraints"] = {
          constraints: data.constraints,
        };
      }

      // Parse Assumptions
      if (data.assumptions) {
        parsedSections["Assumptions"] = {
          assumptions: data.assumptions,
        };
      }

      console.log("BRDSectionEditor - Final parsed sections:", parsedSections);
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

    // Convert BRD content
    const brd = {};

    if (sections["Executive Summary"]) {
      brd.executive_summary = sections["Executive Summary"].executive_summary;
    }

    if (sections["Business Objectives"]) {
      brd.business_objectives =
        sections["Business Objectives"].business_objectives;
    }

    if (sections["Functional Requirements"]) {
      brd.functional_requirements =
        sections["Functional Requirements"].functional_requirements;
    }

    if (sections["Non-Functional Requirements"]) {
      brd.non_functional_requirements =
        sections["Non-Functional Requirements"].non_functional_requirements;
    }

    if (sections["Technical Specifications"]) {
      brd.technical_specifications =
        sections["Technical Specifications"].technical_specifications;
    }

    if (sections["Project Timeline"]) {
      brd.project_timeline = sections["Project Timeline"].project_timeline;
    }

    if (sections["Budget Estimation"]) {
      brd.budget_estimation = sections["Budget Estimation"].budget_estimation;
    }

    if (Object.keys(brd).length > 0) {
      json.brd = brd;
    }

    // Convert Constraints
    if (sections["Constraints"]) {
      json.constraints = sections["Constraints"].constraints;
    }

    // Convert Assumptions
    if (sections["Assumptions"]) {
      json.assumptions = sections["Assumptions"].assumptions;
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

  const renderObjectField = (label, obj, onChange, isArrayValue = false) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {Object.entries(obj).map(([key, value], index) => (
        <div
          key={index}
          className="p-3 border border-gray-200 rounded-md space-y-2"
        >
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={key}
              onChange={(e) => {
                const newObj = { ...obj };
                delete newObj[key];
                newObj[e.target.value] = value;
                onChange(newObj);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Key"
            />
            <button
              type="button"
              onClick={() => {
                const newObj = { ...obj };
                delete newObj[key];
                onChange(newObj);
              }}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
          {isArrayValue && Array.isArray(value) ? (
            <div className="space-y-2">
              {value.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newObj = { ...obj };
                      const newArray = [...value];
                      newArray[idx] = e.target.value;
                      newObj[key] = newArray;
                      onChange(newObj);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${key} ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newObj = { ...obj };
                      const newArray = value.filter((_, i) => i !== idx);
                      newObj[key] = newArray;
                      onChange(newObj);
                    }}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newObj = { ...obj };
                  const newArray = [...value, ""];
                  newObj[key] = newArray;
                  onChange(newObj);
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                + Add {key}
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const newObj = { ...obj };
                newObj[key] = e.target.value;
                onChange(newObj);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Value"
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...obj, "": isArrayValue ? [] : "" })}
        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
      >
        + Add {label}
      </button>
    </div>
  );

  const renderSectionContent = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Executive Summary":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Executive Summary
              </label>
              <textarea
                value={editData.executive_summary || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    executive_summary: e.target.value,
                  }))
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter executive summary"
              />
            </div>
          </div>
        );

      case "Business Objectives":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Business Objectives",
              editData.business_objectives || [],
              (value) =>
                setEditData((prev) => ({ ...prev, business_objectives: value }))
            )}
          </div>
        );

      case "Functional Requirements":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Functional Requirements",
              editData.functional_requirements || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  functional_requirements: value,
                })),
              true // isArrayValue = true
            )}
          </div>
        );

      case "Non-Functional Requirements":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Non-Functional Requirements",
              editData.non_functional_requirements || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  non_functional_requirements: value,
                })),
              true // isArrayValue = true
            )}
          </div>
        );

      case "Technical Specifications":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Technical Specifications",
              editData.technical_specifications || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  technical_specifications: value,
                }))
            )}
          </div>
        );

      case "Project Timeline":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Project Timeline",
              editData.project_timeline || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  project_timeline: value,
                }))
            )}
          </div>
        );

      case "Budget Estimation":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Budget Estimation",
              editData.budget_estimation || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  budget_estimation: value,
                }))
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

      case "Assumptions":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Assumptions",
              editData.assumptions || [],
              (value) =>
                setEditData((prev) => ({ ...prev, assumptions: value }))
            )}
          </div>
        );

      case "Project Information":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Project Information",
              editData.project_info || {},
              (value) =>
                setEditData((prev) => ({ ...prev, project_info: value }))
            )}
          </div>
        );

      case "Requirements":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Requirements",
              editData.requirements || {},
              (value) =>
                setEditData((prev) => ({ ...prev, requirements: value }))
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
      case "Executive Summary":
        return (
          <div>
            <p className="text-gray-700">
              {sectionData.executive_summary || "Not specified"}
            </p>
          </div>
        );

      case "Business Objectives":
        return (
          <div>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {sectionData.business_objectives?.map((obj, index) => (
                <li key={index}>{obj}</li>
              )) || <li className="text-gray-500">None specified</li>}
            </ul>
          </div>
        );

      case "Functional Requirements":
        return (
          <div className="space-y-3">
            {Object.entries(sectionData.functional_requirements || {}).map(
              ([key, value], index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h6 className="font-medium text-gray-900">{key}</h6>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1">
                    {Array.isArray(value) ? (
                      value.map((item, idx) => <li key={idx}>{item}</li>)
                    ) : (
                      <li>{value}</li>
                    )}
                  </ul>
                </div>
              )
            )}
            {Object.keys(sectionData.functional_requirements || {}).length ===
              0 && <p className="text-gray-500">None specified</p>}
          </div>
        );

      case "Non-Functional Requirements":
        return (
          <div className="space-y-3">
            {Object.entries(sectionData.non_functional_requirements || {}).map(
              ([key, value], index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <h6 className="font-medium text-gray-900">{key}</h6>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1">
                    {Array.isArray(value) ? (
                      value.map((item, idx) => <li key={idx}>{item}</li>)
                    ) : (
                      <li>{value}</li>
                    )}
                  </ul>
                </div>
              )
            )}
            {Object.keys(sectionData.non_functional_requirements || {})
              .length === 0 && <p className="text-gray-500">None specified</p>}
          </div>
        );

      case "Technical Specifications":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.technical_specifications || {}).map(
              ([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              )
            )}
            {Object.keys(sectionData.technical_specifications || {}).length ===
              0 && <p className="text-gray-500">None specified</p>}
          </div>
        );

      case "Project Timeline":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.project_timeline || {}).map(
              ([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              )
            )}
            {Object.keys(sectionData.project_timeline || {}).length === 0 && (
              <p className="text-gray-500">None specified</p>
            )}
          </div>
        );

      case "Budget Estimation":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.budget_estimation || {}).map(
              ([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              )
            )}
            {Object.keys(sectionData.budget_estimation || {}).length === 0 && (
              <p className="text-gray-500">None specified</p>
            )}
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

      case "Assumptions":
        return (
          <div>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {sectionData.assumptions?.map((assumption, index) => (
                <li key={index}>{assumption}</li>
              )) || <li className="text-gray-500">None specified</li>}
            </ul>
          </div>
        );

      case "Project Information":
        return (
          <div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Project Information</h4>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {sectionData.project_info?.name || "Not specified"}
                </p>
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {sectionData.project_info?.description || "Not specified"}
                </p>
                {sectionData.project_info?.business_objectives && (
                  <div>
                    <p className="font-medium">Business Objectives:</p>
                    <ul className="list-disc list-inside ml-4">
                      {sectionData.project_info.business_objectives.map(
                        (obj, index) => (
                          <li key={index}>{obj}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {sectionData.project_info?.success_metrics && (
                  <div>
                    <p className="font-medium">Success Metrics:</p>
                    <ul className="list-disc list-inside ml-4">
                      {sectionData.project_info.success_metrics.map(
                        (metric, index) => (
                          <li key={index}>{metric}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {sectionData.project_info?.stakeholders && (
                  <div>
                    <p className="font-medium">Stakeholders:</p>
                    <ul className="list-disc list-inside ml-4">
                      {sectionData.project_info.stakeholders.map(
                        (stakeholder, index) => (
                          <li key={index}>
                            {stakeholder.role}: {stakeholder.contact}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "Requirements":
        return (
          <div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Requirements</h4>
              {sectionData.requirements?.functional && (
                <div>
                  <h5 className="font-medium text-gray-800">
                    Functional Requirements:
                  </h5>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {sectionData.requirements.functional.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sectionData.requirements?.non_functional && (
                <div>
                  <h5 className="font-medium text-gray-800">
                    Non-Functional Requirements:
                  </h5>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {sectionData.requirements.non_functional.map(
                      (req, index) => (
                        <li key={index}>{req}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case "Constraints":
        return (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Constraints</h4>
            <ul className="list-disc list-inside space-y-1">
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
        <p className="text-gray-500">No BRD data available</p>
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

export default BRDSectionEditor;
