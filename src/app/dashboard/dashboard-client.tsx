"use client";

import { useBrain } from "@/hooks/use-brain";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SECTIONS } from "@/lib/sections";
import { SectionKey, SectionStatus } from "@/types";
import Link from "next/link";
import {
  Brain, FileText, ChevronRight, Sparkles,
} from "lucide-react";
import { SECTION_ICON_MAP } from "@/lib/icon-map";

const STATUS_LABEL: Record<SectionStatus, string> = {
  complete: "Vollständig",
  partial: "Teilweise",
  open: "Offen",
};

const STATUS_VARIANT: Record<SectionStatus, "success" | "warning" | "default"> = {
  complete: "success",
  partial: "warning",
  open: "default",
};

export function DashboardClient() {
  const { brain, completionStatus, completionScore, sectionStatuses, loading } = useBrain();

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const statusMap = Object.fromEntries(completionStatus.map((s) => [s.sectionKey, s]));
  const completeSections = completionStatus.filter((s) => s.status === "complete").length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Asset Factory Brain</h1>
              <p className="text-slate-500 text-sm">{brain?.name}</p>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Gesamtfortschritt</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{completionScore}%</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {completeSections} von {SECTIONS.length} Bereichen vollständig
                </p>
              </div>
              <div className="text-right">
                {completionScore >= 80 && (
                  <Link href="/quality-check">
                    <Button variant="default" size="md">
                      <Sparkles className="h-4 w-4" />
                      Qualitätsprüfung starten
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <Progress value={completionScore} className="h-3" />
          </CardContent>
        </Card>

        {/* Sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section, index) => {
            const Icon = SECTION_ICON_MAP[section.icon] || Brain;
            const status = sectionStatuses[section.key as SectionKey] || "open";
            const score = statusMap[section.key]?.score || 0;

            return (
              <Link key={section.key} href={`/brain/${section.key}`}>
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-violet-100 transition-colors">
                    <Icon className="h-5 w-5 text-slate-500 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900 truncate">{section.title}</p>
                      <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                    </div>
                    <div className="mt-2">
                      <Progress
                        value={score}
                        className="h-1.5"
                        indicatorClassName={
                          status === "complete" ? "bg-emerald-500" : status === "partial" ? "bg-amber-400" : "bg-slate-300"
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{score}% abgeschlossen</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-400 shrink-0 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex gap-3">
          <Link href="/knowledge">
            <Button variant="outline" size="md">
              <FileText className="h-4 w-4" />
              Wissensbasis anzeigen
            </Button>
          </Link>
          <Link href="/quality-check">
            <Button variant="outline" size="md">
              <Sparkles className="h-4 w-4" />
              Qualitätsprüfung
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
