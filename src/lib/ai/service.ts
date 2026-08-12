import Anthropic from "@anthropic-ai/sdk";
import { SectionKey, QualityIssue } from "@/types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-anthropic-api-key-here") {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ExtractionResult {
  success: boolean;
  data: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

const EXTRACTION_PROMPTS: Record<SectionKey, string> = {
  company: `Extract company information from the document. Return a JSON object with:
- name: company name (string)
- description: 2-5 sentence description (string)
- mission: mission statement (string)
- vision: vision statement (string)
- values: list of company values (string array)
Only include information explicitly stated. Use empty string/array for missing fields.`,

  products: `Extract product/service category information. Return a JSON object with:
- categories: array of objects, each with:
  - name: category name
  - description: short description
  - features: list of key features/services
  - usps: list of unique selling points
Only include information explicitly stated.`,

  "target-groups": `Extract target group information. Return a JSON object with:
- groups: array of objects, each with:
  - name: target group name
  - industry: industry/market
  - description: description of the group
  - personas: array of {name, description} objects
Only include information explicitly stated.`,

  "brand-language": `Extract brand and language guidelines. Return a JSON object with:
- brandPerception: how the brand should be perceived
- communicationStyle: communication tone and style
- salutation: preferred form of address (Du/Sie)
- preferredTerms: list of preferred terms
- avoidTerms: list of terms to avoid
Only include information explicitly stated.`,

  "marketing-content": `Extract marketing and content strategy. Return a JSON object with:
- contentGoals: content objectives
- contentFormats: list of content formats used
- relevantTopics: list of relevant topics
- keywords: list of important keywords
- coreMessages: list of core marketing messages
Only include information explicitly stated.`,

  sales: `Extract sales information. Return a JSON object with:
- salesArguments: list of key sales arguments
- customerBenefits: list of concrete customer benefits
- references: information about referenceable customers
Only include information explicitly stated.`,

  "legal-compliance": `Extract legal and compliance requirements. Return a JSON object with:
- regulations: list of legal/regulatory requirements
- forbiddenStatements: list of statements never to use
- mandatoryDisclosures: list of required disclosures
Only include information explicitly stated.`,

  "existing-content": `Extract information about existing content. Return a JSON object with:
- contentSources: list of existing content sources
- bestPracticeContent: description of best practice content
Only include information explicitly stated.`,

  "visual-media": `Extract visual and media guidelines. Return a JSON object with:
- imageStyle: description of desired image style
- preferredMotifs: list of preferred image motifs
- avoidStyles: list of visual styles to avoid
- forbiddenImages: list of forbidden image types
Only include information explicitly stated.`,

  "ai-knowledge": `Extract AI knowledge base rules. Return a JSON object with:
- alwaysConsider: list of information AI must always consider
- bindingSources: list of binding/authoritative sources
- conflictResolution: how AI should handle conflicting information
Only include information explicitly stated.`,
};

export async function extractFromDocument(
  text: string,
  sectionKey: SectionKey
): Promise<ExtractionResult> {
  const prompt = EXTRACTION_PROMPTS[sectionKey];

  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nDocument text:\n\`\`\`\n${text.slice(0, 8000)}\n\`\`\`\n\nReturn ONLY valid JSON. No markdown, no explanation.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonStr = content.text.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const data = JSON.parse(jsonStr);

    return {
      success: true,
      data,
      confidence: "high",
      warnings: [],
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        data: {},
        confidence: "low",
        warnings: ["Konnte keine strukturierten Daten aus dem Dokument extrahieren."],
      };
    }
    throw error;
  }
}

export async function runQualityCheck(
  brainData: Record<string, unknown>
): Promise<QualityIssue[]> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze this company knowledge base for quality issues. Return a JSON array of issues.

Each issue: {"severity": "error"|"warning"|"info", "sectionKey": string, "message": string}

Check for:
- Missing critical information
- Contradictory statements
- Vague/insufficient descriptions
- Missing legal information
- Incomplete target groups
- Missing USPs

Knowledge base:
${JSON.stringify(brainData, null, 2).slice(0, 6000)}

Return ONLY a JSON array. No markdown.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return [];

    const jsonStr = content.text.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(jsonStr) as QualityIssue[];
  } catch {
    return [];
  }
}

export async function generateMarkdownContent(
  sectionKey: SectionKey,
  data: Record<string, unknown>
): Promise<string> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate a clean, well-structured Markdown knowledge document for an AI content generation system.

Section: ${sectionKey}
Data: ${JSON.stringify(data, null, 2)}

Requirements:
- Clear headings with ##
- No redundant info
- Optimized for LLM reading
- German language
- Professional tone

Return ONLY the markdown content.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return "";
    return content.text;
  } catch {
    return generateMarkdownFallback(sectionKey, data);
  }
}

function generateMarkdownFallback(
  sectionKey: SectionKey,
  data: Record<string, unknown>
): string {
  const lines: string[] = [`# ${sectionKey}\n`];
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;
    lines.push(`## ${key}`);
    if (Array.isArray(value)) {
      lines.push(value.map((v: unknown) => `- ${v}`).join("\n"));
    } else {
      lines.push(String(value));
    }
    lines.push("");
  }
  return lines.join("\n");
}
