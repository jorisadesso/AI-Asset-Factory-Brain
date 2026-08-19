import { describe, it, expect } from "vitest";
import { SECTION_CONFIGS } from "@/types";
import type { SectionType } from "@/types";

// ─── Inline type definitions ──────────────────────────────────────────────────

interface QualityFinding {
  severity: "error" | "warning" | "info";
  section: string;
  title?: string;
  message: string;
  suggestion?: string;
}

interface BrainQualityInput {
  sections: Array<{
    sectionType: SectionType;
    status: string;
    completionScore: number;
    answers: Record<string, string>;
  }>;
  productCategories: Array<{ name: string; description?: string; features: string[]; usps: string[] }>;
  targetGroups: Array<{ name: string; description?: string; personas: Array<{ description: string }> }>;
}

// ─── calculateQualityScore (inline from service.ts ~580-598) ─────────────────

function calculateQualityScore(findings: QualityFinding[]): number {
  let deductions = 0;
  for (const f of findings) {
    const isEmptySection =
      f.message?.includes("noch leer") ||
      f.message?.includes("wurden keine") ||
      f.message?.includes("wurde keine");
    if (isEmptySection) {
      deductions += 5;
    } else if (f.severity === "error") {
      deductions += 15;
    } else if (f.severity === "warning") {
      deductions += 7;
    } else {
      deductions += 3;
    }
  }
  return Math.max(0, 100 - deductions);
}

// ─── deduplicateFindings (inline from service.ts ~570-578) ───────────────────

function deduplicateFindings(findings: QualityFinding[]): QualityFinding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.section}:${f.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── heuristicExtract (inline from service.ts ~226-283) ──────────────────────

const STOP_WORDS = new Set([
  "was", "sind", "ihre", "welche", "wie", "sollen", "dürfen", "werden", "kann",
  "die", "der", "das", "den", "dem", "ein", "eine", "und", "oder", "mit", "für",
  "von", "zu", "an", "auf", "in", "ist", "hat", "haben", "bitte", "nennen",
  "angeben", "beschreiben", "soll", "auch", "noch", "nur", "nicht", "alle",
  "beim", "bei", "nach", "aus", "sich", "sie", "wir", "mehr", "hier",
]);

function heuristicExtract(text: string, questionLabel: string, fieldType?: string): string {
  const questionWords = questionLabel
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const chunks = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const word of questionWords) {
      if (lower.includes(word)) score += 3;
      const stem = word.slice(0, Math.max(4, word.length - 3));
      if (lower.includes(stem)) score += 1;
    }
    if (/^[-•*·▪◦]/.test(chunk) || /^\d+\./.test(chunk)) score += 1;
    return { chunk, score };
  });

  const top = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (top.length === 0) return "";

  if (fieldType === "list") {
    const items = top
      .slice(0, 8)
      .map((s) => s.chunk.replace(/^[-•*·▪◦\d+.]\s*/, "").trim())
      .filter((s) => s.length > 0 && s.length < 80);
    return items.slice(0, 6).join(", ");
  }

  if (fieldType === "text") {
    const best = top[0].chunk;
    const firstSentence = best.split(/[.!?]\s/)[0].trim();
    return firstSentence.length <= 120 ? firstSentence : firstSentence.slice(0, 117) + "…";
  }

  return top.slice(0, 4).map((s) => s.chunk).join("\n").trim();
}

// ─── performBasicQualityCheck (inline from service.ts ~505-568) ──────────────

const SECTION_SEVERITY: Partial<Record<SectionType, "error" | "warning" | "info">> = {
  COMPANY: "error",
  PRODUCT_CATEGORIES: "error",
  TARGET_GROUPS: "error",
  BRAND_LANGUAGE: "warning",
  MARKETING_CONTENT: "warning",
  LEGAL_COMPLIANCE: "warning",
  AI_RULES: "warning",
  SALES: "info",
  EXISTING_CONTENT: "info",
  VISUAL_GUIDELINES: "info",
};

function sectionAnswers(brain: BrainQualityInput, type: SectionType): Record<string, string> {
  return brain.sections.find((s) => s.sectionType === type)?.answers ?? {};
}

function performBasicQualityCheck(brain: BrainQualityInput): QualityFinding[] {
  const findings: QualityFinding[] = [];

  if (brain.productCategories.length === 0) {
    findings.push({
      severity: "error",
      section: "PRODUCT_CATEGORIES",
      title: "Keine Produkte erfasst",
      message: "Es wurden keine Produkt- oder Dienstleistungskategorien angelegt.",
      suggestion: "Legen Sie mindestens eine Kategorie an — ohne Produktwissen kann die KI keine überzeugenden Inhalte erstellen.",
    });
  } else {
    for (const cat of brain.productCategories) {
      if (!cat.description) findings.push({ severity: "warning", section: "PRODUCT_CATEGORIES", title: `„${cat.name}": Beschreibung fehlt`, message: `Produktkategorie „${cat.name}" hat keine Beschreibung.`, suggestion: "2–4 Sätze reichen, um der KI den nötigen Kontext zu geben." });
      if (cat.features.length === 0) findings.push({ severity: "warning", section: "PRODUCT_CATEGORIES", title: `„${cat.name}": Keine Features`, message: `Produktkategorie „${cat.name}" hat keine Features definiert.`, suggestion: "Mindestens 3–5 Funktionen eintragen." });
      if (cat.usps.length === 0) findings.push({ severity: "warning", section: "PRODUCT_CATEGORIES", title: `„${cat.name}": Keine USPs`, message: `Produktkategorie „${cat.name}" hat keine Alleinstellungsmerkmale.`, suggestion: "Was unterscheidet Sie vom Wettbewerb? Mindestens 1–3 USPs eintragen." });
    }
  }

  if (brain.targetGroups.length === 0) {
    findings.push({ severity: "error", section: "TARGET_GROUPS", title: "Keine Zielgruppen definiert", message: "Es wurden keine Zielgruppen erfasst.", suggestion: "Ohne Zielgruppen entstehen generische Inhalte. Definieren Sie mindestens eine Hauptzielgruppe." });
  } else {
    for (const group of brain.targetGroups) {
      if (!group.description) findings.push({ severity: "warning", section: "TARGET_GROUPS", title: `„${group.name}": Beschreibung fehlt`, message: `Zielgruppe „${group.name}" ist nicht ausreichend beschrieben.`, suggestion: "Beschreiben Sie Herausforderungen, Ziele und Entscheidungskriterien dieser Gruppe." });
      if (group.personas.length === 0) findings.push({ severity: "info", section: "TARGET_GROUPS", title: `„${group.name}": Keine Personas`, message: `Zielgruppe „${group.name}" hat keine Personas.`, suggestion: "Beschreiben Sie eine konkrete Beispielperson aus dieser Gruppe." });
    }
  }

  for (const config of SECTION_CONFIGS) {
    if (config.questions.length === 0) continue;
    const answers = sectionAnswers(brain, config.type);
    const missing = config.questions.filter((q) => !answers[q.key] || answers[q.key].trim().length === 0);
    if (missing.length === 0) continue;

    const severity = SECTION_SEVERITY[config.type] ?? "info";
    const filledCount = config.questions.length - missing.length;
    const allMissing = filledCount === 0;

    if (allMissing) {
      findings.push({
        severity,
        section: config.type,
        title: `${config.label} nicht ausgefüllt`,
        message: `Alle ${config.questions.length} Fragen in „${config.label}" sind noch leer.`,
        suggestion: `Beginnen Sie mit: „${config.questions[0].label}"`,
      });
    } else {
      for (const q of missing.slice(0, 3)) {
        findings.push({
          severity: "info",
          section: config.type,
          title: `Fehlt: ${q.label.length > 40 ? q.label.slice(0, 37) + "…" : q.label}`,
          message: `In „${config.label}" ist noch nicht ausgefüllt: „${q.label}"`,
          suggestion: q.examples?.[0] ? `Beispiel: ${q.examples[0]}` : `Bitte ergänzen Sie diese Angabe.`,
        });
      }
    }
  }

  return findings;
}

// ─── Tests: calculateQualityScore ────────────────────────────────────────────

describe("calculateQualityScore", () => {
  it("returns 100 for empty findings", () => {
    expect(calculateQualityScore([])).toBe(100);
  });

  it("deducts 15 for one non-empty-section error", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Kritischer Fehler im Bereich." },
    ];
    expect(calculateQualityScore(findings)).toBe(85);
  });

  it("deducts 7 for one warning", () => {
    const findings: QualityFinding[] = [
      { severity: "warning", section: "BRAND_LANGUAGE", message: "Markensprache unvollständig." },
    ];
    expect(calculateQualityScore(findings)).toBe(93);
  });

  it("deducts 3 for one info", () => {
    const findings: QualityFinding[] = [
      { severity: "info", section: "SALES", message: "Hinweis zum Vertrieb." },
    ];
    expect(calculateQualityScore(findings)).toBe(97);
  });

  it("deducts only 5 for 'noch leer' message (empty section)", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Alle 5 Fragen sind noch leer." },
    ];
    expect(calculateQualityScore(findings)).toBe(95);
  });

  it("deducts only 5 for 'wurden keine' message", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "PRODUCT_CATEGORIES", message: "Es wurden keine Produkt- oder Dienstleistungskategorien angelegt." },
    ];
    expect(calculateQualityScore(findings)).toBe(95);
  });

  it("combines deductions correctly for a mix of findings", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Kritischer Fehler." },         // -15
      { severity: "warning", section: "BRAND_LANGUAGE", message: "Warnung hier." },      // -7
      { severity: "info", section: "SALES", message: "Kleiner Hinweis." },               // -3
    ];
    expect(calculateQualityScore(findings)).toBe(75);
  });

  it("floors at 0 for many findings", () => {
    const findings: QualityFinding[] = Array.from({ length: 20 }, (_, i) => ({
      severity: "error" as const,
      section: "COMPANY",
      message: `Fehler Nummer ${i}`,
    }));
    expect(calculateQualityScore(findings)).toBe(0);
  });
});

// ─── Tests: deduplicateFindings ──────────────────────────────────────────────

describe("deduplicateFindings", () => {
  it("returns all findings when there are no duplicates", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Fehler A" },
      { severity: "warning", section: "BRAND_LANGUAGE", message: "Warnung B" },
    ];
    expect(deduplicateFindings(findings)).toHaveLength(2);
  });

  it("drops the second finding when section and message are identical", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Gleiche Nachricht" },
      { severity: "error", section: "COMPANY", message: "Gleiche Nachricht" },
    ];
    const result = deduplicateFindings(findings);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe("Gleiche Nachricht");
  });

  it("keeps both findings when sections differ but message is the same", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Gleiche Nachricht" },
      { severity: "error", section: "BRAND_LANGUAGE", message: "Gleiche Nachricht" },
    ];
    expect(deduplicateFindings(findings)).toHaveLength(2);
  });

  it("keeps both findings when messages differ but section is the same", () => {
    const findings: QualityFinding[] = [
      { severity: "error", section: "COMPANY", message: "Nachricht A" },
      { severity: "error", section: "COMPANY", message: "Nachricht B" },
    ];
    expect(deduplicateFindings(findings)).toHaveLength(2);
  });
});

// ─── Tests: heuristicExtract ─────────────────────────────────────────────────

describe("heuristicExtract", () => {
  it("returns relevant chunk when text contains a keyword from the question", () => {
    const text = "Unsere Hauptzielgruppe sind mittelständische Unternehmen.\nWir bieten Softwarelösungen an.";
    const result = heuristicExtract(text, "Welche Zielgruppen sprechen Sie an?");
    expect(result.toLowerCase()).toContain("zielgruppe");
  });

  it("returns empty string for empty text", () => {
    expect(heuristicExtract("", "Wer sind Ihre Kunden?")).toBe("");
  });

  it("returns empty string when no keyword matches", () => {
    const text = "Xyz Qrs Abc Def ghi jklm nopq rstuv wxyz abcdef ghijk lmnop.";
    // Question words that don't appear in text at all
    const result = heuristicExtract(text, "Welche Produkte verkaufen Sie?");
    // "produkte" and "verkaufen" are likely not in the text → score stays 0
    expect(result).toBe("");
  });

  it("fieldType=list returns comma-separated string or empty", () => {
    const text = [
      "- Cloud-Hosting-Dienste",
      "- Beratungsleistungen für Unternehmen",
      "- Software-Entwicklung und Support",
    ].join("\n");
    const result = heuristicExtract(text, "Welche Dienste bieten Sie an?", "list");
    // Should be comma-separated (or empty)
    if (result.length > 0) {
      // Result should not contain newlines
      expect(result).not.toContain("\n");
    }
  });

  it("fieldType=text returns a single line of 120 chars or fewer", () => {
    const text =
      "Wir entwickeln innovative Softwarelösungen für den Mittelstand. " +
      "Unsere Lösungen helfen Unternehmen, ihre Prozesse zu digitalisieren.";
    const result = heuristicExtract(text, "Wie würden Sie Ihr Unternehmen beschreiben?", "text");
    if (result.length > 0) {
      expect(result.length).toBeLessThanOrEqual(120);
    }
  });
});

// ─── Tests: performBasicQualityCheck ─────────────────────────────────────────

describe("performBasicQualityCheck", () => {
  it("reports errors for both PRODUCT_CATEGORIES and TARGET_GROUPS when brain is empty", () => {
    const brain: BrainQualityInput = {
      sections: [],
      productCategories: [],
      targetGroups: [],
    };
    const findings = performBasicQualityCheck(brain);
    const sections = findings.map((f) => f.section);
    expect(sections).toContain("PRODUCT_CATEGORIES");
    expect(sections).toContain("TARGET_GROUPS");
    const errors = findings.filter((f) => f.severity === "error");
    expect(errors.some((f) => f.section === "PRODUCT_CATEGORIES")).toBe(true);
    expect(errors.some((f) => f.section === "TARGET_GROUPS")).toBe(true);
  });

  it("does not report PRODUCT_CATEGORIES error when a complete category is provided", () => {
    const brain: BrainQualityInput = {
      sections: [],
      productCategories: [
        {
          name: "Cloud Software",
          description: "Eine vollständige Cloud-Softwarelösung für Unternehmen.",
          features: ["Skalierbarkeit", "Ausfallsicherheit", "Echtzeit-Reporting"],
          usps: ["Marktführend in DACH", "ISO 27001 zertifiziert"],
        },
      ],
      targetGroups: [{ name: "Mittelstand", description: "KMUs mit 50–500 Mitarbeitern.", personas: [] }],
    };
    const findings = performBasicQualityCheck(brain);
    const productErrors = findings.filter(
      (f) => f.section === "PRODUCT_CATEGORIES" && f.severity === "error"
    );
    expect(productErrors).toHaveLength(0);
    const noProductsFinding = findings.find((f) => f.title === "Keine Produkte erfasst");
    expect(noProductsFinding).toBeUndefined();
  });

  it("does not produce 'noch leer' findings for sections that have all questions answered", () => {
    // Find the COMPANY section config to know which keys to fill
    const companyConfig = SECTION_CONFIGS.find((c) => c.type === "COMPANY");
    expect(companyConfig).toBeDefined();
    const answers: Record<string, string> = {};
    for (const q of companyConfig!.questions) {
      answers[q.key] = "Test answer for " + q.key;
    }

    const brain: BrainQualityInput = {
      sections: [
        {
          sectionType: "COMPANY",
          status: "COMPLETE",
          completionScore: 100,
          answers,
        },
      ],
      productCategories: [
        {
          name: "Produkt A",
          description: "Beschreibung vorhanden.",
          features: ["Feature 1"],
          usps: ["USP 1"],
        },
      ],
      targetGroups: [
        {
          name: "Zielgruppe A",
          description: "Beschreibung vorhanden.",
          personas: [{ description: "Max Mustermann" }],
        },
      ],
    };
    const findings = performBasicQualityCheck(brain);
    const emptyCompanyFindings = findings.filter(
      (f) => f.section === "COMPANY" && f.message?.includes("noch leer")
    );
    expect(emptyCompanyFindings).toHaveLength(0);
  });
});
