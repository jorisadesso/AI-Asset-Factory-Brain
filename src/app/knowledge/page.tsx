import { auth } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { KnowledgeClient } from "./knowledge-client";

export default async function KnowledgePage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <KnowledgeClient />;
}
