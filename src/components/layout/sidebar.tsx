"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, LayoutDashboard, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/lib/sections";
import { SECTION_ICON_MAP } from "@/lib/icon-map";
import { SectionStatus } from "@/types";
import { SectionStatusIcon } from "@/components/wizard/section-status-icon";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  completionScore: number;
  sectionStatuses: Record<string, SectionStatus>;
}

export function Sidebar({ completionScore, sectionStatuses }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-white border-r border-slate-200 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm leading-tight">
            AI Asset Factory<br />Brain
          </span>
        </Link>
      </div>

      {/* Progress */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600">Gesamtfortschritt</span>
          <span className="text-xs font-bold text-violet-600">{completionScore}%</span>
        </div>
        <Progress value={completionScore} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-violet-700 bg-violet-50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mt-2 mb-1 px-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Wissensbereiche</p>
        </div>

        {SECTIONS.map((section) => {
          const Icon = SECTION_ICON_MAP[section.icon] || Brain;
          const status = sectionStatuses[section.key] || "open";
          const isActive = pathname === `/brain/${section.key}`;

          return (
            <Link
              key={section.key}
              href={`/brain/${section.key}`}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                isActive
                  ? "text-violet-700 bg-violet-50 font-medium"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{section.title}</span>
              <SectionStatusIcon status={status} size="sm" />
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
