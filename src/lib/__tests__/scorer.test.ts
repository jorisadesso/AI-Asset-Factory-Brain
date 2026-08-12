import { updateBrainCompletion, computeCompletionStatus } from "../completion/scorer";

// Mock prisma
jest.mock("../db/client", () => ({
  prisma: {
    brainSection: {
      findMany: jest.fn().mockResolvedValue([
        {
          sectionKey: "company",
          data: JSON.stringify({
            name: "Test GmbH",
            description: "Eine Testbeschreibung mit mehr als 30 Zeichen für das Scoring.",
            mission: "Unsere Mission ist klar definiert.",
            vision: "Eine starke Vision für die Zukunft.",
            values: ["Innovation", "Qualität", "Transparenz"],
          }),
        },
      ]),
      upsert: jest.fn().mockResolvedValue({}),
    },
    productCategory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    targetGroup: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    brain: {
      update: jest.fn().mockResolvedValue({ completionScore: 10 }),
    },
  },
}));

describe("computeCompletionStatus", () => {
  it("returns 10 section statuses", async () => {
    const statuses = await computeCompletionStatus("test-brain-id");
    expect(statuses).toHaveLength(10);
  });

  it("marks company as non-zero when data is filled", async () => {
    const statuses = await computeCompletionStatus("test-brain-id");
    const company = statuses.find((s) => s.sectionKey === "company");
    expect(company).toBeDefined();
    expect(company!.score).toBeGreaterThan(0);
  });

  it("marks sections with no data as open", async () => {
    const statuses = await computeCompletionStatus("test-brain-id");
    const sales = statuses.find((s) => s.sectionKey === "sales");
    expect(sales?.status).toBe("open");
    expect(sales?.score).toBe(0);
  });
});
