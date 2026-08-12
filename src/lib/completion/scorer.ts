import { SectionKey, SectionStatus, CompletionStatus } from "@/types";
import { prisma } from "@/lib/db/client";

interface SectionData {
  sectionKey: SectionKey;
  data: Record<string, unknown>;
  categories?: unknown[];
  groups?: unknown[];
}

function scoreField(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return 0;
    if (value.length === 1) return 0.5;
    return 1;
  }
  const str = String(value).trim();
  if (str.length < 10) return 0.3;
  if (str.length < 30) return 0.7;
  return 1;
}

function scoreSection(sectionData: SectionData): number {
  const { sectionKey, data, categories, groups } = sectionData;

  switch (sectionKey) {
    case "company": {
      const weights = { name: 0.25, description: 0.25, mission: 0.2, vision: 0.2, values: 0.1 };
      return Object.entries(weights).reduce(
        (sum, [key, weight]) => sum + scoreField((data as Record<string, unknown>)[key]) * weight,
        0
      );
    }

    case "products": {
      if (!categories || categories.length === 0) return 0;
      const catScores = (categories as { name: string; description: string; features: unknown[]; usps: unknown[] }[]).map(
        (c) =>
          (scoreField(c.name) * 0.3 +
            scoreField(c.description) * 0.3 +
            scoreField(c.features) * 0.2 +
            scoreField(c.usps) * 0.2)
      );
      return catScores.reduce((a, b) => a + b, 0) / catScores.length;
    }

    case "target-groups": {
      if (!groups || groups.length === 0) return 0;
      const groupScores = (groups as { name: string; industry: string; description: string; personas: unknown[] }[]).map(
        (g) =>
          scoreField(g.name) * 0.25 +
          scoreField(g.industry) * 0.2 +
          scoreField(g.description) * 0.35 +
          scoreField(g.personas) * 0.2
      );
      return groupScores.reduce((a, b) => a + b, 0) / groupScores.length;
    }

    case "brand-language": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.brandPerception) * 0.25 +
        scoreField(d.communicationStyle) * 0.25 +
        scoreField(d.salutation) * 0.15 +
        scoreField(d.preferredTerms) * 0.15 +
        scoreField(d.avoidTerms) * 0.2
      );
    }

    case "marketing-content": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.contentGoals) * 0.25 +
        scoreField(d.contentFormats) * 0.2 +
        scoreField(d.relevantTopics) * 0.2 +
        scoreField(d.keywords) * 0.2 +
        scoreField(d.coreMessages) * 0.15
      );
    }

    case "sales": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.salesArguments) * 0.4 +
        scoreField(d.customerBenefits) * 0.4 +
        scoreField(d.references) * 0.2
      );
    }

    case "legal-compliance": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.regulations) * 0.4 +
        scoreField(d.forbiddenStatements) * 0.4 +
        scoreField(d.mandatoryDisclosures) * 0.2
      );
    }

    case "existing-content": {
      const d = data as Record<string, unknown>;
      return scoreField(d.contentSources) * 0.5 + scoreField(d.bestPracticeContent) * 0.5;
    }

    case "visual-media": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.imageStyle) * 0.3 +
        scoreField(d.preferredMotifs) * 0.3 +
        scoreField(d.avoidStyles) * 0.2 +
        scoreField(d.forbiddenImages) * 0.2
      );
    }

    case "ai-knowledge": {
      const d = data as Record<string, unknown>;
      return (
        scoreField(d.alwaysConsider) * 0.4 +
        scoreField(d.bindingSources) * 0.3 +
        scoreField(d.conflictResolution) * 0.3
      );
    }

    default:
      return 0;
  }
}

function scoreToStatus(score: number): SectionStatus {
  if (score >= 0.85) return "complete";
  if (score > 0) return "partial";
  return "open";
}

export async function computeCompletionStatus(brainId: string): Promise<CompletionStatus[]> {
  const [sections, categories, groups] = await Promise.all([
    prisma.brainSection.findMany({ where: { brainId } }),
    prisma.productCategory.findMany({ where: { brainId }, include: { brain: false } }),
    prisma.targetGroup.findMany({ where: { brainId }, include: { personas: true } }),
  ]);

  const sectionMap = Object.fromEntries(sections.map((s) => [s.sectionKey, s]));

  const SECTION_KEYS: SectionKey[] = [
    "company", "products", "target-groups", "brand-language",
    "marketing-content", "sales", "legal-compliance",
    "existing-content", "visual-media", "ai-knowledge",
  ];

  return SECTION_KEYS.map((key) => {
    const section = sectionMap[key];
    let data: Record<string, unknown> = {};
    if (section?.data) {
      try {
        data = JSON.parse(section.data);
      } catch {
        data = {};
      }
    }

    const score = scoreSection({
      sectionKey: key,
      data,
      categories: key === "products" ? categories.map((c) => ({
        name: c.name,
        description: c.description,
        features: JSON.parse(c.features),
        usps: JSON.parse(c.usps),
      })) : undefined,
      groups: key === "target-groups" ? groups.map((g) => ({
        name: g.name,
        industry: g.industry,
        description: g.description,
        personas: g.personas,
      })) : undefined,
    });

    const percentage = Math.round(score * 100);
    return {
      sectionKey: key,
      score: percentage,
      status: scoreToStatus(score),
    };
  });
}

export async function updateBrainCompletion(brainId: string): Promise<number> {
  const statuses = await computeCompletionStatus(brainId);
  const total = Math.round(
    statuses.reduce((sum, s) => sum + s.score, 0) / statuses.length
  );

  await prisma.brain.update({
    where: { id: brainId },
    data: { completionScore: total },
  });

  // Update each section status
  await Promise.all(
    statuses.map((s) =>
      prisma.brainSection.upsert({
        where: { brainId_sectionKey: { brainId, sectionKey: s.sectionKey } },
        create: {
          brainId,
          sectionKey: s.sectionKey,
          status: s.status,
          completionScore: s.score,
          data: "{}",
        },
        update: { status: s.status, completionScore: s.score },
      })
    )
  );

  return total;
}
