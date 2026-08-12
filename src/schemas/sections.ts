import { z } from "zod";

export const CompanySchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  description: z.string().default(""),
  mission: z.string().default(""),
  vision: z.string().default(""),
  values: z.array(z.string()).default([]),
});

export const ProductCategorySchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  usps: z.array(z.string()).default([]),
});

export const TargetGroupSchema = z.object({
  name: z.string().min(1, "Pflichtfeld"),
  industry: z.string().default(""),
  description: z.string().default(""),
  personas: z.array(
    z.object({
      name: z.string(),
      description: z.string().default(""),
    })
  ).default([]),
});

export const BrandLanguageSchema = z.object({
  brandPerception: z.string().default(""),
  communicationStyle: z.string().default(""),
  salutation: z.string().default(""),
  preferredTerms: z.array(z.string()).default([]),
  avoidTerms: z.array(z.string()).default([]),
});

export const MarketingContentSchema = z.object({
  contentGoals: z.string().default(""),
  contentFormats: z.array(z.string()).default([]),
  relevantTopics: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  coreMessages: z.array(z.string()).default([]),
});

export const SalesSchema = z.object({
  salesArguments: z.array(z.string()).default([]),
  customerBenefits: z.array(z.string()).default([]),
  references: z.string().default(""),
});

export const LegalComplianceSchema = z.object({
  regulations: z.array(z.string()).default([]),
  forbiddenStatements: z.array(z.string()).default([]),
  mandatoryDisclosures: z.array(z.string()).default([]),
});

export const ExistingContentSchema = z.object({
  contentSources: z.array(z.string()).default([]),
  bestPracticeContent: z.string().default(""),
});

export const VisualMediaSchema = z.object({
  imageStyle: z.string().default(""),
  preferredMotifs: z.array(z.string()).default([]),
  avoidStyles: z.array(z.string()).default([]),
  forbiddenImages: z.array(z.string()).default([]),
});

export const AIKnowledgeSchema = z.object({
  alwaysConsider: z.array(z.string()).default([]),
  bindingSources: z.array(z.string()).default([]),
  conflictResolution: z.string().default(""),
});

export const SECTION_SCHEMAS = {
  company: CompanySchema,
  products: z.object({ categories: z.array(ProductCategorySchema).default([]) }),
  "target-groups": z.object({ groups: z.array(TargetGroupSchema).default([]) }),
  "brand-language": BrandLanguageSchema,
  "marketing-content": MarketingContentSchema,
  sales: SalesSchema,
  "legal-compliance": LegalComplianceSchema,
  "existing-content": ExistingContentSchema,
  "visual-media": VisualMediaSchema,
  "ai-knowledge": AIKnowledgeSchema,
} as const;

export type CompanyData = z.infer<typeof CompanySchema>;
export type ProductCategoryData = z.infer<typeof ProductCategorySchema>;
export type TargetGroupData = z.infer<typeof TargetGroupSchema>;
export type BrandLanguageData = z.infer<typeof BrandLanguageSchema>;
export type MarketingContentData = z.infer<typeof MarketingContentSchema>;
export type SalesData = z.infer<typeof SalesSchema>;
export type LegalComplianceData = z.infer<typeof LegalComplianceSchema>;
export type ExistingContentData = z.infer<typeof ExistingContentSchema>;
export type VisualMediaData = z.infer<typeof VisualMediaSchema>;
export type AIKnowledgeData = z.infer<typeof AIKnowledgeSchema>;
