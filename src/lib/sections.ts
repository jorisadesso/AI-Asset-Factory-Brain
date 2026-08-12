import { SectionConfig, SectionKey } from "@/types";

export const SECTIONS: SectionConfig[] = [
  {
    key: "company",
    title: "Unternehmen",
    description: "Grundlegende Unternehmensinformationen",
    icon: "Building2",
    filename: "company.md",
  },
  {
    key: "products",
    title: "Produkte & Dienstleistungen",
    description: "Ihre Produkt- und Dienstleistungskategorien",
    icon: "Package",
    filename: "product-categories.md",
  },
  {
    key: "target-groups",
    title: "Zielgruppen",
    description: "Ihre wichtigsten Zielgruppen und Personas",
    icon: "Users",
    filename: "target-groups.md",
  },
  {
    key: "brand-language",
    title: "Marke & Sprache",
    description: "Markenpersönlichkeit und Kommunikationsstil",
    icon: "MessageSquare",
    filename: "brand-and-language.md",
  },
  {
    key: "marketing-content",
    title: "Marketing & Content",
    description: "Content-Strategie und wichtige Themen",
    icon: "BarChart2",
    filename: "marketing-and-content.md",
  },
  {
    key: "sales",
    title: "Vertrieb",
    description: "Verkaufsargumente und Kundennutzen",
    icon: "TrendingUp",
    filename: "sales.md",
  },
  {
    key: "legal-compliance",
    title: "Recht & Compliance",
    description: "Rechtliche Vorgaben und Einschränkungen",
    icon: "Shield",
    filename: "legal-and-compliance.md",
  },
  {
    key: "existing-content",
    title: "Bestehender Content",
    description: "Vorhandene Inhalte als Wissensquelle",
    icon: "FileText",
    filename: "existing-content.md",
  },
  {
    key: "visual-media",
    title: "Bilder & Medien",
    description: "Bildsprache und visuelle Richtlinien",
    icon: "Image",
    filename: "visual-guidelines.md",
  },
  {
    key: "ai-knowledge",
    title: "KI-Wissensbasis",
    description: "Regeln und Prioritäten für die KI",
    icon: "Brain",
    filename: "ai-rules.md",
  },
];

export const SECTION_MAP = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s])
) as Record<SectionKey, SectionConfig>;

export function getSectionIndex(key: SectionKey): number {
  return SECTIONS.findIndex((s) => s.key === key);
}
