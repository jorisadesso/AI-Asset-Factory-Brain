import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SidebarWrapper } from "@/components/dashboard/SidebarWrapper";
import { ChatWidget } from "@/components/ChatWidget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col overflow-hidden">
      <DashboardNav userName={session.user?.name ?? session.user?.email ?? "Nutzer"} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — hidden on mobile, never scrolls the window */}
        <div className="hidden md:flex shrink-0">
          <SidebarWrapper />
        </div>
        {/* Main content scrolls independently */}
        <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <div className="px-6 lg:px-10 py-8">
            {children}
          </div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
