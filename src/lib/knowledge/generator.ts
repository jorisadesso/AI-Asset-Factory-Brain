import { prisma } from "@/lib/db/client";
import { SectionKey } from "@/types";
import { SECTIONS } from "@/lib/sections";
import { generateMarkdownContent } from "@/lib/ai/service";

export async function generateSectionMarkdown(
  brainId: string,
  sectionKey: SectionKey
): Promise<void> {
  const section = await prisma.brainSection.findUnique({
    where: { brainId_sectionKey: { brainId, sectionKey } },
  });

  let data: Record<string, unknown> = {};

  if (section?.data) {
    try {
      data = JSON.parse(section.data);
    } catch {
      data = {};
    }
  }

  // For products, include product categories
  if (sectionKey === "products") {
    const categories = await prisma.productCategory.findMany({
      where: { brainId },
      orderBy: { sortOrder: "asc" },
    });
    data = {
      categories: categories.map((c) => ({
        name: c.name,
        description: c.description,
        features: JSON.parse(c.features),
        usps: JSON.parse(c.usps),
      })),
    };
  }

  // For target groups, include groups + personas
  if (sectionKey === "target-groups") {
    const groups = await prisma.targetGroup.findMany({
      where: { brainId },
      include: { personas: true },
      orderBy: { sortOrder: "asc" },
    });
    data = {
      groups: groups.map((g) => ({
        name: g.name,
        industry: g.industry,
        description: g.description,
        personas: g.personas.map((p) => ({ name: p.name, description: p.description })),
      })),
    };
  }

  const sectionConfig = SECTIONS.find((s) => s.key === sectionKey);
  if (!sectionConfig) return;

  const markdown = await generateMarkdownContent(sectionKey, data);

  await prisma.knowledgeDocument.upsert({
    where: { brainId_filename: { brainId, filename: sectionConfig.filename } },
    create: { brainId, filename: sectionConfig.filename, content: markdown },
    update: { content: markdown },
  });
}

export async function generateAllMarkdown(brainId: string): Promise<void> {
  const sectionKeys = SECTIONS.map((s) => s.key as SectionKey);
  await Promise.all(sectionKeys.map((key) => generateSectionMarkdown(brainId, key)));
}

export function generateMarkdownLocally(
  sectionKey: SectionKey,
  data: Record<string, unknown>
): string {
  const sectionConfig = SECTIONS.find((s) => s.key === sectionKey);
  const title = sectionConfig?.title || sectionKey;
  const lines: string[] = [`# ${title}\n`];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;

    const label = keyToLabel(key);
    lines.push(`## ${label}`);

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (typeof value[0] === "object") {
        for (const item of value as Record<string, unknown>[]) {
          lines.push(`### ${item.name || "Eintrag"}`);
          for (const [k, v] of Object.entries(item)) {
            if (k === "name" || !v) continue;
            if (Array.isArray(v)) {
              lines.push(`**${keyToLabel(k)}:**`);
              lines.push((v as string[]).map((i) => `- ${i}`).join("\n"));
            } else {
              lines.push(`**${keyToLabel(k)}:** ${v}`);
            }
          }
          lines.push("");
        }
      } else {
        lines.push((value as string[]).map((v) => `- ${v}`).join("\n"));
      }
    } else {
      lines.push(String(value));
    }
    lines.push("");
  }

  return lines.join("\n");
}

function keyToLabel(key: string): string {
  const labels: Record<string, string> = {
    name: "Name",
    description: "Beschreibung",
    mission: "Mission",
    vision: "Vision",
    values: "Unternehmenswerte",
    categories: "Kategorien",
    features: "Funktionen & Leistungen",
    usps: "Alleinstellungsmerkmale",
    groups: "Zielgruppen",
    industry: "Branche",
    personas: "Personas",
    brandPerception: "Markenwahrnehmung",
    communicationStyle: "Kommunikationsstil",
    salutation: "Anrede",
    preferredTerms: "Bevorzugte Begriffe",
    avoidTerms: "Zu vermeidende Begriffe",
    contentGoals: "Content-Ziele",
    contentFormats: "Content-Formate",
    relevantTopics: "Relevante Themen",
    keywords: "Keywords",
    coreMessages: "Kernbotschaften",
    salesArguments: "Verkaufsargumente",
    customerBenefits: "Kundennutzen",
    references: "Referenzen",
    regulations: "Rechtliche Vorgaben",
    forbiddenStatements: "Verbotene Aussagen",
    mandatoryDisclosures: "Pflichtangaben",
    contentSources: "Content-Quellen",
    bestPracticeContent: "Best Practice Content",
    imageStyle: "Bildstil",
    preferredMotifs: "Bevorzugte Motive",
    avoidStyles: "Zu vermeidende Stile",
    forbiddenImages: "Verbotene Bilder",
    alwaysConsider: "Immer berücksichtigen",
    bindingSources: "Verbindliche Quellen",
    conflictResolution: "Konfliktlösung",
  };
  return labels[key] || key;
}
