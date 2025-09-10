const axios = require("axios");

const extractRequirements = async (reqId, content) => {
  try {
    console.log(`Extracting requirements for project ${reqId}`);
    console.log("Content:", content);

    // For now, we'll create a simple mock extraction
    // In a real implementation, this would call your n8n webhook or AI service
    const mockExtraction = {
      project_info: {
        id: reqId,
        name: "Extracted Project",
        description: content.substring(0, 200) + "...",
        business_objectives: [
          "Improve user experience",
          "Increase efficiency",
          "Meet business goals",
        ],
        success_metrics: [
          "User satisfaction rating",
          "System performance metrics",
          "Business KPIs",
        ],
        stakeholders: [
          {
            role: "End User",
            contact: "Users",
          },
        ],
      },
      requirements: {
        functional: [
          "System should process user input",
          "System should provide feedback",
          "System should store data securely",
        ],
        non_functional: [
          "System should be responsive",
          "System should be secure",
          "System should be scalable",
        ],
      },
      constraints: [
        "Budget limitations",
        "Timeline constraints",
        "Technical limitations",
      ],
      preferred_format: "JSON",
    };

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      data: mockExtraction,
      message: "Requirements extracted successfully",
    };
  } catch (error) {
    console.error("Requirement extraction error:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to extract requirements",
    };
  }
};

module.exports = {
  extractRequirements,
};
