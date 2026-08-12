import OpenAI from "openai";
import type { SectionType, ExtractedInfo, QualityFinding } from "@/types";

function createClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    return null;
  }

  const config: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (process.env.OPENAI_BASE_URL) {
    config.baseURL = process.env.OPENAI_BASE_URL;
  }
  return new OpenAI(config);
}

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const SECTION_SCHEMAS: Record<SectionType, object> = {
  COMPANY: {
    type: "object",
    properties: {
      company_name: { type: "string" },
      company_description: { type: "string" },
      mission: { type: "string" },
      vision: { type: "string" },
      values: { type: "array", items: { type: "string" } },
    },
  },
  PRODUCT_CATEGORIES: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            usps: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  TARGET_GROUPS: {
    type: "object",
    properties: {
      groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            industry: { type: "string" },
            description: { type: "string" },
            personas: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  BRAND_LANGUAGE: {
    type: "object",
    properties: {
      brand_perception: { type: "string" },
      communication_style: { type: "string" },
      salutation: { type: "string" },
      preferred_terms: { type: "string" },
      forbidden_terms: { type: "string" },
    },
  },
  MARKETING_CONTENT: {
    type: "object",
    properties: {
      content_goals: { type: "string" },
      content_formats: { type: "array", items: { type: "string" } },
      relevant_topics: { type: "array", items: { type: "string" } },
      keywords: { type: "array", items: { type: "string" } },
      key_messages: { type: "string" },
    },
  },
  SALES: {
    type: "object",
    properties: {
      selling_points: { type: "string" },
      customer_benefits: { type: "string" },
      references: { type: "string" },
    },
  },
  LEGAL_COMPLIANCE: {
    type: "object",
    properties: {
      legal_requirements: { type: "string" },
      forbidden_statements: { type: "string" },
      mandatory_disclosures: { type: "string" },
    },
  },
  EXISTING_CONTENT: {
    type: "object",
    properties: {
      content_sources: { type: "array", items: { type: "string" } },
      best_practice_content: { type: "string" },
    },
  },
  VISUAL_GUIDELINES: {
    type: "object",
    properties: {
      visual_style: { type: "string" },
      preferred_motifs: { type: "string" },
      forbidden_styles: { type: "string" },
      forbidden_images: { type: "string" },
    },
  },
  AI_RULES: {
    type: "object",
    properties: {
      always_consider: { type: "string" },
      authoritative_sources: { type: "string" },
      conflict_handling: { type: "string" },
    },
  },
};

const SECTION_LABELS: Record<SectionType, string> = {
  COMPANY: "Unternehmen",
  PRODUCT_CATEGORIES: "Produkt- und Dienstleistungskategorien",
  TARGET_GROUPS: "Zielgruppen",
  BRAND_LANGUAGE: "Marke & Sprache",
  MARKETING_CONTENT: "Marketing & Content",
  SALES: "Vertrieb",
  LEGAL_COMPLIANCE: "Recht & Compliance",
  EXISTING_CONTENT: "Bestehender Content",
  VISUAL_GUIDELINES: "Bilder & Medien",
  AI_RULES: "KI-Wissensbasis",
};

export async function extractKnowledgeFromText(
  text: string,
  sectionType: SectionType
): Promise<ExtractedInfo> {
  const client = createClient();

  if (!client) {
    return {
      sectionType,
      data: {},
      confidence: "low",
      warnings: [
        "Kein API-Key konfiguriert. Manuelle Eingabe erforderlich.",
      ],
    };
  }

  const schema = SECTION_SCHEMAS[sectionType];
  const sectionLabel = SECTION_LABELS[sectionType];

  const systemPrompt = `Du bist ein spezialisierter Informationsextraktor für den Bereich "${sectionLabel}".
Extrahiere ausschließlich Informationen, die im Dokument explizit vorhanden sind.
Erfinde KEINE Informationen. Wenn Informationen fehlen oder unklar sind, lass die entsprechenden Felder leer.
Gib nur JSON zurück, das dem vorgegebenen Schema entspricht.`;

  const userPrompt = `Analysiere den folgenden Text und extrahiere strukturierte Informationen für den Bereich "${sectionLabel}".

Schema: ${JSON.stringify(schema, null, 2)}

Text:
---
${text.slice(0, 8000)}
---

Wichtig: Erfinde keine Informationen. Lass Felder leer, wenn die Information nicht eindeutig im Text vorhanden ist.`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Leere Antwort von der KI");

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const warnings: string[] = [];

    // Check for empty fields and warn
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        warnings.push(`Feld "${key}" konnte nicht extrahiert werden.`);
      }
    }

    return {
      sectionType,
      data: parsed,
      confidence: warnings.length === 0 ? "high" : warnings.length < 3 ? "medium" : "low",
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      sectionType,
      data: {},
      confidence: "low",
      warnings: [`Extraktion fehlgeschlagen: ${message}`],
    };
  }
}

export interface BrainQualityInput {
  sections: Array<{
    sectionType: SectionType;
    status: string;
    completionScore: number;
    answers: Record<string, string>;
  }>;
  productCategories: Array<{ name: string; description?: string; features: string[]; usps: string[] }>;
  targetGroups: Array<{ name: string; description?: string; personas: Array<{ description: string }> }>;
}

export async function runQualityCheck(
  brain: BrainQualityInput
): Promise<{ findings: QualityFinding[]; score: number }> {
  const client = createClient();

  const basicFindings = performBasicQualityCheck(brain);

  if (!client) {
    return {
      findings: basicFindings,
      score: calculateQualityScore(basicFindings),
    };
  }

  try {
    const prompt = `Du bist ein KI-Qualitätsanalyst für Unternehmens-Wissensdatenbanken.
Analysiere die folgenden Daten und identifiziere konkrete Qualitätsprobleme.

Daten:
${JSON.stringify(brain, null, 2)}

Prüfpunkte:
1. Widersprüche zwischen Sektionen (z.B. Zielgruppen passen nicht zu Produkten)
2. Inhaltliche Lücken, die die KI-Ausgabequalität beeinträchtigen
3. Zu generische oder nichtssagende Formulierungen
4. Fehlende Konsistenz (z.B. Tonalität in Brand vs. AI-Regeln)
5. Rechtliche Risiken durch fehlende Compliance-Angaben

Antworte mit JSON in diesem Format:
{
  "findings": [
    {
      "severity": "error" | "warning" | "info",
      "section": "COMPANY" | "PRODUCT_CATEGORIES" | "TARGET_GROUPS" | "BRAND_LANGUAGE" | "MARKETING_CONTENT" | "SALES" | "LEGAL_COMPLIANCE" | "EXISTING_CONTENT" | "VISUAL_GUIDELINES" | "AI_RULES",
      "title": "Kurzer Titel des Problems (max 6 Wörter)",
      "message": "Konkrete Beschreibung des Problems",
      "suggestion": "Spezifischer, umsetzbarer Verbesserungsvorschlag"
    }
  ]
}

Maximal 8 Findings. Nur echte, inhaltliche Probleme — keine Wiederholung von offensichtlich fehlenden Feldern, die schon durch den Fortschrittsbalken erkennbar sind.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Leere Antwort");

    const parsed = JSON.parse(content) as { findings: QualityFinding[] };
    const allFindings = [...basicFindings, ...(parsed.findings ?? [])];

    return {
      findings: deduplicateFindings(allFindings),
      score: calculateQualityScore(allFindings),
    };
  } catch {
    return {
      findings: basicFindings,
      score: calculateQualityScore(basicFindings),
    };
  }
}

function sectionScore(brain: BrainQualityInput, type: SectionType): number {
  return brain.sections.find((s) => s.sectionType === type)?.completionScore ?? 0;
}

function sectionAnswers(brain: BrainQualityInput, type: SectionType): Record<string, string> {
  return brain.sections.find((s) => s.sectionType === type)?.answers ?? {};
}

function performBasicQualityCheck(brain: BrainQualityInput): QualityFinding[] {
  const findings: QualityFinding[] = [];

  // COMPANY
  const companyScore = sectionScore(brain, "COMPANY");
  const companyAnswers = sectionAnswers(brain, "COMPANY");
  if (companyScore < 0.3) {
    findings.push({
      severity: "error",
      section: "COMPANY",
      title: "Unternehmensprofil fehlt",
      message: "Grundlegende Unternehmensinformationen sind nicht ausgefüllt.",
      suggestion: "Füllen Sie mindestens Name, Beschreibung und Mission aus — das ist die Grundlage für alle KI-generierten Inhalte.",
    });
  } else if (companyScore < 0.7) {
    if (!companyAnswers["mission"]) {
      findings.push({
        severity: "warning",
        section: "COMPANY",
        title: "Mission fehlt",
        message: "Die Mission Ihres Unternehmens ist nicht definiert.",
        suggestion: "Eine klare Mission hilft der KI, konsistente Botschaften zu formulieren.",
      });
    }
    if (!companyAnswers["vision"]) {
      findings.push({
        severity: "info",
        section: "COMPANY",
        title: "Vision fehlt",
        message: "Die Vision des Unternehmens ist noch nicht eingetragen.",
        suggestion: "Ergänzen Sie die langfristige Vision, um zukunftsorientierte Inhalte zu ermöglichen.",
      });
    }
  }

  // PRODUCT_CATEGORIES
  if (brain.productCategories.length === 0) {
    findings.push({
      severity: "error",
      section: "PRODUCT_CATEGORIES",
      title: "Keine Produkte erfasst",
      message: "Es wurden keine Produkt- oder Dienstleistungskategorien angelegt.",
      suggestion: "Legen Sie mindestens eine Kategorie an — ohne Produktwissen kann die KI keine überzeugenden Inhalte erstellen.",
    });
  } else {
    brain.productCategories.forEach((cat) => {
      if (!cat.description) {
        findings.push({
          severity: "warning",
          section: "PRODUCT_CATEGORIES",
          title: `„${cat.name}": Beschreibung fehlt`,
          message: `Produktkategorie „${cat.name}" hat keine Beschreibung.`,
          suggestion: "Eine Beschreibung in 2–4 Sätzen genügt, um der KI den Kontext zu geben.",
        });
      }
      if (cat.features.length === 0) {
        findings.push({
          severity: "warning",
          section: "PRODUCT_CATEGORIES",
          title: `„${cat.name}": Keine Features`,
          message: `Produktkategorie „${cat.name}" hat keine Features definiert.`,
          suggestion: "Listen Sie die wichtigsten Funktionen auf — mindestens 3–5 Punkte.",
        });
      }
      if (cat.usps.length === 0) {
        findings.push({
          severity: "warning",
          section: "PRODUCT_CATEGORIES",
          title: `„${cat.name}": Keine USPs`,
          message: `Produktkategorie „${cat.name}" hat keine Alleinstellungsmerkmale definiert.`,
          suggestion: "USPs sind entscheidend für überzeugende Marketing-Texte. Was unterscheidet Sie vom Wettbewerb?",
        });
      }
    });
  }

  // TARGET_GROUPS
  if (brain.targetGroups.length === 0) {
    findings.push({
      severity: "error",
      section: "TARGET_GROUPS",
      title: "Keine Zielgruppen definiert",
      message: "Es wurden keine Zielgruppen erfasst.",
      suggestion: "Ohne Zielgruppen entstehen generische Inhalte. Definieren Sie mindestens eine Hauptzielgruppe.",
    });
  } else {
    brain.targetGroups.forEach((group) => {
      if (!group.description) {
        findings.push({
          severity: "warning",
          section: "TARGET_GROUPS",
          title: `„${group.name}": Beschreibung fehlt`,
          message: `Zielgruppe „${group.name}" ist nicht ausreichend beschrieben.`,
          suggestion: "Beschreiben Sie typische Herausforderungen, Ziele und Entscheidungskriterien dieser Gruppe.",
        });
      }
      if (group.personas.length === 0) {
        findings.push({
          severity: "info",
          section: "TARGET_GROUPS",
          title: `„${group.name}": Keine Personas`,
          message: `Zielgruppe „${group.name}" hat keine Personas.`,
          suggestion: "Personas helfen der KI, den richtigen Ton zu treffen. Beschreiben Sie eine konkrete Person aus dieser Gruppe.",
        });
      }
    });
  }

  // BRAND_LANGUAGE
  const brandScore = sectionScore(brain, "BRAND_LANGUAGE");
  if (brandScore < 0.3) {
    findings.push({
      severity: "warning",
      section: "BRAND_LANGUAGE",
      title: "Markensprache nicht definiert",
      message: "Kommunikationsstil und Markensprache sind nicht erfasst.",
      suggestion: "Legen Sie Tonalität, Anrede und Stilregeln fest — sonst wählt die KI einen generischen Stil.",
    });
  } else if (brandScore < 0.7) {
    const brandAnswers = sectionAnswers(brain, "BRAND_LANGUAGE");
    if (!brandAnswers["forbidden_terms"]) {
      findings.push({
        severity: "info",
        section: "BRAND_LANGUAGE",
        title: "Verbotene Begriffe fehlen",
        message: "Es wurden keine Taboo-Begriffe oder Formulierungen definiert.",
        suggestion: "Geben Sie an, welche Begriffe die KI vermeiden soll (z.B. Wettbewerbernamen, veraltete Produktbezeichnungen).",
      });
    }
  }

  // MARKETING_CONTENT
  const marketingScore = sectionScore(brain, "MARKETING_CONTENT");
  if (marketingScore < 0.3) {
    findings.push({
      severity: "warning",
      section: "MARKETING_CONTENT",
      title: "Content-Strategie fehlt",
      message: "Marketing- und Content-Ziele sind nicht erfasst.",
      suggestion: "Definieren Sie Content-Ziele und bevorzugte Formate, damit die KI passende Inhalte vorschlagen kann.",
    });
  }

  // SALES
  const salesScore = sectionScore(brain, "SALES");
  if (salesScore < 0.3) {
    findings.push({
      severity: "info",
      section: "SALES",
      title: "Vertriebsinformationen fehlen",
      message: "Verkaufsargumente und Kundennutzen sind nicht erfasst.",
      suggestion: "Ergänzen Sie Vertriebsargumente und konkrete Kundenreferenzen für überzeugendere Sales-Inhalte.",
    });
  }

  // LEGAL_COMPLIANCE
  const legalScore = sectionScore(brain, "LEGAL_COMPLIANCE");
  if (legalScore < 0.3) {
    findings.push({
      severity: "warning",
      section: "LEGAL_COMPLIANCE",
      title: "Rechtliche Vorgaben fehlen",
      message: "Rechtliche Einschränkungen und Pflichtangaben sind nicht definiert.",
      suggestion: "Tragen Sie verbotene Aussagen und Pflichthinweise ein, damit die KI keine rechtlich problematischen Formulierungen verwendet.",
    });
  }

  // EXISTING_CONTENT
  const contentScore = sectionScore(brain, "EXISTING_CONTENT");
  if (contentScore < 0.2) {
    findings.push({
      severity: "info",
      section: "EXISTING_CONTENT",
      title: "Kein Referenz-Content hinterlegt",
      message: "Bestehende Inhalte als Stilvorlage fehlen.",
      suggestion: "Laden Sie Beispiele Ihrer besten Inhalte hoch — die KI lernt daraus Ihren bevorzugten Stil.",
    });
  }

  // VISUAL_GUIDELINES
  const visualScore = sectionScore(brain, "VISUAL_GUIDELINES");
  if (visualScore < 0.2) {
    findings.push({
      severity: "info",
      section: "VISUAL_GUIDELINES",
      title: "Visuelle Richtlinien fehlen",
      message: "Bildsprache und visuelle Guidelines sind nicht erfasst.",
      suggestion: "Beschreiben Sie Ihren Bildstil und verbotene Bildmotive für konsistente visuelle Kommunikation.",
    });
  }

  // AI_RULES
  const aiRulesScore = sectionScore(brain, "AI_RULES");
  if (aiRulesScore < 0.3) {
    findings.push({
      severity: "warning",
      section: "AI_RULES",
      title: "KI-Regeln fehlen",
      message: "Verarbeitungsregeln für die KI wurden noch nicht definiert.",
      suggestion: "Legen Sie fest, was die KI immer beachten soll (z.B. Quellenangaben, Tonalität, Off-limit-Themen).",
    });
  }

  return findings;
}

function deduplicateFindings(findings: QualityFinding[]): QualityFinding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.section}:${f.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateQualityScore(findings: QualityFinding[]): number {
  let deductions = 0;
  for (const f of findings) {
    if (f.severity === "error") deductions += 20;
    else if (f.severity === "warning") deductions += 10;
    else deductions += 5;
  }
  return Math.max(0, 100 - deductions);
}
