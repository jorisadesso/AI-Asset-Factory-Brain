import type { SectionType } from "@/types";

export interface CompanyData {
  company_name?: string;
  company_description?: string;
  mission?: string;
  vision?: string;
  values?: string[] | string;
}

export interface ProductCategoryData {
  name: string;
  description?: string;
  features: string[];
  usps: string[];
}

export interface TargetGroupData {
  name: string;
  industry?: string;
  description?: string;
  personas: Array<{ description: string }>;
}

export interface BrandLanguageData {
  brand_perception?: string;
  communication_style?: string;
  salutation?: string;
  preferred_terms?: string;
  forbidden_terms?: string;
}

export interface MarketingContentData {
  content_goals?: string;
  content_formats?: string[];
  relevant_topics?: string[];
  keywords?: string[];
  key_messages?: string;
}

export interface SalesData {
  selling_points?: string;
  customer_benefits?: string;
  references?: string;
}

export interface LegalComplianceData {
  legal_requirements?: string;
  forbidden_statements?: string;
  mandatory_disclosures?: string;
}

export interface ExistingContentData {
  content_sources?: string[];
  best_practice_content?: string;
}

export interface VisualGuidelinesData {
  visual_style?: string;
  preferred_motifs?: string;
  forbidden_styles?: string;
  forbidden_images?: string;
}

export interface AiRulesData {
  always_consider?: string;
  authoritative_sources?: string;
  conflict_handling?: string;
}

function formatList(items: string[]): string {
  return items.filter(Boolean).map((item) => `- ${item.trim()}`).join("\n");
}

function section(title: string, content: string | undefined): string {
  if (!content?.trim()) return "";
  return `## ${title}\n${content.trim()}\n`;
}

function listSection(title: string, items: string[] | undefined): string {
  if (!items?.length) return "";
  return `## ${title}\n${formatList(items)}\n`;
}

export function generateCompanyMarkdown(data: CompanyData): string {
  const parts = ["# Unternehmen\n"];

  parts.push(section("Unternehmensname", data.company_name));
  parts.push(section("Unternehmensbeschreibung", data.company_description));
  parts.push(section("Mission", data.mission));
  parts.push(section("Vision", data.vision));

  // values can be a comma-separated string or an array
  const valuesArray = Array.isArray(data.values)
    ? data.values
    : typeof data.values === "string"
      ? data.values.split(",").map((v: string) => v.trim()).filter(Boolean)
      : [];
  parts.push(listSection("Unternehmenswerte", valuesArray));

  return parts.filter(Boolean).join("\n");
}

export function generateProductCategoriesMarkdown(
  categories: ProductCategoryData[]
): string {
  if (categories.length === 0) return "# Produkt- und Dienstleistungskategorien\n\n*Noch keine Kategorien erfasst.*\n";

  const parts = ["# Produkt- und Dienstleistungskategorien\n"];

  categories.forEach((cat, index) => {
    parts.push(`## ${index + 1}. ${cat.name}\n`);
    if (cat.description) parts.push(`${cat.description}\n`);
    if (cat.features.length > 0) {
      parts.push(`### Funktionen und Leistungen\n${formatList(cat.features)}\n`);
    }
    if (cat.usps.length > 0) {
      parts.push(`### USPs\n${formatList(cat.usps)}\n`);
    }
  });

  return parts.join("\n");
}

export function generateTargetGroupsMarkdown(groups: TargetGroupData[]): string {
  if (groups.length === 0) return "# Zielgruppen\n\n*Noch keine Zielgruppen erfasst.*\n";

  const parts = ["# Zielgruppen\n"];

  groups.forEach((group, index) => {
    parts.push(`## ${index + 1}. ${group.name}\n`);
    if (group.industry) parts.push(`**Branche/Markt:** ${group.industry}\n`);
    if (group.description) parts.push(`${group.description}\n`);
    if (group.personas.length > 0) {
      parts.push(`### Personas\n${formatList(group.personas.map((p) => p.description))}\n`);
    }
  });

  return parts.join("\n");
}

export function generateBrandLanguageMarkdown(data: BrandLanguageData): string {
  const parts = ["# Marke & Sprache\n"];

  parts.push(section("Markenwahrnehmung", data.brand_perception));
  parts.push(section("Kommunikationsstil", data.communication_style));
  parts.push(section("Anrede", data.salutation));
  parts.push(section("Bevorzugte Begriffe", data.preferred_terms));
  parts.push(section("Zu vermeidende Begriffe", data.forbidden_terms));

  return parts.filter(Boolean).join("\n");
}

export function generateMarketingContentMarkdown(data: MarketingContentData): string {
  const parts = ["# Marketing & Content\n"];

  parts.push(section("Content-Ziele", data.content_goals));
  parts.push(listSection("Content-Formate", data.content_formats));
  parts.push(listSection("Relevante Themen", data.relevant_topics));
  parts.push(listSection("Keywords", data.keywords));
  parts.push(section("Zentrale Marketingbotschaften", data.key_messages));

  return parts.filter(Boolean).join("\n");
}

export function generateSalesMarkdown(data: SalesData): string {
  const parts = ["# Vertrieb\n"];

  parts.push(section("Wichtigste Verkaufsargumente", data.selling_points));
  parts.push(section("Konkreter Kundennutzen", data.customer_benefits));
  parts.push(section("Kunden und Referenzen", data.references));

  return parts.filter(Boolean).join("\n");
}

export function generateLegalComplianceMarkdown(data: LegalComplianceData): string {
  const parts = ["# Recht & Compliance\n"];

  parts.push(section("Rechtliche Anforderungen", data.legal_requirements));
  parts.push(section("Verbotene Aussagen und Versprechen", data.forbidden_statements));
  parts.push(section("Pflichtangaben und rechtliche Hinweise", data.mandatory_disclosures));

  return parts.filter(Boolean).join("\n");
}

export function generateExistingContentMarkdown(data: ExistingContentData): string {
  const parts = ["# Bestehender Content\n"];

  parts.push(listSection("Wissensquellen", data.content_sources));
  parts.push(section("Best-Practice-Inhalte", data.best_practice_content));

  return parts.filter(Boolean).join("\n");
}

export function generateVisualGuidelinesMarkdown(data: VisualGuidelinesData): string {
  const parts = ["# Bilder & Medien\n"];

  parts.push(section("Bildsprache", data.visual_style));
  parts.push(section("Bevorzugte Motive", data.preferred_motifs));
  parts.push(section("Zu vermeidende visuelle Stile", data.forbidden_styles));
  parts.push(section("Verbotene Darstellungen", data.forbidden_images));

  return parts.filter(Boolean).join("\n");
}

export function generateAiRulesMarkdown(data: AiRulesData): string {
  const parts = ["# KI-Wissensbasis\n"];

  parts.push(section("Immer zu berücksichtigende Informationen", data.always_consider));
  parts.push(section("Verbindliche Quellen", data.authoritative_sources));
  parts.push(section("Umgang mit widersprüchlichen oder fehlenden Informationen", data.conflict_handling));

  return parts.filter(Boolean).join("\n");
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function normalizeListFields(data: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const result = { ...data };
  for (const key of keys) {
    result[key] = toArray(result[key]);
  }
  return result;
}

function generateSectionFromAnswers(
  sectionType: SectionType,
  sectionLabel: string,
  answers: Record<string, string>
): string {
  const { SECTION_CONFIGS } = require("@/types") as typeof import("@/types");
  const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
  const questions = config?.questions ?? [];

  const filled = questions.filter((q) => answers[q.key]?.trim());
  if (filled.length === 0) return `# ${sectionLabel}\n\n*Noch keine Informationen erfasst.*\n`;

  const lines: string[] = [`# ${sectionLabel}\n`];
  for (const q of filled) {
    lines.push(`## ${q.label}\n`);
    lines.push(`${answers[q.key].trim()}\n`);
  }
  return lines.join("\n");
}

export function generateMarkdownForSection(
  sectionType: SectionType,
  data: Record<string, unknown>,
  dynamicData?: {
    productCategories?: ProductCategoryData[];
    targetGroups?: TargetGroupData[];
  }
): string {
  switch (sectionType) {
    case "COMPANY":
      return generateCompanyMarkdown(normalizeListFields(data, ["values"]) as CompanyData);
    case "PRODUCT_CATEGORIES":
      return generateSectionFromAnswers("PRODUCT_CATEGORIES", "Produkt- und Dienstleistungskategorien", data as Record<string, string>);
    case "TARGET_GROUPS":
      return generateSectionFromAnswers("TARGET_GROUPS", "Zielgruppen", data as Record<string, string>);
    case "BRAND_LANGUAGE":
      return generateBrandLanguageMarkdown(data as BrandLanguageData);
    case "MARKETING_CONTENT":
      return generateMarketingContentMarkdown(
        normalizeListFields(data, ["content_formats", "relevant_topics", "keywords"]) as MarketingContentData
      );
    case "SALES":
      return generateSalesMarkdown(data as SalesData);
    case "LEGAL_COMPLIANCE":
      return generateLegalComplianceMarkdown(data as LegalComplianceData);
    case "EXISTING_CONTENT":
      return generateExistingContentMarkdown(
        normalizeListFields(data, ["content_sources"]) as ExistingContentData
      );
    case "VISUAL_GUIDELINES":
      return generateVisualGuidelinesMarkdown(data as VisualGuidelinesData);
    case "AI_RULES":
      return generateAiRulesMarkdown(data as AiRulesData);
    default:
      return `# ${sectionType}\n\n*Kein Inhalt verfügbar.*\n`;
  }
}

export function calculateCompletionScore(
  sectionType: SectionType,
  answers: Record<string, string>,
  dynamicCount?: number
): number {
  const { SECTION_CONFIGS } = require("@/types") as typeof import("@/types");

  const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
  const questions = config?.questions ?? [];
  if (questions.length === 0) return 0;

  let filled = 0;
  for (const q of questions) {
    const value = answers[q.key];
    if (value && value.trim().length > 0) filled++;
  }

  return filled / questions.length;
}
