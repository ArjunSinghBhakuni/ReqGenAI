const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const pptx2json = require("pptx2json");
const fs = require("fs");
const path = require("path");

class FileProcessingService {
  constructor() {
    this.supportedTypes = {
      ".docx": "docx",
      ".pdf": "pdf",
      ".ppt": "ppt",
      ".pptx": "pptx",
    };
  }

  /**
   * Extract text from uploaded file
   * @param {string} filePath - Path to the uploaded file
   * @param {string} originalName - Original filename
   * @returns {Promise<{success: boolean, text: string, error?: string}>}
   */
  async extractText(filePath, originalName) {
    try {
      const ext = path.extname(originalName).toLowerCase();
      const fileType = this.supportedTypes[ext];

      if (!fileType) {
        return {
          success: false,
          error: `Unsupported file type: ${ext}. Supported types: ${Object.keys(
            this.supportedTypes
          ).join(", ")}`,
        };
      }

      let extractedText = "";

      switch (fileType) {
        case "docx":
          extractedText = await this.extractFromDocx(filePath);
          break;
        case "pdf":
          extractedText = await this.extractFromPdf(filePath);
          break;
        case "ppt":
        case "pptx":
          extractedText = await this.extractFromPpt(filePath);
          break;
        default:
          return {
            success: false,
            error: `Unsupported file type: ${fileType}`,
          };
      }

      return {
        success: true,
        text: extractedText.trim(),
      };
    } catch (error) {
      console.error("Error extracting text from file:", error);
      return {
        success: false,
        error: `Failed to extract text: ${error.message}`,
      };
    }
  }

  /**
   * Extract text from DOCX file
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from PDF file
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async extractFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from PPT/PPTX file
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async extractFromPpt(filePath) {
    return new Promise((resolve, reject) => {
      pptx2json(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        let text = "";

        // Extract text from slides
        if (data.slides && Array.isArray(data.slides)) {
          data.slides.forEach((slide, index) => {
            if (slide.text) {
              text += `Slide ${index + 1}:\n${slide.text}\n\n`;
            }
          });
        }

        // Extract text from notes if available
        if (data.notes && Array.isArray(data.notes)) {
          data.notes.forEach((note, index) => {
            if (note.text) {
              text += `Note ${index + 1}:\n${note.text}\n\n`;
            }
          });
        }

        resolve(text.trim());
      });
    });
  }

  /**
   * Check if file type is supported
   * @param {string} filename
   * @returns {boolean}
   */
  isSupported(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedTypes.hasOwnProperty(ext);
  }

  /**
   * Get supported file types
   * @returns {Array<string>}
   */
  getSupportedTypes() {
    return Object.keys(this.supportedTypes);
  }

  /**
   * Get file type from filename
   * @param {string} filename
   * @returns {string}
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedTypes[ext] || "unknown";
  }
}

module.exports = new FileProcessingService();
