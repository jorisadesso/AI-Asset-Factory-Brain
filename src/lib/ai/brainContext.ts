import { prisma } from "@/lib/db/prisma";
import { safeParseArray } from "@/lib/db/parse";
import { SECTION_CONFIGS } from "@/types";

// Keyword → SectionType mapping (German terms users typically ask about)
const SECTION_KEYWORDS: Record<string, string[]> = {
  COMPANY: [
    "mission", "vision", "unternehmen", "werte", "wert", "gründ", "name", "firma",
    "beschreibung", "kernwert", "über uns", "was macht ihr", "wer sind",
  ],
  PRODUCT_CATEGORIES: [
    "produkt", "dienstleistung", "usp", "feature", "leistung", "angebot",
    "kategorie", "lösung", "service", "angebote",
  ],
  TARGET_GROUPS: [
    "zielgruppe", "persona", "zielkund", "kund", "branche", "markt",
    "segment", "ansprechpartner", "käufer",
  ],
  BRAND_LANGUAGE: [
    "tonalität", "anrede", "sprache", "kommunikation", "stil", "begriffe",
    "formulierung", "wording", "du ", "sie ", "verboten",
  ],
  MARKETING_CONTENT: [
    "marketing", "content", "keyword", "thema", "themen", "format",
    "botschaft", "blog", "linkedin", "newsletter", "seo",
  ],
  SALES: [
    "vertrieb", "verkauf", "argument", "nutzen", "kundennutzen", "referenz",
    "vorteil", "selling",
  ],
  LEGAL_COMPLIANCE: [
    "compliance", "recht", "rechtlich", "dsgvo", "gesetz", "pflicht",
    "garantie", "regulat", "eu ai act", "haftung",
  ],
  EXISTING_CONTENT: [
    "bestehend", "quelle", "material", "website", "broschüre", "whitepaper",
    "best practice",
  ],
  VISUAL_GUIDELINES: [
    "bild", "visual", "medien", "foto", "bildsprache", "design", "grafik",
    "motiv",
  ],
  AI_RULES: ["ki-regel", "ki-wissen", "anweisung", "priorität", "ki immer"],
};

const MAX_CONTEXT_CHARS = 2500;
const MAX_ANSWER_CHARS = 300;
const MAX_ANSWERS_PER_SECTION = 3;
const MAX_DYNAMIC_ENTRIES = 3;

/** Selects section types relevant to the user message via keyword matching. */
export function selectRelevantSections(message: string): string[] {
  const lower = message.toLowerCase();
  const matched: string[] = [];

  for (const [sectionType, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(sectionType);
    }
  }

  // Fallback: always include COMPANY (most universal)
  return matched.length > 0 ? matched : ["COMPANY"];
}

/**
 * Builds a compact brain context string for the given user and message.
 * Only loads sections relevant to the message. Returns "" if brain is empty.
 * Enforces a hard character cap to stay token-efficient.
 */
export async function buildBrainContext(userId: string, message: string): Promise<string> {
  const sectionTypes = selectRelevantSections(message);

  const brain = await prisma.brain.findFirst({
    where: { userId },
    include: {
      sections: {
        where: { sectionType: { in: sectionTypes } },
        include: { answers: true },
      },
      productCategories: true,
      targetGroups: { include: { personas: true } },
    },
  });

  if (!brain) return "";

  const parts: string[] = [];

  for (const sectionType of sectionTypes) {
    if (sectionType === "PRODUCT_CATEGORIES") {
      const cats = brain.productCategories;
      if (cats.length === 0) continue;
      const lines = cats.slice(0, MAX_DYNAMIC_ENTRIES).map((c) => {
        const desc = c.description ? `: ${c.description.slice(0, 150)}` : "";
        const features = safeParseArray(c.features).slice(0, 2).join(", ");
        const usps = safeParseArray(c.usps).slice(0, 2).join(", ");
        const extras = [features && `Features: ${features}`, usps && `USPs: ${usps}`]
          .filter(Boolean)
          .join(" | ");
        return `  - ${c.name}${desc}${extras ? ` (${extras})` : ""}`;
      });
      parts.push(`**Produkt- & Dienstleistungskategorien:**\n${lines.join("\n")}`);
      continue;
    }

    if (sectionType === "TARGET_GROUPS") {
      const groups = brain.targetGroups;
      if (groups.length === 0) continue;
      const lines = groups.slice(0, MAX_DYNAMIC_ENTRIES).map((g) => {
        const desc = g.description ? `: ${g.description.slice(0, 150)}` : "";
        const industry = g.industry ? ` (${g.industry})` : "";
        return `  - ${g.name}${industry}${desc}`;
      });
      parts.push(`**Zielgruppen:**\n${lines.join("\n")}`);
      continue;
    }

    const section = brain.sections.find((s) => s.sectionType === sectionType);
    if (!section || section.answers.length === 0) continue;

    const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
    const sectionLabel = config?.label ?? sectionType;

    const answerLines: string[] = [];
    for (const answer of section.answers.slice(0, MAX_ANSWERS_PER_SECTION)) {
      if (!answer.value.trim()) continue;
      const q = config?.questions.find((q) => q.key === answer.questionKey);
      const qLabel = q?.label ?? answer.questionKey;
      const value = answer.value.slice(0, MAX_ANSWER_CHARS);
      answerLines.push(`  - ${qLabel}: ${value}`);
    }

    if (answerLines.length > 0) {
      parts.push(`**${sectionLabel}:**\n${answerLines.join("\n")}`);
    }
  }

  if (parts.length === 0) return "";

  const context = `## Hinterlegtes Unternehmenswissen (Brain des Nutzers)\n\n${parts.join("\n\n")}`;

  if (context.length > MAX_CONTEXT_CHARS) {
    return context.slice(0, MAX_CONTEXT_CHARS) + "\n[Kontext gekürzt]";
  }

  return context;
}
