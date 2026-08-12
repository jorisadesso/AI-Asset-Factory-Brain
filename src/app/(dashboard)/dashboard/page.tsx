import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <DashboardClient
      userName={session?.user?.name ?? session?.user?.email ?? "Nutzer"}
    />
  );
}
