import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SidebarWrapper } from "@/components/dashboard/SidebarWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNav userName={session.user?.name ?? session.user?.email ?? "Nutzer"} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — hidden on mobile */}
        <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarWrapper />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
