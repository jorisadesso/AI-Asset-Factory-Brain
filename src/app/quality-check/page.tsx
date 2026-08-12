import { auth } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";
import { QualityCheckClient } from "./quality-check-client";

export default async function QualityCheckPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <QualityCheckClient />;
}
