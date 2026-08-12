import { SectionWizard } from "@/components/wizard/SectionWizard";
import { SECTION_CONFIGS } from "@/types";
import { notFound } from "next/navigation";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sectionConfig = SECTION_CONFIGS.find((c) => c.type === section.toUpperCase());

  if (!sectionConfig) notFound();

  return <SectionWizard config={sectionConfig} />;
}

export function generateStaticParams() {
  return SECTION_CONFIGS.map((c) => ({ section: c.type.toLowerCase() }));
}
