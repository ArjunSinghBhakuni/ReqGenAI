import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequirement } from "../context/RequirementContext";
import { useToast } from "../utils/toast";

const CreateRequirement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { createRequirement, loading, error, clearError } = useRequirement();

  const [inputType, setInputType] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    source: "",
    filename: "",
  });

  const inputTypeOptions = [
    {
      value: "manual",
      label: "Manual Input",
      description: "Type or paste your requirements directly",
      icon: "✍️",
      color: "blue",
    },
    {
      value: "transcript",
      label: "Meeting Transcript",
      description: "Paste meeting notes or conversation transcripts",
      icon: "🎤",
      color: "green",
    },
    {
      value: "file",
      label: "File Content",
      description: "Paste content from uploaded documents",
      icon: "📄",
      color: "purple",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.content ||
      typeof formData.content !== "string" ||
      !formData.content.trim()
    ) {
      toast.error({
        title: "Content Required",
        description: "Please provide requirement content before submitting.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRequirement({
        source: inputType,
        content: formData.content,
        sourceDetail:
          inputType === "transcript"
            ? formData.source
            : inputType === "file"
            ? formData.filename
            : null,
      });

      if (result.success) {
        toast.success({
          title: "Requirement Created!",
          description:
            "Your requirement has been created and processing has started.",
        });
        navigate(`/requirement/${result.project_id}`);
      }
    } catch (err) {
      toast.error({
        title: "Creation Failed",
        description: "Failed to create requirement. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Requirement
        </h1>
        <p className="text-gray-600">
          Transform your client conversations, emails, and documents into
          structured requirements
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
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
                Error creating requirement!
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Input Type Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Input Type
              </h2>
              <p className="text-sm text-gray-600">
                Choose how you want to provide your requirement information
              </p>
            </div>
            <div className="space-y-4">
              {inputTypeOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    inputType === option.value
                      ? `border-${option.color}-300 bg-${option.color}-50`
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => setInputType(option.value)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {option.label}
                        </h3>
                        {inputType === option.value && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${option.color}-100 text-${option.color}-800`}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Requirement Content
              </h2>
              <p className="text-sm text-gray-600">
                {inputType === "manual" &&
                  "Describe your project requirements in detail"}
                {inputType === "transcript" &&
                  "Paste your meeting transcript or conversation notes"}
                {inputType === "file" &&
                  "Paste the content from your uploaded file"}
              </p>
            </div>
            <div className="space-y-4">
              {inputType === "transcript" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Zoom Meeting, Client Call, Email Thread"
                    value={formData.source}
                    onChange={(e) =>
                      handleInputChange("source", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Specify the source of this transcript
                  </p>
                </div>
              )}
              {inputType === "file" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filename
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., requirements.pdf, client-email.txt"
                    value={formData.filename}
                    onChange={(e) =>
                      handleInputChange("filename", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Specify the original filename
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder={
                    inputType === "manual"
                      ? 'Describe your project requirements in detail. For example:\n\n"We need a mobile app for food delivery. It should allow users to order food, pay online, track delivery, and rate restaurants. The app should be available on both iOS and Android. We want to launch in 4 months with a budget around $30,000."'
                      : inputType === "transcript"
                      ? "Paste your meeting transcript here..."
                      : "Paste the content from your file here..."
                  }
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={12}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-vertical"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Be as detailed as possible. Include project goals, features,
                  constraints, timeline, and budget information.
                </p>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-700">
                💡 Tips for Better Results
              </h3>
              <div className="space-y-2 text-sm text-blue-600">
                <p>
                  • Include specific features and functionality requirements
                </p>
                <p>• Mention technical preferences or constraints</p>
                <p>• Specify timeline and budget if available</p>
                <p>• Include target audience and business objectives</p>
                <p>• Mention any existing systems or integrations needed</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-lg font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Requirement
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRequirement;
