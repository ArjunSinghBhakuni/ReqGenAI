const axios = require("axios");

class RequirementBlueprintService {
  constructor() {
    this.n8nWebhookUrl =
      process.env.N8N_REQUIREMENT_BLUEPRINT_URL ||
      "https://reqgenai.app.n8n.cloud/webhook/requirement-blueprint";
  }

  async generateBlueprint(projectInfo, requirements, constraints) {
    try {
      const payload = {
        project_info: projectInfo,
        requirements: requirements,
        constraints: constraints,
      };

      console.log(
        "Calling n8n requirement blueprint webhook:",
        this.n8nWebhookUrl
      );
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 seconds timeout for AI processing
      });

      console.log("n8n blueprint response received:", response.status);

      return {
        success: true,
        data: response.data,
        status: "completed",
      };
    } catch (error) {
      console.error("Requirement blueprint generation failed:", error.message);

      if (error.response) {
        console.error(
          "n8n response error:",
          error.response.status,
          error.response.data
        );
        return {
          success: false,
          error: `n8n webhook error: ${error.response.status}`,
          details: error.response.data,
        };
      } else if (error.request) {
        console.error("n8n request failed:", error.request);
        return {
          success: false,
          error: "Failed to reach n8n webhook",
          details: error.message,
        };
      } else {
        return {
          success: false,
          error: "Requirement blueprint generation failed",
          details: error.message,
        };
      }
    }
  }
}

module.exports = new RequirementBlueprintService();
