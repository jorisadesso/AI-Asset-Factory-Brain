export type SectionType =
  | "COMPANY"
  | "PRODUCT_CATEGORIES"
  | "TARGET_GROUPS"
  | "BRAND_LANGUAGE"
  | "MARKETING_CONTENT"
  | "SALES"
  | "LEGAL_COMPLIANCE"
  | "EXISTING_CONTENT"
  | "VISUAL_GUIDELINES"
  | "AI_RULES";

export type SectionStatus = "OPEN" | "IN_PROGRESS" | "PARTIAL" | "COMPLETE";

export interface SectionConfig {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  questions: QuestionConfig[];
  hasDynamicItems?: boolean;
  hasUpload?: boolean;
}

export interface QuestionConfig {
  key: string;
  label: string;
  placeholder?: string;
  examples?: string[];
  multiline?: boolean;
  required?: boolean;
  type?: "text" | "textarea" | "list";
}

export interface BrainSection {
  id: string;
  sectionType: SectionType;
  status: SectionStatus;
  completionScore: number;
  answers: Record<string, string>;
}

export interface Brain {
  id: string;
  name: string;
  completionScore: number;
  sections: BrainSection[];
  productCategories: ProductCategory[];
  targetGroups: TargetGroup[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  features: string[];
  usps: string[];
  sortOrder: number;
}

export interface TargetGroup {
  id: string;
  name: string;
  industry: string;
  description: string;
  personas: Persona[];
  sortOrder: number;
}

export interface Persona {
  id: string;
  description: string;
}

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  content: string;
  sectionType: SectionType;
  version: number;
  updatedAt: string;
}

export interface QualityFinding {
  severity: "error" | "warning" | "info";
  section: SectionType;
  title?: string;
  message: string;
  suggestion?: string;
}

export interface QualityCheckResult {
  score: number;
  findings: QualityFinding[];
  status: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";
}

export interface ExtractedInfo {
  sectionType: SectionType;
  data: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export interface UploadResult {
  success: boolean;
  extractedInfo?: ExtractedInfo;
  error?: string;
}

export const SECTION_CONFIGS: SectionConfig[] = [
  {
    type: "COMPANY",
    label: "Unternehmen",
    description: "Grundlegende Informationen über Ihr Unternehmen",
    icon: "Building2",
    questions: [
      {
        key: "company_name",
        label: "Wie heißt Ihr Unternehmen?",
        placeholder: "z.B. Muster GmbH",
        examples: ["Muster GmbH", "Example Digital Solutions AG"],
        required: true,
      },
      {
        key: "company_description",
        label: "Wie würden Sie Ihr Unternehmen in 2–5 Sätzen beschreiben?",
        placeholder: "Beschreiben Sie Ihr Unternehmen kurz...",
        examples: [
          "Wir entwickeln Softwarelösungen für mittelständische Unternehmen und unterstützen sie bei der Digitalisierung ihrer Marketingprozesse.",
          "Wir sind eine regionale Immobiliengesellschaft und entwickeln, verkaufen und vermieten hochwertige Wohnimmobilien.",
        ],
        multiline: true,
        required: true,
        type: "textarea",
      },
      {
        key: "mission",
        label: "Was ist die Mission Ihres Unternehmens?",
        placeholder: "Unsere Mission ist...",
        examples: [
          "Wir machen Marketing für Unternehmen einfacher und effizienter.",
          "Wir schaffen nachhaltigen Wohnraum für Menschen in urbanen Regionen.",
        ],
        multiline: true,
        type: "textarea",
      },
      {
        key: "vision",
        label: "Was ist die Vision Ihres Unternehmens?",
        placeholder: "Unsere Vision ist...",
        examples: [
          "Wir wollen die führende Plattform für automatisiertes B2B-Marketing werden.",
          "Wir möchten Städte lebenswerter machen, indem wir nachhaltige Wohnkonzepte entwickeln.",
        ],
        multiline: true,
        type: "textarea",
      },
      {
        key: "values",
        label: "Welche 3–5 Unternehmenswerte sind besonders wichtig?",
        placeholder: "z.B. Innovation, Transparenz, Kundennähe",
        examples: [
          "Innovation, Transparenz, Kundennähe, Nachhaltigkeit",
          "Qualität, Zuverlässigkeit, Verantwortung, Partnerschaft",
        ],
        type: "list",
      },
    ],
    hasUpload: true,
  },
  {
    type: "PRODUCT_CATEGORIES",
    label: "Produkt- und Dienstleistungskategorien",
    description: "Ihre Produkte und Dienstleistungen strukturiert erfassen",
    icon: "Package",
    questions: [],
    hasDynamicItems: true,
    hasUpload: true,
  },
  {
    type: "TARGET_GROUPS",
    label: "Zielgruppen",
    description: "Relevante Zielgruppen und Personas definieren",
    icon: "Users",
    questions: [],
    hasDynamicItems: true,
    hasUpload: true,
  },
  {
    type: "BRAND_LANGUAGE",
    label: "Marke & Sprache",
    description: "Tonalität, Sprache und Markenwerte festlegen",
    icon: "MessageSquare",
    questions: [
      {
        key: "brand_perception",
        label: "Wie soll Ihre Marke wahrgenommen werden?",
        placeholder: "z.B. Kompetent, innovativ und vertrauenswürdig.",
        examples: [
          "Kompetent, innovativ und vertrauenswürdig.",
          "Modern, sympathisch und unkompliziert.",
        ],
        type: "textarea",
      },
      {
        key: "communication_style",
        label: "Wie soll die KI sprachlich kommunizieren?",
        placeholder: "z.B. Sachlich, professionell und verständlich.",
        examples: [
          "Sachlich, professionell und verständlich.",
          "Locker, modern und direkt.",
        ],
        type: "textarea",
      },
      {
        key: "salutation",
        label: "Welche Anrede soll verwendet werden?",
        placeholder: "Du oder Sie?",
        examples: ["Sie", "Du"],
      },
      {
        key: "preferred_terms",
        label: "Welche Begriffe sollen bevorzugt verwendet werden?",
        placeholder: "z.B. 'Kunden' statt 'Konsumenten'",
        examples: [
          "'Kunden' statt 'Konsumenten', 'AI' statt 'KI'",
        ],
        type: "textarea",
      },
      {
        key: "forbidden_terms",
        label: "Welche Begriffe oder Formulierungen sollen vermieden werden?",
        placeholder: "z.B. revolutionär, weltweit führend",
        examples: [
          "'revolutionär', 'weltweit führend', aggressive Verkaufsformulierungen",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "MARKETING_CONTENT",
    label: "Marketing & Content",
    description: "Content-Strategie, Formate und Kernbotschaften",
    icon: "Megaphone",
    questions: [
      {
        key: "content_goals",
        label: "Welche Ziele soll Ihr Content erreichen?",
        placeholder: "z.B. Bekanntheit steigern und qualifizierte Leads generieren.",
        examples: [
          "Bekanntheit steigern und qualifizierte Leads generieren.",
          "Bestehende Kunden informieren.",
        ],
        type: "textarea",
      },
      {
        key: "content_formats",
        label: "Welche Content-Formate nutzen Sie?",
        placeholder: "z.B. Blogartikel, LinkedIn Posts, Newsletter",
        examples: [
          "Blogartikel, LinkedIn Posts, Newsletter",
          "Landingpages, Whitepaper, Anzeigen",
        ],
        type: "list",
      },
      {
        key: "relevant_topics",
        label: "Welche Themen sind besonders relevant?",
        placeholder: "z.B. Marketing Automation, AI und Digitalisierung",
        examples: [
          "Marketing Automation, AI und Digitalisierung",
          "Energieeffizienz und nachhaltiges Heizen",
        ],
        type: "list",
      },
      {
        key: "keywords",
        label: "Welche Keywords sind besonders wichtig?",
        placeholder: "z.B. Marketing Automation, Leadgenerierung, CRM",
        examples: [
          "Marketing Automation, Leadgenerierung, CRM",
        ],
        type: "list",
      },
      {
        key: "key_messages",
        label: "Welche zentralen Marketingbotschaften sollen vermittelt werden?",
        placeholder: "z.B. Wir machen komplexe Marketingprozesse einfach.",
        examples: [
          "Wir machen komplexe Marketingprozesse einfach.",
          "Unsere Lösungen helfen Unternehmen, effizienter zu arbeiten.",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "SALES",
    label: "Vertrieb",
    description: "Verkaufsargumente, Kundennutzen und Referenzen",
    icon: "TrendingUp",
    questions: [
      {
        key: "selling_points",
        label: "Was sind Ihre wichtigsten Verkaufsargumente?",
        placeholder: "z.B. Schnelle Implementierung und persönlicher Support.",
        examples: [
          "Schnelle Implementierung und persönlicher Support.",
          "Hohe Qualität und kurze Lieferzeiten.",
        ],
        type: "textarea",
      },
      {
        key: "customer_benefits",
        label: "Welche konkreten Kundennutzen sollen hervorgehoben werden?",
        placeholder: "z.B. Kunden sparen Zeit und reduzieren manuelle Arbeit.",
        examples: [
          "Kunden sparen Zeit und reduzieren manuelle Arbeit.",
          "Kunden senken ihre Energiekosten.",
        ],
        type: "textarea",
      },
      {
        key: "references",
        label: "Welche Kunden oder Referenzen dürfen genannt werden?",
        placeholder: "z.B. BMW, Siemens und Bosch dürfen genannt werden.",
        examples: [
          "BMW, Siemens und Bosch dürfen genannt werden.",
          "Kundennamen dürfen nur nach vorheriger Freigabe genannt werden.",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "LEGAL_COMPLIANCE",
    label: "Recht & Compliance",
    description: "Rechtliche Vorgaben und Compliance-Regeln",
    icon: "Shield",
    questions: [
      {
        key: "legal_requirements",
        label: "Welche rechtlichen oder regulatorischen Vorgaben muss die KI beachten?",
        placeholder: "z.B. Es dürfen keine Heilversprechen gemacht werden.",
        examples: [
          "Es dürfen keine Heilversprechen gemacht werden.",
          "Preisangaben müssen inklusive Mehrwertsteuer erfolgen.",
        ],
        type: "textarea",
      },
      {
        key: "forbidden_statements",
        label: "Welche Aussagen oder Versprechen dürfen niemals verwendet werden?",
        placeholder: "z.B. Keine 100-prozentige Wirksamkeit versprechen.",
        examples: [
          "Keine 100-prozentige Wirksamkeit versprechen.",
          "Keine garantierten Kosteneinsparungen behaupten.",
        ],
        type: "textarea",
      },
      {
        key: "mandatory_disclosures",
        label: "Welche Pflichtangaben oder rechtlichen Hinweise müssen berücksichtigt werden?",
        placeholder: "z.B. Bei bestimmten Produkten muss ein gesetzlicher Hinweis ergänzt werden.",
        examples: [
          "Bei bestimmten Produkten muss ein gesetzlicher Hinweis ergänzt werden.",
          "Bei Gewinnspielen müssen Teilnahmebedingungen berücksichtigt werden.",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "EXISTING_CONTENT",
    label: "Bestehender Content",
    description: "Vorhandene Inhalte als Wissensquelle nutzen",
    icon: "FileText",
    questions: [
      {
        key: "content_sources",
        label: "Welche bestehenden Inhalte sollen als Wissensquelle verwendet werden?",
        placeholder: "z.B. Website, Produktbroschüren, Präsentationen",
        examples: [
          "Website, Produktbroschüren, Präsentationen",
          "Whitepaper, Produktdatenblätter, Blogartikel",
        ],
        type: "list",
      },
      {
        key: "best_practice_content",
        label: "Welche Inhalte gelten als Best Practice?",
        placeholder: "z.B. Die Kampagne 'Digitalisierung 2025' entspricht unserer gewünschten Tonalität.",
        examples: [
          "Die Kampagne 'Digitalisierung 2025' entspricht unserer gewünschten Tonalität.",
          "Die Produktbroschüre fuer Produkt X ist unsere wichtigste sprachliche Referenz.",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "VISUAL_GUIDELINES",
    label: "Bilder & Medien",
    description: "Bildsprache, visuelle Stile und Medienrichtlinien",
    icon: "Image",
    questions: [
      {
        key: "visual_style",
        label: "Wie soll die Bildsprache aussehen?",
        placeholder: "z.B. Modern, authentisch und hochwertig.",
        examples: [
          "Modern, authentisch und hochwertig.",
          "Technisch, minimalistisch und klar.",
        ],
        type: "textarea",
      },
      {
        key: "preferred_motifs",
        label: "Welche Motive sollen bevorzugt verwendet werden?",
        placeholder: "z.B. Mitarbeitende in realistischen Arbeitssituationen.",
        examples: [
          "Mitarbeitende in realistischen Arbeitssituationen.",
          "Moderne Gebäude und nachhaltige Technologien.",
        ],
        type: "textarea",
      },
      {
        key: "forbidden_styles",
        label: "Welche visuellen Stile sollen vermieden werden?",
        placeholder: "z.B. Keine offensichtlich künstlichen Stock-Fotos.",
        examples: [
          "Keine offensichtlich künstlichen Stock-Fotos.",
          "Keine Comic- oder Cartoon-Darstellungen.",
        ],
        type: "textarea",
      },
      {
        key: "forbidden_images",
        label: "Welche Bilder oder Darstellungen dürfen nicht verwendet werden?",
        placeholder: "z.B. Keine Bilder von Kindern.",
        examples: [
          "Keine Bilder von Kindern.",
          "Keine Wettbewerberprodukte.",
        ],
        type: "textarea",
      },
    ],
    hasUpload: true,
  },
  {
    type: "AI_RULES",
    label: "KI-Wissensbasis",
    description: "Regeln und Priorisierungen für die KI-Verarbeitung",
    icon: "Brain",
    questions: [
      {
        key: "always_consider",
        label: "Welche Informationen muss die KI immer berücksichtigen?",
        placeholder: "z.B. Unsere Markenwerte, Zielgruppen und Corporate Language.",
        examples: [
          "Unsere Markenwerte, Zielgruppen und Corporate Language.",
          "Produktinformationen und rechtliche Vorgaben.",
        ],
        type: "textarea",
      },
      {
        key: "authoritative_sources",
        label: "Welche Quellen sind besonders verbindlich?",
        placeholder: "z.B. Aktuelle Produktdatenblätter haben Vorrang vor älteren Präsentationen.",
        examples: [
          "Aktuelle Produktdatenblätter haben Vorrang vor älteren Präsentationen.",
          "Die aktuelle Brand Guideline ist für Tonalität und Gestaltung maßgeblich.",
        ],
        type: "textarea",
      },
      {
        key: "conflict_handling",
        label: "Was soll die KI bei widersprüchlichen oder fehlenden Informationen tun?",
        placeholder: "z.B. Keine Informationen erfinden.",
        examples: [
          "Keine Informationen erfinden.",
          "Bei widersprüchlichen Informationen die aktuellste Quelle verwenden.",
          "Wenn keine eindeutige Information vorhanden ist, auf die Unsicherheit hinweisen.",
        ],
        type: "textarea",
      },
    ],
  },
];

export const SECTION_FILE_NAMES: Record<SectionType, string> = {
  COMPANY: "company.md",
  PRODUCT_CATEGORIES: "product-categories.md",
  TARGET_GROUPS: "target-groups.md",
  BRAND_LANGUAGE: "brand-and-language.md",
  MARKETING_CONTENT: "marketing-and-content.md",
  SALES: "sales.md",
  LEGAL_COMPLIANCE: "legal-and-compliance.md",
  EXISTING_CONTENT: "existing-content.md",
  VISUAL_GUIDELINES: "visual-guidelines.md",
  AI_RULES: "ai-rules.md",
};
