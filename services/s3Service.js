const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || "eu-north-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET || "movies-app-uploads";

class S3Service {
  /**
   * Upload a file to S3
   * @param {string} filePath - Local file path
   * @param {string} key - S3 object key
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadFile(filePath, key, contentType = "application/pdf") {
    try {
      const fileContent = fs.readFileSync(filePath);

      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      };

      const result = await s3.upload(params).promise();

      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: BUCKET_NAME,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload content directly to S3
   * @param {Buffer|string} content - File content
   * @param {string} key - S3 object key
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadContent(content, key, contentType = "application/pdf") {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
      };

      const result = await s3.upload(params).promise();

      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: BUCKET_NAME,
      };
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload content to S3: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await s3.deleteObject(params).promise();

      return {
        success: true,
        message: "File deleted successfully",
      };
    } catch (error) {
      console.error("S3 delete error:", error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Generate a unique S3 key for documents
   * @param {string} projectId - Project ID
   * @param {string} documentType - Document type (BRD, BLUEPRINT, etc.)
   * @param {string} extension - File extension
   * @returns {string} S3 key
   */
  generateDocumentKey(projectId, documentType, extension = "docx") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `documents/${projectId}/${documentType.toLowerCase()}_${timestamp}.${extension}`;
  }

  /**
   * Get public URL for an S3 object
   * @param {string} key - S3 object key
   * @returns {string} Public URL
   */
  getPublicUrl(key) {
    return `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "eu-north-1"
    }.amazonaws.com/${key}`;
  }
}

module.exports = new S3Service();
