"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { QualityIssue } from "@/types";
import { AlertCircle, AlertTriangle, Info, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { SECTION_MAP } from "@/lib/sections";
import { SectionKey } from "@/types";

const ISSUE_ICON = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ISSUE_COLORS = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ISSUE_BADGE: Record<string, "error" | "warning" | "info"> = {
  error: "error",
  warning: "warning",
  info: "info",
};

export function QualityCheckClient() {
  const { toast } = useToast();
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/brain/quality-check")
      .then((r) => r.json())
      .then((json) => {
        setIssues(json.issues || []);
        setScore(json.score ?? null);
        setCompletedAt(json.completedAt || null);
      })
      .finally(() => setFetching(false));
  }, []);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brain/quality-check", { method: "POST" });
      const json = await res.json();
      setIssues(json.issues || []);
      setScore(json.score);
      setCompletedAt(new Date().toISOString());
      toast("Qualitätsprüfung abgeschlossen.", "success");
    } catch {
      toast("Prüfung fehlgeschlagen.", "error");
    } finally {
      setLoading(false);
    }
  };

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            Qualitätsprüfung
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            KI-gestützte Analyse Ihrer Wissensbasis auf Vollständigkeit und Konsistenz
          </p>
        </div>

        {/* Score card */}
        {score !== null && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100">
                  <span className="text-2xl font-bold text-violet-700">{score}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Qualitätsscore</p>
                  <p className="text-sm text-slate-500">
                    {score >= 80 ? "Gute Qualität – bereit für die KI" :
                     score >= 60 ? "Solide Basis – einige Verbesserungen empfohlen" :
                     "Überarbeitung empfohlen"}
                  </p>
                  {completedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Geprüft am {new Date(completedAt).toLocaleDateString("de-DE")}
                    </p>
                  )}
                </div>
                {score >= 80 && <CheckCircle className="h-8 w-8 text-emerald-500 ml-auto" />}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {issues.length > 0 && (
          <div className="flex gap-3 mb-6">
            {errors.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">{errors.length} Fehler</span>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">{warnings.length} Warnungen</span>
              </div>
            )}
            {infos.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">{infos.length} Hinweise</span>
              </div>
            )}
          </div>
        )}

        {/* Issues list */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        ) : issues.length === 0 && score !== null ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-lg font-semibold text-slate-900">Keine Probleme gefunden</p>
            <p className="text-slate-500 text-sm">Ihre Wissensbasis ist vollständig und konsistent.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, i) => {
              const Icon = ISSUE_ICON[issue.severity];
              const sectionTitle = SECTION_MAP[issue.sectionKey as SectionKey]?.title || issue.sectionKey;

              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-4 ${ISSUE_COLORS[issue.severity]}`}
                >
                  <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={ISSUE_BADGE[issue.severity]}>{issue.severity === "error" ? "Fehler" : issue.severity === "warning" ? "Warnung" : "Hinweis"}</Badge>
                      <span className="text-xs font-medium opacity-75">{sectionTitle}</span>
                    </div>
                    <p className="text-sm">{issue.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Run check button */}
        <div className="mt-6">
          <Button onClick={runCheck} loading={loading} size="lg">
            <Sparkles className="h-4 w-4" />
            {score === null ? "Qualitätsprüfung starten" : "Erneut prüfen"}
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            Die KI analysiert Ihre Wissensbasis auf Vollständigkeit, Widersprüche und Verbesserungspotenzial.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
