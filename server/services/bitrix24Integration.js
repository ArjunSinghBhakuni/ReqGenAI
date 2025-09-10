const axios = require("axios");

class Bitrix24IntegrationService {
  constructor() {
    this.baseUrl =
      process.env.BITRIX24_BASE_URL ||
      "https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/";
    this.webhookUrl =
      process.env.BITRIX24_WEBHOOK_URL ||
      "https://b24-kb0ki5.bitrix24.in/rest/1/3jg6d1as4kwbc9vc/";
    this.projectWebhookUrl =
      process.env.BITRIX24_PROJECT_WEBHOOK_URL ||
      "https://b24-kb0ki5.bitrix24.in/rest/1/jbej2i8xtuzcjndz/";
  }

  // Create a project in Bitrix24 using sonet_group.create
  async createProject(blueprintData) {
    try {
      const projectInfo = blueprintData.blueprint.project_overview;
      // Try to get project name from different sources
      let projectName = "New Project";

      if (projectInfo.project_name) {
        projectName = projectInfo.project_name;
      } else if (projectInfo.goals && projectInfo.goals.length > 0) {
        // Use the first goal as project name, but limit length
        projectName = projectInfo.goals[0].substring(0, 50);
      } else if (projectInfo.description) {
        projectName = projectInfo.description.substring(0, 50);
      }

      // Clean up project name - remove special characters and limit length
      projectName = projectName
        .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
        .substring(0, 50) // Limit to 50 characters
        .trim();

      if (!projectName || projectName.length === 0) {
        projectName = "Stock Market Application Project";
      }

      const description = this.formatBlueprintDescription(blueprintData);

      const projectData = {
        NAME: projectName,
        DESCRIPTION: description.substring(0, 1000), // Limit description length
        PROJECT: "Y",
      };

      console.log("Creating Bitrix24 project:", projectData);
      console.log(
        "Using webhook URL:",
        `${this.projectWebhookUrl}sonet_group.create.json`
      );

      const response = await axios.post(
        `${this.projectWebhookUrl}sonet_group.create.json`,
        projectData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("Bitrix24 response:", response.data);

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
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
  }

  // Create tasks from blueprint with timeline and subtasks
  async createTasksFromBlueprint(groupId, blueprintData) {
    try {
      const featureBreakdown = blueprintData.blueprint.feature_breakdown;
      const timelineMilestones = blueprintData.blueprint.timeline_milestones;
      const resourceRequirements =
        blueprintData.blueprint.resource_requirements;
      const createdTasks = [];
      const featureTaskMap = new Map(); // Map to store feature tasks for subtask creation

      // Create main tasks for each feature
      for (const feature of featureBreakdown) {
        // Handle dependencies - convert string to array if needed
        const dependencies = Array.isArray(feature.dependencies)
          ? feature.dependencies
          : feature.dependencies
          ? [feature.dependencies]
          : [];

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
            STATUS: "1", // New
            TAGS: ["Feature", feature.priority],
            DEADLINE: this.calculateFeatureDeadline(
              feature,
              timelineMilestones
            ),
            CREATED_BY: 1, // System user
            CHANGED_BY: 1, // System user
          },
        };

        console.log(`Creating main task for feature: ${feature.feature}`);

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
          const taskId = response.data.result.task.id;
          createdTasks.push({
            feature: feature.feature,
            taskId: taskId,
            priority: feature.priority,
            type: "Feature",
            dependencies: dependencies,
          });

          // Store feature task for subtask creation
          featureTaskMap.set(feature.feature, taskId);
          console.log(
            `✅ Created task for feature: ${feature.feature} with ID: ${taskId}`
          );
        } else {
          console.error(
            `❌ Failed to create task for feature: ${feature.feature}`,
            response.data
          );
        }
      }

      // Create milestone tasks and their subtasks
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
            CREATED_BY: 1,
            CHANGED_BY: 1,
          },
        };

        console.log(`Creating milestone task: ${milestone.phase}`);

        const milestoneResponse = await axios.post(
          `${this.webhookUrl}tasks.task.add.json`,
          milestoneData,
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        if (milestoneResponse.data.result) {
          const milestoneTaskId = milestoneResponse.data.result.task.id;
          createdTasks.push({
            feature: milestone.phase,
            taskId: milestoneTaskId,
            priority: "Milestone",
            type: "Milestone",
          });
          console.log(
            `✅ Created milestone task: ${milestone.phase} with ID: ${milestoneTaskId}`
          );

          // Create subtasks for each deliverable in the milestone
          let deliverables = [];
          if (Array.isArray(milestone.deliverables)) {
            deliverables = milestone.deliverables;
          } else if (typeof milestone.deliverables === "string") {
            // Split string by common delimiters and clean up
            deliverables = milestone.deliverables
              .split(/[,;]\s*/)
              .map((d) => d.trim())
              .filter((d) => d.length > 0);
          } else if (milestone.deliverables) {
            deliverables = [milestone.deliverables];
          }

          for (const deliverable of deliverables) {
            const subtaskData = {
              fields: {
                TITLE: deliverable,
                DESCRIPTION: this.formatDeliverableDescription(
                  deliverable,
                  milestone
                ),
                GROUP_ID: groupId,
                PARENT_ID: milestoneTaskId, // Link to milestone task
                RESPONSIBLE_ID: this.getResponsibleIdForDeliverable(
                  deliverable,
                  resourceRequirements
                ),
                PRIORITY: this.getDeliverablePriority(deliverable),
                STATUS: "1", // New
                TAGS: ["Deliverable", milestone.phase],
                DEADLINE: this.calculateDeliverableDeadline(
                  deliverable,
                  milestone
                ),
                CREATED_BY: 1,
                CHANGED_BY: 1,
              },
            };

            console.log(`Creating subtask for deliverable: ${deliverable}`);

            const subtaskResponse = await axios.post(
              `${this.webhookUrl}tasks.task.add.json`,
              subtaskData,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                timeout: 10000,
              }
            );

            if (subtaskResponse.data.result) {
              createdTasks.push({
                feature: deliverable,
                taskId: subtaskResponse.data.result.task.id,
                parentTaskId: milestoneTaskId,
                priority: "Deliverable",
                type: "Subtask",
                milestone: milestone.phase,
              });
              console.log(
                `✅ Created subtask: ${deliverable} with ID: ${subtaskResponse.data.result.task.id}`
              );
            } else {
              console.error(
                `❌ Failed to create subtask: ${deliverable}`,
                subtaskResponse.data
              );
            }
          }
        } else {
          console.error(
            `❌ Failed to create milestone task: ${milestone.phase}`,
            milestoneResponse.data
          );
        }
      }

      // Create dependency relationships between tasks
      await this.createTaskDependencies(createdTasks, featureTaskMap);

      return {
        success: true,
        tasks: createdTasks,
        totalCreated: createdTasks.length,
        featureTasks: Array.from(featureTaskMap.entries()),
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
${
  Array.isArray(milestone.deliverables)
    ? milestone.deliverables.map((d) => `- ${d}`).join("\n")
    : milestone.deliverables
    ? `- ${milestone.deliverables}`
    : "- None specified"
}

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

  // Get responsible ID for deliverable based on content
  getResponsibleIdForDeliverable(deliverable, resourceRequirements) {
    let responsibleId = 1; // Default to project manager

    if (resourceRequirements && resourceRequirements.length > 0) {
      const deliverableLower = deliverable.toLowerCase();

      // Match deliverable content to appropriate role
      if (
        deliverableLower.includes("authentication") ||
        deliverableLower.includes("login") ||
        deliverableLower.includes("user management") ||
        deliverableLower.includes("api") ||
        deliverableLower.includes("backend") ||
        deliverableLower.includes("database")
      ) {
        const backendDev = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("backend") ||
            r.role.toLowerCase().includes("api")
        );
        if (backendDev) responsibleId = 3; // Backend developer ID
      } else if (
        deliverableLower.includes("ui") ||
        deliverableLower.includes("interface") ||
        deliverableLower.includes("frontend") ||
        deliverableLower.includes("dashboard") ||
        deliverableLower.includes("user experience")
      ) {
        const frontendDev = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("frontend") ||
            r.role.toLowerCase().includes("ui")
        );
        if (frontendDev) responsibleId = 2; // Frontend developer ID
      } else if (
        deliverableLower.includes("test") ||
        deliverableLower.includes("qa") ||
        deliverableLower.includes("quality")
      ) {
        const qaEngineer = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("qa") ||
            r.role.toLowerCase().includes("test")
        );
        if (qaEngineer) responsibleId = 4; // QA Engineer ID
      } else if (
        deliverableLower.includes("deploy") ||
        deliverableLower.includes("infrastructure") ||
        deliverableLower.includes("devops")
      ) {
        const devopsEngineer = resourceRequirements.find(
          (r) =>
            r.role.toLowerCase().includes("devops") ||
            r.role.toLowerCase().includes("infrastructure")
        );
        if (devopsEngineer) responsibleId = 5; // DevOps Engineer ID
      }
    }

    return responsibleId;
  }

  // Get priority for deliverable based on content
  getDeliverablePriority(deliverable) {
    const deliverableLower = deliverable.toLowerCase();

    if (
      deliverableLower.includes("authentication") ||
      deliverableLower.includes("core") ||
      deliverableLower.includes("basic") ||
      deliverableLower.includes("foundation")
    ) {
      return "1"; // High priority
    } else if (
      deliverableLower.includes("advanced") ||
      deliverableLower.includes("enhancement") ||
      deliverableLower.includes("optimization")
    ) {
      return "2"; // Medium priority
    } else {
      return "3"; // Low priority
    }
  }

  // Calculate deadline for deliverable
  calculateDeliverableDeadline(deliverable, milestone) {
    const milestoneMonths = parseInt(milestone.estimate);
    const baseMonths = isNaN(milestoneMonths) ? 1 : milestoneMonths;

    // Distribute deliverables across the milestone timeline
    const deliverables = Array.isArray(milestone.deliverables)
      ? milestone.deliverables
      : milestone.deliverables
      ? [milestone.deliverables]
      : [];

    const deliverableIndex = deliverables.indexOf(deliverable);
    const totalDeliverables = deliverables.length;
    const monthsPerDeliverable =
      totalDeliverables > 0 ? baseMonths / totalDeliverables : baseMonths;

    const deadline = new Date();
    deadline.setMonth(
      deadline.getMonth() +
        Math.ceil(monthsPerDeliverable * (deliverableIndex + 1))
    );

    return deadline.toISOString().split("T")[0];
  }

  // Format deliverable description
  formatDeliverableDescription(deliverable, milestone) {
    return `
# ${deliverable}

**Milestone:** ${milestone.phase}
**Timeline:** ${milestone.estimate}

## Description
This deliverable is part of the ${
      milestone.phase
    } milestone and contributes to the overall project success.

## Requirements
- Complete ${deliverable.toLowerCase()}
- Follow project standards and guidelines
- Ensure quality and testing
- Document implementation details

## Success Criteria
- Deliverable completed on time
- Quality standards met
- Ready for integration

---
Generated by ReqGenAI
    `.trim();
  }

  // Create task dependencies based on feature dependencies
  async createTaskDependencies(createdTasks, featureTaskMap) {
    try {
      for (const task of createdTasks) {
        if (
          task.type === "Feature" &&
          task.dependencies &&
          task.dependencies.length > 0
        ) {
          for (const dependency of task.dependencies) {
            const dependencyTaskId = featureTaskMap.get(dependency);
            if (dependencyTaskId) {
              // Create dependency relationship in Bitrix24
              await this.createTaskDependency(task.taskId, dependencyTaskId);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to create task dependencies:", error.message);
    }
  }

  // Create a single task dependency
  async createTaskDependency(taskId, dependsOnTaskId) {
    try {
      const dependencyData = {
        fields: {
          TASK_ID: taskId,
          DEPENDS_ON: dependsOnTaskId,
        },
      };

      const response = await axios.post(
        `${this.webhookUrl}tasks.task.dependencies.add.json`,
        dependencyData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.result) {
        console.log(
          `Created dependency: Task ${taskId} depends on ${dependsOnTaskId}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to create dependency for task ${taskId}:`,
        error.message
      );
    }
  }
}

module.exports = new Bitrix24IntegrationService();
