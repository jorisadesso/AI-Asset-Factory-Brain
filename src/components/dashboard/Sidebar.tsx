"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain, BookOpen, LayoutDashboard,
} from "lucide-react";
import { SECTION_CONFIGS, type SectionType } from "@/types";

interface SectionStatus {
  sectionType: SectionType;
  status: string;
  completionScore: number;
}

interface SidebarProps {
  sections: SectionStatus[];
  overallScore: number;
  isCollapsed: boolean;
}

type LucideIcon = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
};

const iconBox = {
  active: "bg-[#DBEAFE] text-[#1B7FD4]",
  idle: "bg-[var(--surface-raised)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]",
};
const rowActive = "bg-[#EFF6FF]";
const rowIdle = "hover:bg-[var(--surface-raised)]";

function progressBarColor(status: string) {
  if (status === "COMPLETE") return "bg-green-500";
  if (status === "PARTIAL") return "bg-amber-400";
  if (status === "IN_PROGRESS") return "bg-[var(--accent)]";
  return "bg-[var(--surface-raised)]";
}

export function Sidebar({ sections, overallScore, isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const sectionsMap = new Map(sections.map((s) => [s.sectionType, s]));

  if (isCollapsed) {
    const knowledgeActive = pathname === "/knowledge";
    const dashboardActive = pathname === "/dashboard";
    return (
      <aside className="w-full bg-[var(--surface-card)] border-r border-[var(--border)] flex flex-col h-full rounded-r-2xl overflow-hidden shadow-sm">
        <div className="h-[57px] border-b border-[var(--border-subtle)] shrink-0" />

        {/* Dashboard — collapsed */}
        <div className="py-1.5 flex flex-col items-center">
          <Link
            href="/dashboard"
            title="Dashboard"
            className={`group flex justify-center items-center py-1 w-full ${dashboardActive ? rowActive : rowIdle}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${dashboardActive ? iconBox.active : iconBox.idle}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
          </Link>
        </div>
        <div className="border-t border-[var(--border-subtle)] mx-2" />

        <nav className="flex-1 overflow-y-auto py-2 flex flex-col items-center">
          {SECTION_CONFIGS.map((config) => {
            const sectionData = sectionsMap.get(config.type);
            const score = sectionData?.completionScore ?? 0;
            const href = `/brain/${config.type.toLowerCase()}`;
            const isActive = pathname === href;
            const Icon = ICON_MAP[config.icon] ?? Brain;

            return (
              <Link
                key={config.type}
                href={href}
                title={`${config.label} · ${Math.round(score * 100)}%`}
                className={`group flex justify-center items-center py-1 w-full ${isActive ? rowActive : rowIdle}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${isActive ? iconBox.active : iconBox.idle}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-subtle)] py-1 flex flex-col items-center">
          <Link
            href="/knowledge"
            title="Wissensbasis"
            className={`group flex justify-center items-center py-1 w-full ${knowledgeActive ? rowActive : rowIdle}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${knowledgeActive ? iconBox.active : iconBox.idle}`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </aside>
    );
  }

  const knowledgeActive = pathname === "/knowledge";
  const dashboardActive = pathname === "/dashboard";
  return (
    <aside className="w-full bg-[var(--surface-card)] border-r border-[var(--border)] flex flex-col h-full rounded-r-2xl overflow-hidden shadow-sm">
      {/* Dashboard — expanded */}
      <div className="px-2 pt-2 pb-1.5">
        <Link
          href="/dashboard"
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${dashboardActive ? rowActive : rowIdle}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${dashboardActive ? iconBox.active : iconBox.idle}`}>
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className={`text-sm font-semibold ${dashboardActive ? "text-[#1569B8]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
            Dashboard
          </span>
        </Link>
      </div>
      <div className="border-t border-[var(--border-subtle)] mx-3 mb-1" />

      {/* Overall progress */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">Gesamtfortschritt</span>
          <span className="text-xs font-bold text-[var(--text-secondary)] ml-2">{Math.round(overallScore * 100)}%</span>
        </div>
        <div className="w-full bg-[var(--surface-raised)] rounded-full h-1.5">
          <div
            className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${overallScore * 100}%` }}
          />
        </div>
      </div>

      {/* Section list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {SECTION_CONFIGS.map((config) => {
          const sectionData = sectionsMap.get(config.type);
          const score = sectionData?.completionScore ?? 0;
          const status = sectionData?.status ?? "OPEN";
          const href = `/brain/${config.type.toLowerCase()}`;
          const isActive = pathname === href;
          const Icon = ICON_MAP[config.icon] ?? Brain;

          return (
            <Link
              key={config.type}
              href={href}
              title={config.label}
              className={`group flex items-center gap-2.5 px-3 py-1 transition-colors ${isActive ? rowActive : rowIdle}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${isActive ? iconBox.active : iconBox.idle}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium leading-tight truncate ${
                  isActive ? "text-[#1569B8]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                }`}>
                  {config.label}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 bg-[var(--surface-raised)] rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all ${progressBarColor(status)}`}
                      style={{ width: `${Math.round(score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 w-7 text-right">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Wissensbasis */}
      <div className="border-t border-[var(--border-subtle)] py-2">
        <Link
          href="/knowledge"
          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${knowledgeActive ? rowActive : rowIdle}`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${knowledgeActive ? iconBox.active : iconBox.idle}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className={`text-sm font-medium ${knowledgeActive ? "text-[#1569B8]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
            Wissensbasis
          </span>
        </Link>
      </div>
    </aside>
  );
}
