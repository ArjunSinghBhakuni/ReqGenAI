const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} = require("docx");
const fs = require("fs");
const path = require("path");

class DocxGenerationService {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates");
  }

  /**
   * Generate a professional DOCX document from markdown content
   * @param {string} markdownContent - Markdown content from n8n
   * @param {string} documentType - Type of document (BRD, BLUEPRINT)
   * @param {string} projectId - Project ID
   * @param {Object} projectInfo - Additional project information
   * @returns {Promise<Buffer>} Generated DOCX buffer
   */
  async generateProfessionalDocument(
    markdownContent,
    documentType,
    projectId,
    projectInfo = {}
  ) {
    try {
      console.log("Generating DOCX document...");

      // Parse markdown and create document sections
      const sections = this.parseMarkdownSections(markdownContent);

      // Create document with professional structure
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Document Header
              ...this.createDocumentHeader(
                documentType,
                projectId,
                projectInfo
              ),

              // Document Content
              ...this.createDocumentContent(sections, documentType),

              // Document Footer
              ...this.createDocumentFooter(),
            ],
          },
        ],
      });

      // Generate DOCX buffer
      const buffer = await Packer.toBuffer(doc);
      console.log("DOCX document generated successfully");

      return buffer;
    } catch (error) {
      console.error("Error generating DOCX document:", error);
      throw new Error(`Failed to generate DOCX document: ${error.message}`);
    }
  }

  /**
   * Create document header with title and project information
   */
  createDocumentHeader(documentType, projectId, projectInfo) {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    return [
      // Main Title
      new Paragraph({
        children: [
          new TextRun({
            text: this.getDocumentTitle(documentType),
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      }),

      // Project Information Table
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Project ID:",
                        bold: true,
                      }),
                    ],
                  }),
                ],
                width: {
                  size: 30,
                  type: WidthType.PERCENTAGE,
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: projectId,
                      }),
                    ],
                  }),
                ],
                width: {
                  size: 70,
                  type: WidthType.PERCENTAGE,
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Document Type:",
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: documentType,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Generated On:",
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${currentDate} at ${currentTime}`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Version:",
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "1.0",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...(projectInfo.name
            ? [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Project Name:",
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: projectInfo.name,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),
        ],
      }),

      // Spacing after header
      new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: {
          after: 400,
        },
      }),
    ];
  }

  /**
   * Create document content from parsed sections
   */
  createDocumentContent(sections, documentType) {
    const content = [];

    if (sections.length === 0) {
      // If no sections found, add the content as-is
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No structured content found. Please check the source data.",
              italics: true,
            }),
          ],
          spacing: {
            after: 200,
          },
        })
      );
    } else {
      sections.forEach((section, index) => {
        // Add section title
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: index === 0 ? 0 : 300,
              after: 200,
            },
          })
        );

        // Add section content
        const contentLines = section.content
          .split("\n")
          .filter((line) => line.trim());
        contentLines.forEach((line) => {
          if (line.trim()) {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: this.cleanMarkdownText(line),
                  }),
                ],
                spacing: {
                  after: 100,
                },
              })
            );
          }
        });
      });
    }

    return content;
  }

  /**
   * Create document footer
   */
  createDocumentFooter() {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "",
          }),
        ],
        spacing: {
          before: 400,
        },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated by ReqGenAI - ${new Date().toISOString()}`,
            italics: true,
            size: 16,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 200,
        },
      }),
    ];
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
   * Clean markdown text for DOCX
   */
  cleanMarkdownText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
      .replace(/^\s*[-*+]\s*/gm, "• ") // Convert list items
      .replace(/^\s*\d+\.\s*/gm, "") // Remove numbered lists
      .trim();
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
}

module.exports = new DocxGenerationService();

