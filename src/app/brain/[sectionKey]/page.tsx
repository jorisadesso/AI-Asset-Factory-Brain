import { auth } from "@/lib/auth/helpers";
import { redirect, notFound } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { SectionKey } from "@/types";
import { SectionPageClient } from "./section-page-client";

interface Props {
  params: Promise<{ sectionKey: string }>;
}

export default async function SectionPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { sectionKey } = await params;
  const section = SECTIONS.find((s) => s.key === sectionKey);
  if (!section) notFound();

  return <SectionPageClient sectionKey={sectionKey as SectionKey} />;
}

export async function generateStaticParams() {
  return SECTIONS.map((s) => ({ sectionKey: s.key }));
}
