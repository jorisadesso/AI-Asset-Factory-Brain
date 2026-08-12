export type SectionKey =
  | "company"
  | "products"
  | "target-groups"
  | "brand-language"
  | "marketing-content"
  | "sales"
  | "legal-compliance"
  | "existing-content"
  | "visual-media"
  | "ai-knowledge";

export type SectionStatus = "open" | "partial" | "complete";

export interface SectionConfig {
  key: SectionKey;
  title: string;
  description: string;
  icon: string;
  filename: string;
}

export interface QualityIssue {
  severity: "error" | "warning" | "info";
  sectionKey: SectionKey;
  message: string;
}

export interface ExtractionSchema {
  type: string;
  fields: Record<string, { type: string; description: string; required: boolean }>;
}

export interface CompletionStatus {
  sectionKey: SectionKey;
  score: number;
  status: SectionStatus;
}
