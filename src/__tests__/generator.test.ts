import { describe, it, expect } from "vitest";
import {
  generateCompanyMarkdown,
  generateProductCategoriesMarkdown,
  generateTargetGroupsMarkdown,
  generateBrandLanguageMarkdown,
  generateMarketingContentMarkdown,
  generateSalesMarkdown,
  generateLegalComplianceMarkdown,
  generateExistingContentMarkdown,
  generateVisualGuidelinesMarkdown,
  generateAiRulesMarkdown,
  generateMarkdownForSection,
} from "@/lib/knowledge/generator";

// ---------------------------------------------------------------------------
// generateCompanyMarkdown
// ---------------------------------------------------------------------------
describe("generateCompanyMarkdown", () => {
  it("happy path: enthält alle Abschnitte bei vollständigen Daten", () => {
    const result = generateCompanyMarkdown({
      company_name: "Musterag GmbH",
      company_description: "Eine tolle Firma",
      mission: "Qualität liefern",
      vision: "Marktführer werden",
      values: ["Ehrlichkeit", "Innovation", "Verlässlichkeit"],
    });

    expect(result).toContain("# Unternehmen");
    expect(result).toContain("## Unternehmensname");
    expect(result).toContain("Musterag GmbH");
    expect(result).toContain("## Unternehmensbeschreibung");
    expect(result).toContain("Eine tolle Firma");
    expect(result).toContain("## Mission");
    expect(result).toContain("Qualität liefern");
    expect(result).toContain("## Vision");
    expect(result).toContain("Marktführer werden");
    expect(result).toContain("## Unternehmenswerte");
    expect(result).toContain("- Ehrlichkeit");
    expect(result).toContain("- Innovation");
    expect(result).toContain("- Verlässlichkeit");
  });

  it("partial data: fehlende Felder erzeugen keine leeren Abschnitte", () => {
    const result = generateCompanyMarkdown({
      company_name: "Teilfirma AG",
    });

    expect(result).toContain("# Unternehmen");
    expect(result).toContain("## Unternehmensname");
    expect(result).toContain("Teilfirma AG");
    expect(result).not.toContain("## Unternehmensbeschreibung");
    expect(result).not.toContain("## Mission");
    expect(result).not.toContain("## Vision");
    expect(result).not.toContain("## Unternehmenswerte");
  });

  it("empty input: nur die Hauptüberschrift, kein Absturz", () => {
    const result = generateCompanyMarkdown({});

    expect(result).toContain("# Unternehmen");
    expect(result).not.toContain("## ");
  });

  it("comma-string normalization: Komma-String erzeugt separate Bullet-Points", () => {
    const result = generateCompanyMarkdown({
      values: "Ehrlichkeit, Innovation",
    });

    expect(result).toContain("## Unternehmenswerte");
    expect(result).toContain("- Ehrlichkeit");
    expect(result).toContain("- Innovation");
  });

  it("values als Array: einzelne Einträge werden korrekt gelistet", () => {
    const result = generateCompanyMarkdown({
      values: ["Teamgeist", "Offenheit"],
    });

    expect(result).toContain("- Teamgeist");
    expect(result).toContain("- Offenheit");
  });
});

// ---------------------------------------------------------------------------
// generateProductCategoriesMarkdown
// ---------------------------------------------------------------------------
describe("generateProductCategoriesMarkdown", () => {
  it("happy path: eine Kategorie mit allen Feldern", () => {
    const result = generateProductCategoriesMarkdown([
      {
        name: "CRM-Software",
        description: "Software für Kundenbeziehungen",
        features: ["Lead-Verwaltung", "Reporting"],
        usps: ["Einfache Integration", "KI-gestützt"],
      },
    ]);

    expect(result).toContain("# Produkt- und Dienstleistungskategorien");
    expect(result).toContain("CRM-Software");
    expect(result).toContain("Software für Kundenbeziehungen");
    expect(result).toContain("### Funktionen und Leistungen");
    expect(result).toContain("- Lead-Verwaltung");
    expect(result).toContain("- Reporting");
    expect(result).toContain("### USPs");
    expect(result).toContain("- Einfache Integration");
    expect(result).toContain("- KI-gestützt");
  });

  it("partial data: Kategorie ohne optionale Felder", () => {
    const result = generateProductCategoriesMarkdown([
      {
        name: "Beratung",
        features: [],
        usps: [],
      },
    ]);

    expect(result).toContain("# Produkt- und Dienstleistungskategorien");
    expect(result).toContain("Beratung");
    expect(result).not.toContain("### Funktionen und Leistungen");
    expect(result).not.toContain("### USPs");
  });

  it("empty array: Platzhaltertext wird zurückgegeben", () => {
    const result = generateProductCategoriesMarkdown([]);

    expect(result).toContain("# Produkt- und Dienstleistungskategorien");
    expect(result).toContain("Noch keine Kategorien erfasst");
  });

  it("mehrere Kategorien werden nummeriert", () => {
    const result = generateProductCategoriesMarkdown([
      { name: "Kategorie A", features: [], usps: [] },
      { name: "Kategorie B", features: [], usps: [] },
    ]);

    expect(result).toContain("1. Kategorie A");
    expect(result).toContain("2. Kategorie B");
  });
});

// ---------------------------------------------------------------------------
// generateTargetGroupsMarkdown
// ---------------------------------------------------------------------------
describe("generateTargetGroupsMarkdown", () => {
  it("happy path: eine Zielgruppe mit allen Feldern", () => {
    const result = generateTargetGroupsMarkdown([
      {
        name: "KMU-Einkäufer",
        industry: "Handel",
        description: "Einkäufer in mittelständischen Handelsunternehmen",
        personas: [
          { description: "Petra, 42, sucht Effizienzlösungen" },
          { description: "Klaus, 55, schätzt persönliche Beratung" },
        ],
      },
    ]);

    expect(result).toContain("# Zielgruppen");
    expect(result).toContain("KMU-Einkäufer");
    expect(result).toContain("**Branche/Markt:** Handel");
    expect(result).toContain("Einkäufer in mittelständischen");
    expect(result).toContain("### Personas");
    expect(result).toContain("- Petra, 42");
    expect(result).toContain("- Klaus, 55");
  });

  it("partial data: Zielgruppe ohne optionale Felder", () => {
    const result = generateTargetGroupsMarkdown([
      {
        name: "IT-Leiter",
        personas: [],
      },
    ]);

    expect(result).toContain("# Zielgruppen");
    expect(result).toContain("IT-Leiter");
    expect(result).not.toContain("**Branche/Markt:**");
    expect(result).not.toContain("### Personas");
  });

  it("empty array: Platzhaltertext wird zurückgegeben", () => {
    const result = generateTargetGroupsMarkdown([]);

    expect(result).toContain("# Zielgruppen");
    expect(result).toContain("Noch keine Zielgruppen erfasst");
  });
});

// ---------------------------------------------------------------------------
// generateBrandLanguageMarkdown
// ---------------------------------------------------------------------------
describe("generateBrandLanguageMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateBrandLanguageMarkdown({
      brand_perception: "Modern und vertrauenswürdig",
      communication_style: "Klar und direkt",
      salutation: "Sie",
      preferred_terms: "Lösung, Partnerschaft",
      forbidden_terms: "billig, günstig",
    });

    expect(result).toContain("# Marke & Sprache");
    expect(result).toContain("## Markenwahrnehmung");
    expect(result).toContain("Modern und vertrauenswürdig");
    expect(result).toContain("## Kommunikationsstil");
    expect(result).toContain("Klar und direkt");
    expect(result).toContain("## Anrede");
    expect(result).toContain("Sie");
    expect(result).toContain("## Bevorzugte Begriffe");
    expect(result).toContain("Lösung, Partnerschaft");
    expect(result).toContain("## Zu vermeidende Begriffe");
    expect(result).toContain("billig, günstig");
  });

  it("partial data: nur Kommunikationsstil gesetzt", () => {
    const result = generateBrandLanguageMarkdown({
      communication_style: "Locker und nahbar",
    });

    expect(result).toContain("# Marke & Sprache");
    expect(result).toContain("## Kommunikationsstil");
    expect(result).toContain("Locker und nahbar");
    expect(result).not.toContain("## Markenwahrnehmung");
    expect(result).not.toContain("## Anrede");
    expect(result).not.toContain("## Bevorzugte Begriffe");
    expect(result).not.toContain("## Zu vermeidende Begriffe");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateBrandLanguageMarkdown({});

    expect(result).toContain("# Marke & Sprache");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateMarketingContentMarkdown
// ---------------------------------------------------------------------------
describe("generateMarketingContentMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateMarketingContentMarkdown({
      content_goals: "Reichweite erhöhen",
      content_formats: ["Blogartikel", "Video"],
      relevant_topics: ["Digitalisierung", "KI"],
      keywords: ["Transformation", "Effizienz"],
      key_messages: "Wir machen Ihr Unternehmen fit für die Zukunft",
    });

    expect(result).toContain("# Marketing & Content");
    expect(result).toContain("## Content-Ziele");
    expect(result).toContain("Reichweite erhöhen");
    expect(result).toContain("## Content-Formate");
    expect(result).toContain("- Blogartikel");
    expect(result).toContain("- Video");
    expect(result).toContain("## Relevante Themen");
    expect(result).toContain("- Digitalisierung");
    expect(result).toContain("## Keywords");
    expect(result).toContain("- Transformation");
    expect(result).toContain("## Zentrale Marketingbotschaften");
    expect(result).toContain("fit für die Zukunft");
  });

  it("partial data: nur Content-Ziele gesetzt", () => {
    const result = generateMarketingContentMarkdown({
      content_goals: "Leads generieren",
    });

    expect(result).toContain("# Marketing & Content");
    expect(result).toContain("## Content-Ziele");
    expect(result).not.toContain("## Content-Formate");
    expect(result).not.toContain("## Relevante Themen");
    expect(result).not.toContain("## Keywords");
    expect(result).not.toContain("## Zentrale Marketingbotschaften");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateMarketingContentMarkdown({});

    expect(result).toContain("# Marketing & Content");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateSalesMarkdown
// ---------------------------------------------------------------------------
describe("generateSalesMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateSalesMarkdown({
      selling_points: "Nachweisbare ROI-Steigerung",
      customer_benefits: "Bis zu 30 % Kosteneinsparung",
      references: "Beispielkunde AG, Mustermann GmbH",
    });

    expect(result).toContain("# Vertrieb");
    expect(result).toContain("## Wichtigste Verkaufsargumente");
    expect(result).toContain("Nachweisbare ROI-Steigerung");
    expect(result).toContain("## Konkreter Kundennutzen");
    expect(result).toContain("Bis zu 30 % Kosteneinsparung");
    expect(result).toContain("## Kunden und Referenzen");
    expect(result).toContain("Beispielkunde AG");
  });

  it("partial data: nur Verkaufsargumente gesetzt", () => {
    const result = generateSalesMarkdown({
      selling_points: "Schnelle Implementierung",
    });

    expect(result).toContain("# Vertrieb");
    expect(result).toContain("## Wichtigste Verkaufsargumente");
    expect(result).not.toContain("## Konkreter Kundennutzen");
    expect(result).not.toContain("## Kunden und Referenzen");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateSalesMarkdown({});

    expect(result).toContain("# Vertrieb");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateLegalComplianceMarkdown
// ---------------------------------------------------------------------------
describe("generateLegalComplianceMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateLegalComplianceMarkdown({
      legal_requirements: "DSGVO-Konformität erforderlich",
      forbidden_statements: "Keine absoluten Heilsversprechen",
      mandatory_disclosures: "Impressumspflicht beachten",
    });

    expect(result).toContain("# Recht & Compliance");
    expect(result).toContain("## Rechtliche Anforderungen");
    expect(result).toContain("DSGVO-Konformität");
    expect(result).toContain("## Verbotene Aussagen und Versprechen");
    expect(result).toContain("Keine absoluten Heilsversprechen");
    expect(result).toContain("## Pflichtangaben und rechtliche Hinweise");
    expect(result).toContain("Impressumspflicht");
  });

  it("partial data: nur rechtliche Anforderungen gesetzt", () => {
    const result = generateLegalComplianceMarkdown({
      legal_requirements: "ISO 27001 einhalten",
    });

    expect(result).toContain("# Recht & Compliance");
    expect(result).toContain("## Rechtliche Anforderungen");
    expect(result).not.toContain("## Verbotene Aussagen");
    expect(result).not.toContain("## Pflichtangaben");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateLegalComplianceMarkdown({});

    expect(result).toContain("# Recht & Compliance");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateExistingContentMarkdown
// ---------------------------------------------------------------------------
describe("generateExistingContentMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateExistingContentMarkdown({
      content_sources: ["Website", "Broschüren", "Case Studies"],
      best_practice_content: "Der Jahresbericht 2024 zeigt unser Profil ideal",
    });

    expect(result).toContain("# Bestehender Content");
    expect(result).toContain("## Wissensquellen");
    expect(result).toContain("- Website");
    expect(result).toContain("- Broschüren");
    expect(result).toContain("- Case Studies");
    expect(result).toContain("## Best-Practice-Inhalte");
    expect(result).toContain("Jahresbericht 2024");
  });

  it("partial data: nur Best-Practice-Inhalte gesetzt", () => {
    const result = generateExistingContentMarkdown({
      best_practice_content: "Unsere Produktvideos performen am besten",
    });

    expect(result).toContain("# Bestehender Content");
    expect(result).toContain("## Best-Practice-Inhalte");
    expect(result).not.toContain("## Wissensquellen");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateExistingContentMarkdown({});

    expect(result).toContain("# Bestehender Content");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateVisualGuidelinesMarkdown
// ---------------------------------------------------------------------------
describe("generateVisualGuidelinesMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateVisualGuidelinesMarkdown({
      visual_style: "Klare Linien, helle Farben",
      preferred_motifs: "Menschen bei der Arbeit",
      forbidden_styles: "Stockfoto-Klischees",
      forbidden_images: "Gewaltdarstellungen",
    });

    expect(result).toContain("# Bilder & Medien");
    expect(result).toContain("## Bildsprache");
    expect(result).toContain("Klare Linien");
    expect(result).toContain("## Bevorzugte Motive");
    expect(result).toContain("Menschen bei der Arbeit");
    expect(result).toContain("## Zu vermeidende visuelle Stile");
    expect(result).toContain("Stockfoto-Klischees");
    expect(result).toContain("## Verbotene Darstellungen");
    expect(result).toContain("Gewaltdarstellungen");
  });

  it("partial data: nur Bildsprache gesetzt", () => {
    const result = generateVisualGuidelinesMarkdown({
      visual_style: "Dunkel und kontrastreich",
    });

    expect(result).toContain("# Bilder & Medien");
    expect(result).toContain("## Bildsprache");
    expect(result).not.toContain("## Bevorzugte Motive");
    expect(result).not.toContain("## Zu vermeidende visuelle Stile");
    expect(result).not.toContain("## Verbotene Darstellungen");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateVisualGuidelinesMarkdown({});

    expect(result).toContain("# Bilder & Medien");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateAiRulesMarkdown
// ---------------------------------------------------------------------------
describe("generateAiRulesMarkdown", () => {
  it("happy path: alle Felder gefüllt", () => {
    const result = generateAiRulesMarkdown({
      always_consider: "Nachhaltigkeit ist Kernwert",
      authoritative_sources: "Interne Wissensdatenbank, ISO-Normen",
      conflict_handling: "Im Zweifel den Vertrieb fragen",
    });

    expect(result).toContain("# KI-Wissensbasis");
    expect(result).toContain("## Immer zu berücksichtigende Informationen");
    expect(result).toContain("Nachhaltigkeit ist Kernwert");
    expect(result).toContain("## Verbindliche Quellen");
    expect(result).toContain("Interne Wissensdatenbank");
    expect(result).toContain("## Umgang mit widersprüchlichen oder fehlenden Informationen");
    expect(result).toContain("Im Zweifel den Vertrieb fragen");
  });

  it("partial data: nur verbindliche Quellen gesetzt", () => {
    const result = generateAiRulesMarkdown({
      authoritative_sources: "Nur offizielle Pressemitteilungen",
    });

    expect(result).toContain("# KI-Wissensbasis");
    expect(result).toContain("## Verbindliche Quellen");
    expect(result).not.toContain("## Immer zu berücksichtigende");
    expect(result).not.toContain("## Umgang mit widersprüchlichen");
  });

  it("empty input: nur Hauptüberschrift, kein Absturz", () => {
    const result = generateAiRulesMarkdown({});

    expect(result).toContain("# KI-Wissensbasis");
    expect(result).not.toContain("## ");
  });
});

// ---------------------------------------------------------------------------
// generateMarkdownForSection (dispatch function)
// ---------------------------------------------------------------------------
describe("generateMarkdownForSection", () => {
  it("COMPANY: delegiert korrekt an generateCompanyMarkdown", () => {
    const result = generateMarkdownForSection("COMPANY", {
      company_name: "Dispatch GmbH",
      mission: "Alles richtig machen",
    });

    expect(result).toContain("# Unternehmen");
    expect(result).toContain("Dispatch GmbH");
    expect(result).toContain("Alles richtig machen");
  });

  it("COMPANY: normalisiert values-Komma-String via normalizeListFields", () => {
    const result = generateMarkdownForSection("COMPANY", {
      values: "Mut, Klarheit",
    });

    expect(result).toContain("- Mut");
    expect(result).toContain("- Klarheit");
  });

  it("PRODUCT_CATEGORIES: nutzt dynamicData.productCategories", () => {
    const result = generateMarkdownForSection(
      "PRODUCT_CATEGORIES",
      {},
      {
        productCategories: [
          { name: "ERP-System", features: ["Module A"], usps: ["Skalierbar"] },
        ],
      }
    );

    expect(result).toContain("# Produkt- und Dienstleistungskategorien");
    expect(result).toContain("ERP-System");
  });

  it("PRODUCT_CATEGORIES: leere dynamicData → Platzhaltertext", () => {
    const result = generateMarkdownForSection("PRODUCT_CATEGORIES", {});

    expect(result).toContain("Noch keine Kategorien erfasst");
  });

  it("TARGET_GROUPS: nutzt dynamicData.targetGroups", () => {
    const result = generateMarkdownForSection(
      "TARGET_GROUPS",
      {},
      {
        targetGroups: [
          {
            name: "HR-Manager",
            personas: [{ description: "Maria, 38, sucht Talente" }],
          },
        ],
      }
    );

    expect(result).toContain("# Zielgruppen");
    expect(result).toContain("HR-Manager");
  });

  it("TARGET_GROUPS: leere dynamicData → Platzhaltertext", () => {
    const result = generateMarkdownForSection("TARGET_GROUPS", {});

    expect(result).toContain("Noch keine Zielgruppen erfasst");
  });

  it("BRAND_LANGUAGE: delegiert korrekt", () => {
    const result = generateMarkdownForSection("BRAND_LANGUAGE", {
      communication_style: "Wertschätzend und klar",
    });

    expect(result).toContain("# Marke & Sprache");
    expect(result).toContain("Wertschätzend und klar");
  });

  it("MARKETING_CONTENT: normalisiert Array-Felder als Komma-String", () => {
    const result = generateMarkdownForSection("MARKETING_CONTENT", {
      content_formats: "Podcast, Whitepaper",
    });

    expect(result).toContain("# Marketing & Content");
    expect(result).toContain("- Podcast");
    expect(result).toContain("- Whitepaper");
  });

  it("SALES: delegiert korrekt", () => {
    const result = generateMarkdownForSection("SALES", {
      selling_points: "Bewährte Technologie",
    });

    expect(result).toContain("# Vertrieb");
    expect(result).toContain("Bewährte Technologie");
  });

  it("LEGAL_COMPLIANCE: delegiert korrekt", () => {
    const result = generateMarkdownForSection("LEGAL_COMPLIANCE", {
      legal_requirements: "GoBD-Konformität",
    });

    expect(result).toContain("# Recht & Compliance");
    expect(result).toContain("GoBD-Konformität");
  });

  it("EXISTING_CONTENT: normalisiert content_sources als Komma-String", () => {
    const result = generateMarkdownForSection("EXISTING_CONTENT", {
      content_sources: "FAQ, Blog, Newsletter",
    });

    expect(result).toContain("# Bestehender Content");
    expect(result).toContain("- FAQ");
    expect(result).toContain("- Blog");
    expect(result).toContain("- Newsletter");
  });

  it("VISUAL_GUIDELINES: delegiert korrekt", () => {
    const result = generateMarkdownForSection("VISUAL_GUIDELINES", {
      visual_style: "Pastelltöne, minimalistisch",
    });

    expect(result).toContain("# Bilder & Medien");
    expect(result).toContain("Pastelltöne, minimalistisch");
  });

  it("AI_RULES: delegiert korrekt", () => {
    const result = generateMarkdownForSection("AI_RULES", {
      always_consider: "Datenschutz hat oberste Priorität",
    });

    expect(result).toContain("# KI-Wissensbasis");
    expect(result).toContain("Datenschutz hat oberste Priorität");
  });

  it("unbekannter SectionType: gibt Fallback-Text zurück", () => {
    // @ts-expect-error intentionally passing unknown type
    const result = generateMarkdownForSection("UNKNOWN_SECTION", {});

    expect(result).toContain("UNKNOWN_SECTION");
    expect(result).toContain("Kein Inhalt verfügbar");
  });
});
