import React, { useState, useEffect } from "react";
import { projectAPI } from "../services/api";
import { useToast } from "../utils/toast";

const BlueprintSectionEditor = ({
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
    console.log("BlueprintSectionEditor - Document received:", document);
    if (document?.content) {
      console.log("BlueprintSectionEditor - Content:", document.content);
      parseJsonContent(document.content);
    }
  }, [document]);

  const parseJsonContent = (content) => {
    try {
      console.log("BlueprintSectionEditor - Parsing content:", content);
      const data = typeof content === "string" ? JSON.parse(content) : content;
      console.log("BlueprintSectionEditor - Parsed data:", data);
      const parsedSections = {};

      // Parse Blueprint content - handle document format with content.blueprint
      let blueprint = null;
      if (data.blueprint) {
        blueprint = data.blueprint;
      } else if (data.content && data.content.blueprint) {
        blueprint = data.content.blueprint;
      } else if (
        data.project_overview ||
        data.feature_breakdown ||
        data.technical_architecture
      ) {
        // Handle direct blueprint format from N8N
        blueprint = data;
      }

      if (blueprint) {
        console.log(
          "BlueprintSectionEditor - Found blueprint data:",
          blueprint
        );

        // Project Overview
        if (blueprint.project_overview) {
          const projectOverview = { ...blueprint.project_overview };

          // Convert objectives string to array if needed
          if (typeof projectOverview.objectives === "string") {
            projectOverview.objectives = projectOverview.objectives
              .split(/[,\n]/)
              .map((item) => item.trim())
              .filter((item) => item);
          }

          parsedSections["Project Overview"] = {
            project_overview: projectOverview,
          };
        }

        // Architecture Design
        if (blueprint.architecture_design) {
          const architectureDesign = { ...blueprint.architecture_design };

          // Convert technology_stack object values to arrays if needed
          if (architectureDesign.technology_stack) {
            const techStack = {};
            Object.entries(architectureDesign.technology_stack).forEach(
              ([key, value]) => {
                if (typeof value === "string") {
                  techStack[key] = value
                    .split(/[,\n]/)
                    .map((item) => item.trim())
                    .filter((item) => item);
                } else {
                  techStack[key] = value;
                }
              }
            );
            architectureDesign.technology_stack = techStack;
          }

          // Convert api_design object values to arrays if needed
          if (architectureDesign.api_design) {
            const apiDesign = {};
            Object.entries(architectureDesign.api_design).forEach(
              ([key, value]) => {
                if (typeof value === "string" && key === "endpoints") {
                  apiDesign[key] = value
                    .split(/[,\n]/)
                    .map((item) => item.trim())
                    .filter((item) => item);
                } else {
                  apiDesign[key] = value;
                }
              }
            );
            architectureDesign.api_design = apiDesign;
          }

          parsedSections["Architecture Design"] = {
            architecture_design: architectureDesign,
          };
        }

        // Database Design
        if (blueprint.database_design) {
          const databaseDesign = { ...blueprint.database_design };

          // Convert schema_design object values to arrays if needed
          if (databaseDesign.schema_design) {
            const schemaDesign = {};
            Object.entries(databaseDesign.schema_design).forEach(
              ([key, value]) => {
                if (typeof value === "string") {
                  schemaDesign[key] = value
                    .split(/[,\n]/)
                    .map((item) => item.trim())
                    .filter((item) => item);
                } else {
                  schemaDesign[key] = value;
                }
              }
            );
            databaseDesign.schema_design = schemaDesign;
          }

          parsedSections["Database Design"] = {
            database_design: databaseDesign,
          };
        }

        // Security Implementation
        if (blueprint.security_implementation) {
          parsedSections["Security Implementation"] = {
            security_implementation: blueprint.security_implementation,
          };
        }

        // Deployment Strategy
        if (blueprint.deployment_strategy) {
          parsedSections["Deployment Strategy"] = {
            deployment_strategy: blueprint.deployment_strategy,
          };
        }

        // Testing Strategy
        if (blueprint.testing_strategy) {
          parsedSections["Testing Strategy"] = {
            testing_strategy: blueprint.testing_strategy,
          };
        }

        // Project Timeline
        if (blueprint.project_timeline) {
          parsedSections["Project Timeline"] = {
            project_timeline: blueprint.project_timeline,
          };
        }

        // Risk Mitigation
        if (blueprint.risk_mitigation) {
          parsedSections["Risk Mitigation"] = {
            risk_mitigation: blueprint.risk_mitigation,
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

      // NEW N8N FORMAT SECTIONS - Parse from blueprint object
      if (blueprint) {
        // Feature Breakdown
        if (blueprint.feature_breakdown) {
          parsedSections["Feature Breakdown"] = {
            feature_breakdown: blueprint.feature_breakdown,
          };
        }

        // Technical Architecture
        if (blueprint.technical_architecture) {
          parsedSections["Technical Architecture"] = {
            technical_architecture: blueprint.technical_architecture,
          };
        }

        // User Experience Flow
        if (blueprint.user_experience_flow) {
          parsedSections["User Experience Flow"] = {
            user_experience_flow: blueprint.user_experience_flow,
          };
        }

        // Timeline Milestones
        if (blueprint.timeline_milestones) {
          parsedSections["Timeline Milestones"] = {
            timeline_milestones: blueprint.timeline_milestones,
          };
        }

        // Resource Requirements
        if (blueprint.resource_requirements) {
          parsedSections["Resource Requirements"] = {
            resource_requirements: blueprint.resource_requirements,
          };
        }

        // Risk Assessment
        if (blueprint.risk_assessment) {
          parsedSections["Risk Assessment"] = {
            risk_assessment: blueprint.risk_assessment,
          };
        }

        // Next Steps
        if (blueprint.next_steps) {
          parsedSections["Next Steps"] = {
            next_steps: blueprint.next_steps,
          };
        }
      }

      console.log(
        "BlueprintSectionEditor - Final parsed sections:",
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

    // Convert Blueprint content
    const blueprint = {};

    if (sections["Project Overview"]) {
      blueprint.project_overview =
        sections["Project Overview"].project_overview;
    }

    if (sections["Architecture Design"]) {
      blueprint.architecture_design =
        sections["Architecture Design"].architecture_design;
    }

    if (sections["Database Design"]) {
      blueprint.database_design = sections["Database Design"].database_design;
    }

    if (sections["Security Implementation"]) {
      blueprint.security_implementation =
        sections["Security Implementation"].security_implementation;
    }

    if (sections["Deployment Strategy"]) {
      blueprint.deployment_strategy =
        sections["Deployment Strategy"].deployment_strategy;
    }

    if (sections["Testing Strategy"]) {
      blueprint.testing_strategy =
        sections["Testing Strategy"].testing_strategy;
    }

    if (sections["Project Timeline"]) {
      blueprint.project_timeline =
        sections["Project Timeline"].project_timeline;
    }

    if (sections["Risk Mitigation"]) {
      blueprint.risk_mitigation = sections["Risk Mitigation"].risk_mitigation;
    }

    // NEW N8N FORMAT SECTIONS
    if (sections["Feature Breakdown"]) {
      blueprint.feature_breakdown =
        sections["Feature Breakdown"].feature_breakdown;
    }

    if (sections["Technical Architecture"]) {
      blueprint.technical_architecture =
        sections["Technical Architecture"].technical_architecture;
    }

    if (sections["User Experience Flow"]) {
      blueprint.user_experience_flow =
        sections["User Experience Flow"].user_experience_flow;
    }

    if (sections["Timeline Milestones"]) {
      blueprint.timeline_milestones =
        sections["Timeline Milestones"].timeline_milestones;
    }

    if (sections["Resource Requirements"]) {
      blueprint.resource_requirements =
        sections["Resource Requirements"].resource_requirements;
    }

    if (sections["Risk Assessment"]) {
      blueprint.risk_assessment = sections["Risk Assessment"].risk_assessment;
    }

    if (sections["Next Steps"]) {
      blueprint.next_steps = sections["Next Steps"].next_steps;
    }

    if (Object.keys(blueprint).length > 0) {
      json.blueprint = blueprint;
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

  const renderFeatureBreakdownField = (label, features, onChange) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {features.map((feature, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature
            </label>
            <input
              type="text"
              value={feature.feature || ""}
              onChange={(e) => {
                const newFeatures = [...features];
                newFeatures[index] = {
                  ...newFeatures[index],
                  feature: e.target.value,
                };
                onChange(newFeatures);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={feature.priority || ""}
              onChange={(e) => {
                const newFeatures = [...features];
                newFeatures[index] = {
                  ...newFeatures[index],
                  priority: e.target.value,
                };
                onChange(newFeatures);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencies
            </label>
            {renderArrayField(
              "Dependencies",
              feature.dependencies || [],
              (value) => {
                const newFeatures = [...features];
                newFeatures[index] = {
                  ...newFeatures[index],
                  dependencies: value,
                };
                onChange(newFeatures);
              }
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const newFeatures = features.filter((_, i) => i !== index);
              onChange(newFeatures);
            }}
            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Remove Feature
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...features,
            { feature: "", priority: "", dependencies: [] },
          ])
        }
        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
      >
        + Add Feature
      </button>
    </div>
  );

  const renderTimelineMilestonesField = (label, milestones, onChange) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {milestones.map((milestone, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phase
            </label>
            <input
              type="text"
              value={milestone.phase || ""}
              onChange={(e) => {
                const newMilestones = [...milestones];
                newMilestones[index] = {
                  ...newMilestones[index],
                  phase: e.target.value,
                };
                onChange(newMilestones);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimate
            </label>
            <input
              type="text"
              value={milestone.estimate || ""}
              onChange={(e) => {
                const newMilestones = [...milestones];
                newMilestones[index] = {
                  ...newMilestones[index],
                  estimate: e.target.value,
                };
                onChange(newMilestones);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deliverables
            </label>
            {renderArrayField(
              "Deliverables",
              milestone.deliverables || [],
              (value) => {
                const newMilestones = [...milestones];
                newMilestones[index] = {
                  ...newMilestones[index],
                  deliverables: value,
                };
                onChange(newMilestones);
              }
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const newMilestones = milestones.filter((_, i) => i !== index);
              onChange(newMilestones);
            }}
            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Remove Milestone
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...milestones,
            { phase: "", estimate: "", deliverables: [] },
          ])
        }
        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
      >
        + Add Timeline Milestone
      </button>
    </div>
  );

  const renderResourceRequirementsField = (label, resources, onChange) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {resources.map((resource, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={resource.role || ""}
              onChange={(e) => {
                const newResources = [...resources];
                newResources[index] = {
                  ...newResources[index],
                  role: e.target.value,
                };
                onChange(newResources);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsibilities
            </label>
            <textarea
              value={resource.responsibilities || ""}
              onChange={(e) => {
                const newResources = [...resources];
                newResources[index] = {
                  ...newResources[index],
                  responsibilities: e.target.value,
                };
                onChange(newResources);
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const newResources = resources.filter((_, i) => i !== index);
              onChange(newResources);
            }}
            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Remove Resource
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...resources, { role: "", responsibilities: "" }])
        }
        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
      >
        + Add Resource
      </button>
    </div>
  );

  const renderRiskAssessmentField = (label, risks, onChange) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {risks.map((risk, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk
            </label>
            <input
              type="text"
              value={risk.risk || ""}
              onChange={(e) => {
                const newRisks = [...risks];
                newRisks[index] = { ...newRisks[index], risk: e.target.value };
                onChange(newRisks);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation
            </label>
            <textarea
              value={risk.mitigation || ""}
              onChange={(e) => {
                const newRisks = [...risks];
                newRisks[index] = {
                  ...newRisks[index],
                  mitigation: e.target.value,
                };
                onChange(newRisks);
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const newRisks = risks.filter((_, i) => i !== index);
              onChange(newRisks);
            }}
            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Remove Risk
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...risks, { risk: "", mitigation: "" }])}
        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
      >
        + Add Risk
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
      case "Project Overview":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={editData.project_overview?.project_name || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    project_overview: {
                      ...prev.project_overview,
                      project_name: e.target.value,
                    },
                  }))
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
                value={editData.project_overview?.description || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    project_overview: {
                      ...prev.project_overview,
                      description: e.target.value,
                    },
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
              />
            </div>
            {renderArrayField(
              "Goals",
              editData.project_overview?.goals || [],
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  project_overview: {
                    ...prev.project_overview,
                    goals: value,
                  },
                }))
            )}
            {renderArrayField(
              "Target Audience",
              editData.project_overview?.target_audience || [],
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  project_overview: {
                    ...prev.project_overview,
                    target_audience: value,
                  },
                }))
            )}
            {renderArrayField(
              "Success Metrics",
              editData.project_overview?.success_metrics || [],
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  project_overview: {
                    ...prev.project_overview,
                    success_metrics: value,
                  },
                }))
            )}
          </div>
        );

      case "Architecture Design":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Architecture
              </label>
              <input
                type="text"
                value={editData.architecture_design?.system_architecture || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    architecture_design: {
                      ...prev.architecture_design,
                      system_architecture: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter system architecture"
              />
            </div>
            {renderObjectField(
              "Technology Stack",
              editData.architecture_design?.technology_stack || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  architecture_design: {
                    ...prev.architecture_design,
                    technology_stack: value,
                  },
                })),
              true // isArrayValue = true
            )}
            {renderObjectField(
              "API Design",
              editData.architecture_design?.api_design || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  architecture_design: {
                    ...prev.architecture_design,
                    api_design: value,
                  },
                }))
            )}
          </div>
        );

      case "Database Design":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Schema Design",
              editData.database_design?.schema_design || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  database_design: {
                    ...prev.database_design,
                    schema_design: value,
                  },
                })),
              true // isArrayValue = true
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationships
              </label>
              <textarea
                value={editData.database_design?.relationships || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    database_design: {
                      ...prev.database_design,
                      relationships: e.target.value,
                    },
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter database relationships"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indexes
              </label>
              <input
                type="text"
                value={editData.database_design?.indexes || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    database_design: {
                      ...prev.database_design,
                      indexes: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter database indexes"
              />
            </div>
          </div>
        );

      case "Security Implementation":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Security Implementation",
              editData.security_implementation || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  security_implementation: value,
                }))
            )}
          </div>
        );

      case "Deployment Strategy":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Deployment Strategy",
              editData.deployment_strategy || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  deployment_strategy: value,
                })),
              true // isArrayValue = true for nested objects
            )}
          </div>
        );

      case "Testing Strategy":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Testing Strategy",
              editData.testing_strategy || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  testing_strategy: value,
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

      case "Risk Mitigation":
        return (
          <div className="space-y-4">
            {renderObjectField(
              "Risk Mitigation",
              editData.risk_mitigation || {},
              (value) =>
                setEditData((prev) => ({
                  ...prev,
                  risk_mitigation: value,
                })),
              true // isArrayValue = true for nested objects/arrays
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

      case "Feature Breakdown":
        return renderFeatureBreakdownField(
          "Feature Breakdown",
          editData.feature_breakdown || [],
          (value) =>
            setEditData((prev) => ({ ...prev, feature_breakdown: value }))
        );

      case "Technical Architecture":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Stack
              </label>
              {renderArrayField(
                "Recommended Stack",
                editData.technical_architecture?.recommended_stack || [],
                (value) =>
                  setEditData((prev) => ({
                    ...prev,
                    technical_architecture: {
                      ...prev.technical_architecture,
                      recommended_stack: value,
                    },
                  }))
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification
              </label>
              <textarea
                value={editData.technical_architecture?.justification || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    technical_architecture: {
                      ...prev.technical_architecture,
                      justification: e.target.value,
                    },
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case "User Experience Flow":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Journeys
              </label>
              {renderArrayField(
                "User Journeys",
                editData.user_experience_flow?.journeys || [],
                (value) =>
                  setEditData((prev) => ({
                    ...prev,
                    user_experience_flow: {
                      ...prev.user_experience_flow,
                      journeys: value,
                    },
                  }))
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Interactions
              </label>
              {renderArrayField(
                "Key Interactions",
                editData.user_experience_flow?.key_interactions || [],
                (value) =>
                  setEditData((prev) => ({
                    ...prev,
                    user_experience_flow: {
                      ...prev.user_experience_flow,
                      key_interactions: value,
                    },
                  }))
              )}
            </div>
          </div>
        );

      case "Timeline Milestones":
        return renderTimelineMilestonesField(
          "Timeline Milestones",
          editData.timeline_milestones || [],
          (value) =>
            setEditData((prev) => ({ ...prev, timeline_milestones: value }))
        );

      case "Resource Requirements":
        return renderResourceRequirementsField(
          "Resource Requirements",
          editData.resource_requirements || [],
          (value) =>
            setEditData((prev) => ({ ...prev, resource_requirements: value }))
        );

      case "Risk Assessment":
        return renderRiskAssessmentField(
          "Risk Assessment",
          editData.risk_assessment || [],
          (value) =>
            setEditData((prev) => ({ ...prev, risk_assessment: value }))
        );

      case "Next Steps":
        return (
          <div className="space-y-4">
            {renderArrayField(
              "Next Steps",
              editData.next_steps || [],
              (value) => setEditData((prev) => ({ ...prev, next_steps: value }))
            )}
          </div>
        );

      default:
        return <div>Unknown section type</div>;
    }
  };

  const renderSectionDisplay = (sectionName, sectionData) => {
    switch (sectionName) {
      case "Project Overview":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Project Name</h5>
              <p className="text-gray-700">
                {sectionData.project_overview?.project_name || "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Description</h5>
              <p className="text-gray-700">
                {sectionData.project_overview?.description || "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Goals</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.project_overview?.goals?.map((goal, index) => (
                  <li key={index}>{goal}</li>
                )) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Target Audience</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.project_overview?.target_audience?.map(
                  (audience, index) => <li key={index}>{audience}</li>
                ) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Success Metrics</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.project_overview?.success_metrics?.map(
                  (metric, index) => <li key={index}>{metric}</li>
                ) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
          </div>
        );

      case "Architecture Design":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">System Architecture</h5>
              <p className="text-gray-700">
                {sectionData.architecture_design?.system_architecture ||
                  "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Technology Stack</h5>
              <div className="space-y-2">
                {Object.entries(
                  sectionData.architecture_design?.technology_stack || {}
                ).map(([key, value], index) => (
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
                ))}
                {Object.keys(
                  sectionData.architecture_design?.technology_stack || {}
                ).length === 0 && (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">API Design</h5>
              <div className="space-y-2">
                {Object.entries(
                  sectionData.architecture_design?.api_design || {}
                ).map(([key, value], index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{key}:</span>
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
                {Object.keys(sectionData.architecture_design?.api_design || {})
                  .length === 0 && (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>
          </div>
        );

      case "Database Design":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Schema Design</h5>
              <div className="space-y-2">
                {Object.entries(
                  sectionData.database_design?.schema_design || {}
                ).map(([key, value], index) => (
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
                ))}
                {Object.keys(sectionData.database_design?.schema_design || {})
                  .length === 0 && (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Relationships</h5>
              <p className="text-gray-700">
                {sectionData.database_design?.relationships || "Not specified"}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Indexes</h5>
              <p className="text-gray-700">
                {sectionData.database_design?.indexes || "Not specified"}
              </p>
            </div>
          </div>
        );

      case "Security Implementation":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.security_implementation || {}).map(
              ([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              )
            )}
            {Object.keys(sectionData.security_implementation || {}).length ===
              0 && <p className="text-gray-500">None specified</p>}
          </div>
        );

      case "Deployment Strategy":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.deployment_strategy || {}).map(
              ([key, value], index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4">
                  <h6 className="font-medium text-gray-900">{key}</h6>
                  {typeof value === "object" && value !== null ? (
                    <div className="mt-1 space-y-1">
                      {Object.entries(value).map(
                        ([subKey, subValue], subIndex) => (
                          <div
                            key={subIndex}
                            className="flex items-center space-x-2"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {subKey}:
                            </span>
                            <span className="text-sm text-gray-600">
                              {subValue}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700 mt-1">{value}</p>
                  )}
                </div>
              )
            )}
            {Object.keys(sectionData.deployment_strategy || {}).length ===
              0 && <p className="text-gray-500">None specified</p>}
          </div>
        );

      case "Testing Strategy":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.testing_strategy || {}).map(
              ([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              )
            )}
            {Object.keys(sectionData.testing_strategy || {}).length === 0 && (
              <p className="text-gray-500">None specified</p>
            )}
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

      case "Risk Mitigation":
        return (
          <div className="space-y-2">
            {Object.entries(sectionData.risk_mitigation || {}).map(
              ([key, value], index) => (
                <div key={index} className="border-l-4 border-orange-500 pl-4">
                  <h6 className="font-medium text-gray-900">{key}</h6>
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1">
                      {value.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : typeof value === "object" && value !== null ? (
                    <div className="mt-1 space-y-1">
                      {Object.entries(value).map(
                        ([subKey, subValue], subIndex) => (
                          <div
                            key={subIndex}
                            className="flex items-center space-x-2"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {subKey}:
                            </span>
                            <span className="text-sm text-gray-600">
                              {subValue}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-700 mt-1">{value}</p>
                  )}
                </div>
              )
            )}
            {Object.keys(sectionData.risk_mitigation || {}).length === 0 && (
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

      case "Next Steps":
        return (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
            <ul className="list-disc list-inside space-y-1">
              {sectionData.next_steps?.map((step, index) => (
                <li key={index}>{step}</li>
              )) || <li className="text-gray-500">No next steps specified</li>}
            </ul>
          </div>
        );

      case "Feature Breakdown":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Features</h5>
              <div className="space-y-3">
                {sectionData.feature_breakdown?.map((feature, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900">
                        {feature.feature}
                      </h6>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          feature.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : feature.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {feature.priority}
                      </span>
                    </div>
                    {feature.dependencies &&
                      feature.dependencies.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-1">
                            Dependencies:
                          </h6>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {feature.dependencies.map((dep, idx) => (
                              <li key={idx}>{dep}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )) || <p className="text-gray-500">No features specified</p>}
              </div>
            </div>
          </div>
        );

      case "Technical Architecture":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Recommended Stack</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.technical_architecture?.recommended_stack?.map(
                  (tech, index) => <li key={index}>{tech}</li>
                ) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Justification</h5>
              <p className="text-gray-700">
                {sectionData.technical_architecture?.justification ||
                  "Not specified"}
              </p>
            </div>
          </div>
        );

      case "User Experience Flow":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">User Journeys</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.user_experience_flow?.journeys?.map(
                  (journey, index) => <li key={index}>{journey}</li>
                ) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900">Key Interactions</h5>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {sectionData.user_experience_flow?.key_interactions?.map(
                  (interaction, index) => <li key={index}>{interaction}</li>
                ) || <li className="text-gray-500">None specified</li>}
              </ul>
            </div>
          </div>
        );

      case "Timeline Milestones":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Project Phases</h5>
              <div className="space-y-3">
                {sectionData.timeline_milestones?.map((milestone, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900">
                        {milestone.phase}
                      </h6>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {milestone.estimate}
                      </span>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-1">
                        Deliverables:
                      </h6>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {milestone.deliverables?.map((deliverable, idx) => (
                          <li key={idx}>{deliverable}</li>
                        )) || <li className="text-gray-500">None specified</li>}
                      </ul>
                    </div>
                  </div>
                )) || <p className="text-gray-500">No milestones specified</p>}
              </div>
            </div>
          </div>
        );

      case "Resource Requirements":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Team Roles</h5>
              <div className="space-y-3">
                {sectionData.resource_requirements?.map((resource, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h6 className="font-medium text-gray-900 mb-2">
                      {resource.role}
                    </h6>
                    <p className="text-gray-700">{resource.responsibilities}</p>
                  </div>
                )) || <p className="text-gray-500">No resources specified</p>}
              </div>
            </div>
          </div>
        );

      case "Risk Assessment":
        return (
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">Identified Risks</h5>
              <div className="space-y-3">
                {sectionData.risk_assessment?.map((risk, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h6 className="font-medium text-gray-900 mb-2">
                      {risk.risk}
                    </h6>
                    <p className="text-gray-700">
                      <span className="font-medium">Mitigation:</span>{" "}
                      {risk.mitigation}
                    </p>
                  </div>
                )) || <p className="text-gray-500">No risks identified</p>}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown section type</div>;
    }
  };

  if (Object.keys(sections).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No Blueprint data available</p>
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

export default BlueprintSectionEditor;
