const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

class DocumentGenerationService {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates");
  }

  /**
   * Generate a professional document from markdown content
   * @param {string} markdownContent - Markdown content from n8n
   * @param {string} documentType - Type of document (BRD, BLUEPRINT)
   * @param {string} projectId - Project ID
   * @param {Object} projectInfo - Additional project information
   * @returns {Promise<Buffer>} Generated PDF buffer
   */
  async generateProfessionalDocument(
    markdownContent,
    documentType,
    projectId,
    projectInfo = {}
  ) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Add document header
        this.addDocumentHeader(doc, documentType, projectId, projectInfo);

        // Add content based on document type
        if (documentType === "BRD") {
          this.addBRDContent(doc, markdownContent);
        } else if (documentType === "BLUEPRINT") {
          this.addBlueprintContent(doc, markdownContent);
        } else {
          this.addGenericContent(doc, markdownContent);
        }

        // Add footer
        this.addDocumentFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add document header
   */
  addDocumentHeader(doc, documentType, projectId, projectInfo) {
    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(this.getDocumentTitle(documentType), 50, 50, { align: "center" });

    // Project information
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Project ID: ${projectId}`, 50, 100)
      .text(`Document Type: ${documentType}`, 50, 120)
      .text(`Generated On: ${new Date().toLocaleDateString()}`, 50, 140)
      .text(`Version: 1.0`, 50, 160);

    // Add project name if available
    if (projectInfo.name) {
      doc.text(`Project Name: ${projectInfo.name}`, 50, 180);
    }

    // Draw a line
    doc.moveTo(50, 220).lineTo(550, 220).stroke();

    // Move to content area
    doc.y = 240;
  }

  /**
   * Add BRD specific content
   */
  addBRDContent(doc, markdownContent) {
    // Parse markdown and add structured content
    const sections = this.parseMarkdownSections(markdownContent);

    if (sections.length === 0) {
      // If no sections found, add the content as-is
      doc.fontSize(12).font("Helvetica").text(markdownContent, 50, doc.y, {
        width: 500,
        align: "left",
        lineGap: 2,
      });
    } else {
      sections.forEach((section) => {
        this.addSection(doc, section.title, section.content);
      });
    }
  }

  /**
   * Add Blueprint specific content
   */
  addBlueprintContent(doc, markdownContent) {
    // Parse markdown and add structured content
    const sections = this.parseMarkdownSections(markdownContent);

    if (sections.length === 0) {
      // If no sections found, add the content as-is
      doc.fontSize(12).font("Helvetica").text(markdownContent, 50, doc.y, {
        width: 500,
        align: "left",
        lineGap: 2,
      });
    } else {
      sections.forEach((section) => {
        this.addSection(doc, section.title, section.content);
      });
    }
  }

  /**
   * Add generic content
   */
  addGenericContent(doc, markdownContent) {
    const sections = this.parseMarkdownSections(markdownContent);

    if (sections.length === 0) {
      // If no sections found, add the content as-is
      doc.fontSize(12).font("Helvetica").text(markdownContent, 50, doc.y, {
        width: 500,
        align: "left",
        lineGap: 2,
      });
    } else {
      sections.forEach((section) => {
        this.addSection(doc, section.title, section.content);
      });
    }
  }

  /**
   * Add a section to the document
   */
  addSection(doc, title, content) {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
    }

    // Add section title
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(title, 50, doc.y)
      .moveDown(0.5);

    // Add section content
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(content, 50, doc.y, {
        width: 500,
        align: "left",
        lineGap: 2,
      })
      .moveDown(1);
  }

  /**
   * Parse markdown content into sections
   */
  parseMarkdownSections(markdownContent) {
    const sections = [];
    const lines = markdownContent.split("\n");
    let currentSection = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if it's a header (starts with #)
      if (trimmedLine.startsWith("#")) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: trimmedLine.replace(/^#+\s*/, ""), // Remove # symbols
          content: "",
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += line + "\n";
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Add document footer
   */
  addDocumentFooter(doc) {
    // Add footer to current page
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generated by ReqGenAI - ${new Date().toISOString()}`,
        50,
        doc.page.height - 30,
        { align: "center" }
      );
  }

  /**
   * Get document title based on type
   */
  getDocumentTitle(documentType) {
    switch (documentType) {
      case "BRD":
        return "Business Requirements Document";
      case "BLUEPRINT":
        return "Requirements Blueprint Document";
      default:
        return "Project Document";
    }
  }

  /**
   * Convert markdown to plain text (remove markdown syntax)
   */
  markdownToPlainText(markdown) {
    return markdown
      .replace(/^#+\s*/gm, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
      .replace(/^\s*[-*+]\s*/gm, "• ") // Convert list items
      .replace(/^\s*\d+\.\s*/gm, "") // Remove numbered lists
      .trim();
  }
}

module.exports = new DocumentGenerationService();
