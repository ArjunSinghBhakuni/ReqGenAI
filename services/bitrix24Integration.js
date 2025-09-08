const axios = require("axios");

class Bitrix24IntegrationService {
  constructor() {
    this.baseUrl =
      process.env.BITRIX24_BASE_URL ||
      "https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/";
    this.webhookUrl =
      process.env.BITRIX24_WEBHOOK_URL ||
      "https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/";
  }

  // Create a project in Bitrix24 using sonet_group.create
  async createProject(blueprintData) {
    try {
      const projectInfo = blueprintData.blueprint.project_overview;
      const projectName = projectInfo.goals[0] || "New Project";

      const projectData = {
        NAME: projectName,
        DESCRIPTION: this.formatBlueprintDescription(blueprintData),
        PROJECT: "Y",
      };

      console.log("Creating Bitrix24 project:", projectData);

      const response = await axios.post(
        `${this.webhookUrl}sonet_group.create.json`,
        projectData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.result) {
        console.log("Bitrix24 project created:", response.data.result);
        return {
          success: true,
          groupId: response.data.result,
          projectName: projectName,
          data: response.data.result,
        };
      } else {
        throw new Error(
          response.data.error_description || "Failed to create project"
        );
      }
    } catch (error) {
      console.error("Bitrix24 project creation failed:", error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
      };
    }
  }

  // Create tasks from blueprint with timeline
  async createTasksFromBlueprint(groupId, blueprintData) {
    try {
      const featureBreakdown = blueprintData.blueprint.feature_breakdown;
      const timelineMilestones = blueprintData.blueprint.timeline_milestones;
      const resourceRequirements =
        blueprintData.blueprint.resource_requirements;
      const createdTasks = [];

      // Create tasks for each feature
      for (const feature of featureBreakdown) {
        const taskData = {
          fields: {
            TITLE: feature.feature,
            DESCRIPTION: this.formatFeatureDescription(feature, blueprintData),
            GROUP_ID: groupId,
            RESPONSIBLE_ID: this.getResponsibleId(
              feature,
              resourceRequirements
            ),
            PRIORITY: this.mapPriority(feature.priority),
            STATUS: "2", // In progress
            TAGS: ["Feature", feature.priority],
            DEADLINE: this.calculateFeatureDeadline(
              feature,
              timelineMilestones
            ),
          },
        };

        console.log(`Creating task for feature: ${feature.feature}`);

        const response = await axios.post(
          `${this.webhookUrl}tasks.task.add.json`,
          taskData,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (response.data.result) {
          createdTasks.push({
            feature: feature.feature,
            taskId: response.data.result.task.id,
            priority: feature.priority,
            type: "Feature",
          });
        }
      }

      // Create milestone tasks
      for (const milestone of timelineMilestones) {
        const milestoneData = {
          fields: {
            TITLE: `Milestone: ${milestone.phase}`,
            DESCRIPTION: this.formatMilestoneDescription(milestone),
            GROUP_ID: groupId,
            RESPONSIBLE_ID: this.getResponsibleId(
              milestone,
              resourceRequirements
            ),
            PRIORITY: "1", // High priority for milestones
            STATUS: "1", // New
            TAGS: ["Milestone", milestone.phase],
            DEADLINE: this.calculateMilestoneDeadline(milestone),
          },
        };

        console.log(`Creating milestone task: ${milestone.phase}`);

        const response = await axios.post(
          `${this.webhookUrl}tasks.task.add.json`,
          milestoneData,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (response.data.result) {
          createdTasks.push({
            feature: milestone.phase,
            taskId: response.data.result.task.id,
            priority: "Milestone",
            type: "Milestone",
          });
        }
      }

      return {
        success: true,
        tasks: createdTasks,
        totalCreated: createdTasks.length,
      };
    } catch (error) {
      console.error("Bitrix24 task creation failed:", error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
      };
    }
  }

  // Legacy method for backward compatibility
  async createSubtasks(parentTaskId, blueprintData) {
    // This method is kept for backward compatibility but redirects to the new method
    return await this.createTasksFromBlueprint(parentTaskId, blueprintData);
  }

  // Get task details from Bitrix24
  async getTask(taskId) {
    try {
      const response = await axios.get(`${this.webhookUrl}tasks.task.get`, {
        params: {
          taskId: taskId,
        },
        timeout: 10000,
      });

      if (response.data.result) {
        return {
          success: true,
          task: response.data.result.task,
        };
      } else {
        throw new Error(
          response.data.error_description || "Failed to get task"
        );
      }
    } catch (error) {
      console.error("Bitrix24 get task failed:", error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
      };
    }
  }

  // Helper methods
  formatBlueprintDescription(blueprintData) {
    const bp = blueprintData.blueprint;
    return `
# Project Blueprint

## Project Overview
**Goals:** ${bp.project_overview.goals.join(", ")}
**Target Audience:** ${bp.project_overview.target_audience.join(", ")}
**Success Metrics:** ${bp.project_overview.success_metrics.join(", ")}

## Technical Architecture
${bp.technical_architecture.recommended_stack.join("\n")}

## Resource Requirements
${bp.resource_requirements
  .map((r) => `- ${r.role}: ${r.responsibilities}`)
  .join("\n")}

## Risk Assessment
${bp.risk_assessment.map((r) => `- ${r.risk}: ${r.mitigation}`).join("\n")}

---
Generated by ReqGenAI
    `.trim();
  }

  formatFeatureDescription(feature, blueprintData) {
    return `
# ${feature.feature}

**Priority:** ${feature.priority}
**Dependencies:** ${
      feature.dependencies.length > 0 ? feature.dependencies.join(", ") : "None"
    }

## Technical Details
This feature is part of the ${
      blueprintData.blueprint.project_overview.goals[0]
    } project.

## Requirements
- Implement ${feature.feature.toLowerCase()}
- Follow project architecture guidelines
- Ensure proper testing and documentation

---
Generated by ReqGenAI
    `.trim();
  }

  formatMilestoneDescription(milestone) {
    return `
# Milestone: ${milestone.phase}

**Timeline:** ${milestone.estimate}

## Deliverables
${milestone.deliverables.map((d) => `- ${d}`).join("\n")}

## Success Criteria
- All deliverables completed
- Quality standards met
- Ready for next phase

---
Generated by ReqGenAI
    `.trim();
  }

  mapPriority(priority) {
    const priorityMap = {
      High: "1",
      Medium: "2",
      Low: "3",
    };
    return priorityMap[priority] || "2";
  }

  calculateDeadline(blueprintData) {
    // Calculate deadline based on timeline milestones
    const milestones = blueprintData.blueprint.timeline_milestones;
    if (milestones && milestones.length > 0) {
      const totalMonths = milestones.reduce((total, milestone) => {
        const months = parseInt(milestone.estimate);
        return total + (isNaN(months) ? 1 : months);
      }, 0);

      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + totalMonths);
      return deadline.toISOString().split("T")[0];
    }
    return null;
  }

  calculateFeatureDeadline(feature, milestones) {
    // Simple calculation - can be enhanced based on dependencies
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 1); // Default 1 month
    return deadline.toISOString().split("T")[0];
  }

  calculateMilestoneDeadline(milestone) {
    const months = parseInt(milestone.estimate);
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + (isNaN(months) ? 1 : months));
    return deadline.toISOString().split("T")[0];
  }

  // Get responsible ID based on feature/milestone and resource requirements
  getResponsibleId(item, resourceRequirements) {
    // Default responsible ID
    let responsibleId = 1;

    if (resourceRequirements && resourceRequirements.length > 0) {
      // Try to match feature with resource role
      const featureName = item.feature || item.phase || "";

      // Simple matching logic - can be enhanced
      if (
        featureName.toLowerCase().includes("frontend") ||
        featureName.toLowerCase().includes("ui") ||
        featureName.toLowerCase().includes("user interface")
      ) {
        const frontendDev = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("frontend") ||
            r.role.toLowerCase().includes("ui")
        );
        if (frontendDev) responsibleId = 2; // Frontend developer ID
      } else if (
        featureName.toLowerCase().includes("backend") ||
        featureName.toLowerCase().includes("api") ||
        featureName.toLowerCase().includes("database")
      ) {
        const backendDev = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("backend") ||
            r.role.toLowerCase().includes("api")
        );
        if (backendDev) responsibleId = 3; // Backend developer ID
      } else if (
        featureName.toLowerCase().includes("milestone") ||
        featureName.toLowerCase().includes("phase")
      ) {
        const projectManager = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("project manager") ||
            r.role.toLowerCase().includes("manager")
        );
        if (projectManager) responsibleId = 1; // Project manager ID
      }
    }

    return responsibleId;
  }
}

module.exports = new Bitrix24IntegrationService();
