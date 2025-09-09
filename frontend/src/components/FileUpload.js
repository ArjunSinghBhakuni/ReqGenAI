import React, { useState, useRef } from "react";
import { fileUploadAPI } from "../services/api";

const FileUpload = ({ onTextExtracted, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [supportedTypes, setSupportedTypes] = useState([
    ".docx",
    ".pdf",
    ".ppt",
    ".pptx",
  ]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    if (!supportedTypes.includes(fileExtension)) {
      onError(
        `Unsupported file type: ${fileExtension}. Supported types: ${supportedTypes.join(
          ", "
        )}`
      );
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onError("File size too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const response = await fileUploadAPI.uploadAndExtractText(file);

      if (response.data.success) {
        const { extractedText: text, filename, fileType } = response.data.data;
        setExtractedText(text);
        onTextExtracted(text, filename);
      } else {
        onError(response.data.error || "Failed to extract text from file");
      }
    } catch (error) {
      console.error("File upload error:", error);
      onError(
        error.response?.data?.error || "Failed to upload and process file"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    setExtractedText("");
    onTextExtracted("", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!uploadedFile ? (
          <div>
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Document
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Processing..." : "Choose File"}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: {supportedTypes.join(", ")} (Max 10MB)
            </p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              File Uploaded Successfully
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-600">
                {formatFileSize(uploadedFile.size)} •{" "}
                {uploadedFile.type || "Unknown type"}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Upload Another
              </button>
              <button
                type="button"
                onClick={clearFile}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isUploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">
              Extracting text from file...
            </span>
          </div>
        </div>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <div className="text-green-500 mr-2">✓</div>
            <h4 className="text-sm font-medium text-green-800">
              Text Extracted Successfully
            </h4>
          </div>
          <p className="text-xs text-green-700 mb-2">
            {extractedText.length} characters extracted from{" "}
            {uploadedFile?.name}
          </p>
          <div className="bg-white rounded border p-2 max-h-32 overflow-y-auto">
            <p className="text-xs text-gray-600 whitespace-pre-wrap">
              {extractedText.substring(0, 200)}
              {extractedText.length > 200 && "..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
