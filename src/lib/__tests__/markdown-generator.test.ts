// Mock db client to avoid requiring a real SQLite connection
jest.mock("../db/client", () => ({
  prisma: {
    brainSection: { findUnique: jest.fn(), upsert: jest.fn() },
    productCategory: { findMany: jest.fn().mockResolvedValue([]) },
    targetGroup: { findMany: jest.fn().mockResolvedValue([]) },
    knowledgeDocument: { upsert: jest.fn() },
  },
}));

import { generateMarkdownLocally } from "../knowledge/generator";

describe("generateMarkdownLocally", () => {
  it("generates markdown for company section", () => {
    const md = generateMarkdownLocally("company", {
      name: "Test GmbH",
      description: "Eine Beschreibung.",
      mission: "Unsere Mission.",
      vision: "Unsere Vision.",
      values: ["Innovation", "Qualität"],
    });

    expect(md).toContain("# Unternehmen");
    expect(md).toContain("Test GmbH");
    expect(md).toContain("Beschreibung");
    expect(md).toContain("- Innovation");
    expect(md).toContain("- Qualität");
  });

  it("skips empty fields", () => {
    const md = generateMarkdownLocally("company", {
      name: "Test GmbH",
      description: "",
      values: [],
    });

    expect(md).not.toContain("## Beschreibung");
  });

  it("handles array of objects for categories", () => {
    const md = generateMarkdownLocally("products", {
      categories: [
        {
          name: "Marketing Automation",
          description: "Automatisierung von Marketingprozessen.",
          features: ["E-Mail", "Lead Scoring"],
          usps: ["Schnell", "Einfach"],
        },
      ],
    });

    expect(md).toContain("Marketing Automation");
    expect(md).toContain("- E-Mail");
  });
});
