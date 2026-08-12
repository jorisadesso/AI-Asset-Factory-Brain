"use client";

import { Sidebar } from "./sidebar";
import { useBrain } from "@/hooks/use-brain";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { completionScore, sectionStatuses } = useBrain();

  return (
    <div className="flex min-h-screen">
      <Sidebar completionScore={completionScore} sectionStatuses={sectionStatuses} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
