"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_CONFIGS, type SectionType } from "@/types";

interface SectionStatus {
  sectionType: SectionType;
  status: string;
  completionScore: number;
}

interface SidebarProps {
  sections: SectionStatus[];
  overallScore: number;
}

const STATUS_DOT: Record<string, string> = {
  COMPLETE: "bg-green-500",
  PARTIAL: "bg-yellow-400",
  IN_PROGRESS: "bg-blue-400",
  OPEN: "bg-gray-200",
};

const SECTION_ICONS: Record<string, string> = {
  Building2: "🏢",
  Package: "📦",
  Users: "👥",
  MessageSquare: "💬",
  Megaphone: "📢",
  TrendingUp: "📈",
  Shield: "🛡️",
  FileText: "📄",
  Image: "🖼️",
  Brain: "🧠",
};

export function Sidebar({ sections, overallScore }: SidebarProps) {
  const pathname = usePathname();
  const sectionsMap = new Map(sections.map((s) => [s.sectionType, s]));

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Overall progress */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Gesamtfortschritt</span>
          <span className="text-xs font-bold text-gray-900">{Math.round(overallScore * 100)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${overallScore * 100}%` }}
          />
        </div>
      </div>

      {/* Section list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {SECTION_CONFIGS.map((config, index) => {
          const sectionData = sectionsMap.get(config.type);
          const score = sectionData?.completionScore ?? 0;
          const status = sectionData?.status ?? "OPEN";
          const href = `/brain/${config.type.toLowerCase()}`;
          const isActive = pathname === href;

          return (
            <Link
              key={config.type}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {/* Index number */}
              <span className={`text-xs font-mono w-4 shrink-0 ${isActive ? "text-blue-500" : "text-gray-300"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <span className="text-base shrink-0">{SECTION_ICONS[config.icon]}</span>

              {/* Label + progress */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isActive ? "text-blue-700" : ""}`}>
                  {config.label}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 bg-gray-100 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        status === "COMPLETE"
                          ? "bg-green-500"
                          : status === "PARTIAL"
                            ? "bg-yellow-400"
                            : status === "IN_PROGRESS"
                              ? "bg-blue-400"
                              : "bg-gray-200"
                      }`}
                      style={{ width: `${Math.round(score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 w-7 text-right">
                    {Math.round(score * 100)}%
                  </span>
                </div>
              </div>

              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        <Link
          href="/knowledge"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/knowledge"
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <span>🧾</span>
          <span>Wissensbasis</span>
        </Link>
        <Link
          href="/team"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/team"
              ? "bg-blue-50 text-blue-700 font-medium"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <span>👥</span>
          <span>Team</span>
        </Link>
      </div>
    </aside>
  );
}
