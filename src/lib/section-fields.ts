import { SectionKey } from "@/types";

interface FieldConfig {
  key: string;
  label: string;
  description?: string;
  type: "text" | "tags";
  placeholder: string;
  examples: string[];
  rows?: number;
}

export const SECTION_FIELDS: Partial<Record<SectionKey, FieldConfig[]>> = {
  "brand-language": [
    {
      key: "brandPerception",
      label: "Markenwahrnehmung",
      description: "Wie soll Ihre Marke wahrgenommen werden?",
      type: "text",
      placeholder: "z. B. Kompetent, innovativ und vertrauenswürdig.",
      examples: ["Kompetent, innovativ und vertrauenswürdig.", "Modern, sympathisch und unkompliziert."],
      rows: 3,
    },
    {
      key: "communicationStyle",
      label: "Kommunikationsstil",
      description: "Wie soll die KI sprachlich kommunizieren?",
      type: "text",
      placeholder: "z. B. Sachlich, professionell und verständlich.",
      examples: ["Sachlich, professionell und verständlich.", "Locker, modern und direkt."],
      rows: 3,
    },
    {
      key: "salutation",
      label: "Anrede",
      description: "Welche Anrede soll verwendet werden?",
      type: "text",
      placeholder: "Du oder Sie",
      examples: ["Du", "Sie"],
      rows: 1,
    },
    {
      key: "preferredTerms",
      label: "Bevorzugte Begriffe",
      description: "Welche Begriffe sollen bevorzugt verwendet werden?",
      type: "tags",
      placeholder: "Begriff eingeben und Enter drücken",
      examples: ['"Kunden" statt "Konsumenten"', '"AI" statt "KI"'],
    },
    {
      key: "avoidTerms",
      label: "Zu vermeidende Begriffe",
      description: "Welche Begriffe oder Formulierungen sollen vermieden werden?",
      type: "tags",
      placeholder: "Begriff eingeben und Enter drücken",
      examples: ["revolutionär", "weltweit führend", "aggressive Verkaufsformulierungen"],
    },
  ],

  "marketing-content": [
    {
      key: "contentGoals",
      label: "Content-Ziele",
      description: "Welche Ziele soll Ihr Content erreichen?",
      type: "text",
      placeholder: "z. B. Bekanntheit steigern und qualifizierte Leads generieren.",
      examples: ["Bekanntheit steigern und qualifizierte Leads generieren.", "Bestehende Kunden informieren."],
      rows: 3,
    },
    {
      key: "contentFormats",
      label: "Content-Formate",
      description: "Welche Content-Formate nutzen Sie?",
      type: "tags",
      placeholder: "Format eingeben und Enter drücken",
      examples: ["Blogartikel, LinkedIn Posts, Newsletter", "Landingpages, Whitepaper, Anzeigen"],
    },
    {
      key: "relevantTopics",
      label: "Relevante Themen",
      description: "Welche Themen sind besonders relevant?",
      type: "tags",
      placeholder: "Thema eingeben und Enter drücken",
      examples: ["Marketing Automation, AI und Digitalisierung", "Energieeffizienz und nachhaltiges Heizen"],
    },
    {
      key: "keywords",
      label: "Wichtige Keywords",
      description: "Welche Keywords sind besonders wichtig?",
      type: "tags",
      placeholder: "Keyword eingeben und Enter drücken",
      examples: ["Marketing Automation", "Leadgenerierung", "CRM"],
    },
    {
      key: "coreMessages",
      label: "Kernbotschaften",
      description: "Welche zentralen Marketingbotschaften sollen vermittelt werden?",
      type: "tags",
      placeholder: "Botschaft eingeben und Enter drücken",
      examples: ["Wir machen komplexe Marketingprozesse einfach.", "Unsere Lösungen helfen Unternehmen, effizienter zu arbeiten."],
    },
  ],

  sales: [
    {
      key: "salesArguments",
      label: "Verkaufsargumente",
      description: "Was sind Ihre wichtigsten Verkaufsargumente?",
      type: "tags",
      placeholder: "Argument eingeben und Enter drücken",
      examples: ["Schnelle Implementierung und persönlicher Support.", "Hohe Qualität und kurze Lieferzeiten."],
    },
    {
      key: "customerBenefits",
      label: "Konkreter Kundennutzen",
      description: "Welche konkreten Kundennutzen sollen hervorgehoben werden?",
      type: "tags",
      placeholder: "Nutzen eingeben und Enter drücken",
      examples: ["Kunden sparen Zeit und reduzieren manuelle Arbeit.", "Kunden senken ihre Energiekosten."],
    },
    {
      key: "references",
      label: "Referenzkunden",
      description: "Welche Kunden oder Referenzen dürfen genannt werden?",
      type: "text",
      placeholder: "z. B. BMW, Siemens und Bosch dürfen genannt werden.",
      examples: ["BMW, Siemens und Bosch dürfen genannt werden.", "Kundennamen dürfen nur nach vorheriger Freigabe genannt werden."],
      rows: 3,
    },
  ],

  "legal-compliance": [
    {
      key: "regulations",
      label: "Rechtliche Vorgaben",
      description: "Welche rechtlichen oder regulatorischen Vorgaben muss die KI beachten?",
      type: "tags",
      placeholder: "Vorgabe eingeben und Enter drücken",
      examples: ["Es dürfen keine Heilversprechen gemacht werden.", "Preisangaben müssen inklusive Mehrwertsteuer erfolgen."],
    },
    {
      key: "forbiddenStatements",
      label: "Verbotene Aussagen",
      description: "Welche Aussagen oder Versprechen dürfen niemals verwendet werden?",
      type: "tags",
      placeholder: "Aussage eingeben und Enter drücken",
      examples: ["Keine 100-prozentige Wirksamkeit versprechen.", "Keine garantierten Kosteneinsparungen behaupten."],
    },
    {
      key: "mandatoryDisclosures",
      label: "Pflichtangaben",
      description: "Welche Pflichtangaben oder rechtlichen Hinweise müssen berücksichtigt werden?",
      type: "tags",
      placeholder: "Pflichtangabe eingeben und Enter drücken",
      examples: ["Bei bestimmten Produkten muss ein gesetzlicher Hinweis ergänzt werden.", "Bei Gewinnspielen müssen Teilnahmebedingungen berücksichtigt werden."],
    },
  ],

  "existing-content": [
    {
      key: "contentSources",
      label: "Bestehende Content-Quellen",
      description: "Welche bestehenden Inhalte sollen als Wissensquelle verwendet werden?",
      type: "tags",
      placeholder: "Quelle eingeben und Enter drücken",
      examples: ["Website, Produktbroschüren, Präsentationen, Whitepaper, Blogartikel"],
    },
    {
      key: "bestPracticeContent",
      label: "Best-Practice-Content",
      description: "Welche Inhalte gelten als Best Practice für Tonalität und Qualität?",
      type: "text",
      placeholder: "z. B. Die Kampagne 'Digitalisierung 2025' entspricht unserer gewünschten Tonalität.",
      examples: [
        "Die Kampagne 'Digitalisierung 2025' entspricht unserer gewünschten Tonalität.",
        "Die Produktbroschüre für Produkt X ist unsere wichtigste sprachliche Referenz.",
      ],
      rows: 4,
    },
  ],

  "visual-media": [
    {
      key: "imageStyle",
      label: "Bildstil",
      description: "Wie soll die Bildsprache aussehen?",
      type: "text",
      placeholder: "z. B. Modern, authentisch und hochwertig.",
      examples: ["Modern, authentisch und hochwertig.", "Technisch, minimalistisch und klar."],
      rows: 3,
    },
    {
      key: "preferredMotifs",
      label: "Bevorzugte Bildmotive",
      description: "Welche Motive sollen bevorzugt verwendet werden?",
      type: "tags",
      placeholder: "Motiv eingeben und Enter drücken",
      examples: ["Mitarbeitende in realistischen Arbeitssituationen", "Moderne Gebäude und nachhaltige Technologien"],
    },
    {
      key: "avoidStyles",
      label: "Zu vermeidende Stile",
      description: "Welche visuellen Stile sollen vermieden werden?",
      type: "tags",
      placeholder: "Stil eingeben und Enter drücken",
      examples: ["Keine offensichtlich künstlichen Stock-Fotos", "Keine Comic- oder Cartoon-Darstellungen"],
    },
    {
      key: "forbiddenImages",
      label: "Verbotene Bilder",
      description: "Welche Bilder oder Darstellungen dürfen nicht verwendet werden?",
      type: "tags",
      placeholder: "Verbot eingeben und Enter drücken",
      examples: ["Keine Bilder von Kindern", "Keine Wettbewerberprodukte"],
    },
  ],

  "ai-knowledge": [
    {
      key: "alwaysConsider",
      label: "Immer berücksichtigen",
      description: "Welche Informationen muss die KI immer berücksichtigen?",
      type: "tags",
      placeholder: "Information eingeben und Enter drücken",
      examples: ["Unsere Markenwerte, Zielgruppen und Corporate Language", "Produktinformationen und rechtliche Vorgaben"],
    },
    {
      key: "bindingSources",
      label: "Verbindliche Quellen",
      description: "Welche Quellen sind besonders verbindlich?",
      type: "tags",
      placeholder: "Quelle eingeben und Enter drücken",
      examples: [
        "Aktuelle Produktdatenblätter haben Vorrang vor älteren Präsentationen",
        "Die aktuelle Brand Guideline ist für Tonalität und Gestaltung maßgeblich",
      ],
    },
    {
      key: "conflictResolution",
      label: "Umgang mit widersprüchlichen Informationen",
      description: "Was soll die KI bei widersprüchlichen oder fehlenden Informationen tun?",
      type: "text",
      placeholder: "z. B. Bei widersprüchlichen Informationen die aktuellste Quelle verwenden.",
      examples: [
        "Keine Informationen erfinden.",
        "Bei widersprüchlichen Informationen die aktuellste Quelle verwenden.",
        "Wenn keine eindeutige Information vorhanden ist, auf die Unsicherheit hinweisen.",
      ],
      rows: 4,
    },
  ],
};
