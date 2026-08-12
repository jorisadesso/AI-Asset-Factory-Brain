"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SECTION_CONFIGS, type SectionType } from "@/types";

interface QualityFinding {
  severity: "error" | "warning" | "info";
  section: SectionType;
  title?: string;
  message: string;
  suggestion?: string;
}

interface BrainData {
  id: string;
  name: string;
  completionScore: number;
  sections: Array<{
    sectionType: SectionType;
    status: string;
    completionScore: number;
  }>;
  qualityCheck: {
    findings: QualityFinding[];
    score: number;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETE: "Vollständig",
  PARTIAL: "Teilweise vollständig",
  IN_PROGRESS: "In Bearbeitung",
  OPEN: "Offen",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETE: "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  OPEN: "bg-gray-100 text-gray-500",
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

export function DashboardClient({ userName }: { userName: string }) {
  const [brain, setBrain] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningQualityCheck, setRunningQualityCheck] = useState(false);

  useEffect(() => {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data: BrainData) => setBrain(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleQualityCheck() {
    setRunningQualityCheck(true);
    try {
      const res = await fetch("/api/brain/quality-check", { method: "POST" });
      const data = await res.json() as { findings: QualityFinding[]; score: number };
      setBrain((prev) =>
        prev ? { ...prev, qualityCheck: data } : prev
      );
    } catch {
      // Silent
    } finally {
      setRunningQualityCheck(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="text-center py-16 text-gray-500">
        Fehler beim Laden der Daten. Bitte neu laden.
      </div>
    );
  }

  const overallPercent = Math.round(brain.completionScore * 100);
  const completedSections = brain.sections.filter((s) => s.status === "COMPLETE").length;
  const nextSection = brain.sections.find((s) => s.status !== "COMPLETE");
  const isNew = overallPercent === 0;

  // First-time welcome screen
  if (isNew) {
    return (
      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="max-w-xl">
            <div className="text-sm font-medium text-blue-200 mb-2">Willkommen, {userName.split(" ")[0]}!</div>
            <h1 className="text-2xl font-bold mb-3">Ihr AI Asset Factory Brain wartet</h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Hier strukturieren Sie das Wissen Ihres Unternehmens — damit KI-Tools konsistente,
              markengerechte Inhalte erstellen können. Füllen Sie die 10 Bereiche aus und generieren
              Sie automatisch Ihre persönliche Wissensbasis.
            </p>
            <Link
              href={`/brain/${SECTION_CONFIGS[0].type.toLowerCase()}`}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition"
            >
              Jetzt starten →
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">So funktioniert es</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "01", icon: "✍️", title: "Wissen eingeben", desc: "Füllen Sie 10 strukturierte Bereiche zu Ihrem Unternehmen, Produkten und Zielgruppen aus." },
              { step: "02", icon: "⚡", title: "KI generiert Markdown", desc: "Jeder ausgefüllte Bereich wird automatisch in ein sauberes Markdown-Dokument umgewandelt." },
              { step: "03", icon: "🚀", title: "Content erstellen", desc: "Übergeben Sie die Wissensbasis an Ihre KI-Tools für konsistente, markengerechte Texte." },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono text-gray-300">{item.step}</span>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section overview */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ihre 10 Bereiche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTION_CONFIGS.map((config, i) => (
              <Link
                key={config.type}
                href={`/brain/${config.type.toLowerCase()}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition group"
              >
                <span className="text-xs font-mono text-gray-300">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg">{SECTION_ICONS[config.icon]}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition">{config.label}</span>
                <span className="ml-auto text-gray-300 group-hover:text-blue-400 transition text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Asset Factory Brain</h1>
        <p className="text-gray-500 mt-1">
          Willkommen zurück, {userName.split(" ")[0]}!
        </p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{overallPercent}%</div>
            <div className="text-sm text-gray-500 mt-0.5">Gesamtfortschritt</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {completedSections} / 10
            </div>
            <div className="text-sm text-gray-500">Bereiche vollständig</div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {nextSection && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">Als nächstes:</span>
            <Link
              href={`/brain/${nextSection.sectionType.toLowerCase()}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {SECTION_CONFIGS.find((c) => c.type === nextSection.sectionType)?.label}
            </Link>
          </div>
        )}
      </div>

      {/* "Weiter machen" nudge — only shown when partially done */}
      {overallPercent > 0 && overallPercent < 100 && nextSection && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-blue-900">
              {10 - completedSections} {10 - completedSections === 1 ? "Bereich" : "Bereiche"} fehlen noch
            </div>
            <div className="text-xs text-blue-600 mt-0.5">
              Als nächstes: <span className="font-medium">{SECTION_CONFIGS.find((c) => c.type === nextSection.sectionType)?.label}</span>
            </div>
          </div>
          <Link
            href={`/brain/${nextSection.sectionType.toLowerCase()}`}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Weiter →
          </Link>
        </div>
      )}

      {/* Sections grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bereiche</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTION_CONFIGS.map((config) => {
            const section = brain.sections.find((s) => s.sectionType === config.type);
            const status = section?.status ?? "OPEN";
            const score = section?.completionScore ?? 0;

            return (
              <Link
                key={config.type}
                href={`/brain/${config.type.toLowerCase()}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{SECTION_ICONS[config.icon]}</span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition">
                        {config.label}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      status === "COMPLETE"
                        ? "bg-green-500"
                        : status === "PARTIAL"
                          ? "bg-yellow-500"
                          : status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                    }`}
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1.5">
                  {Math.round(score * 100)}% vollständig
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quality check */}
      <QualityCheckPanel
        qualityCheck={brain.qualityCheck}
        running={runningQualityCheck}
        onRun={handleQualityCheck}
      />

      {/* Knowledge base link */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Wissensbasis ansehen</h2>
            <p className="text-blue-100 text-sm mt-1">
              Alle generierten Markdown-Dokumente einsehen und exportieren
            </p>
          </div>
          <Link
            href="/knowledge"
            className="bg-white text-blue-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            Wissensbasis öffnen
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Quality check panel ───────────────────────────────────────────────────────

const SECTION_LABELS_MAP: Record<string, string> = {
  COMPANY: "Unternehmen",
  PRODUCT_CATEGORIES: "Produkt- & Dienstleistungskategorien",
  TARGET_GROUPS: "Zielgruppen",
  BRAND_LANGUAGE: "Marke & Sprache",
  MARKETING_CONTENT: "Marketing & Content",
  SALES: "Vertrieb",
  LEGAL_COMPLIANCE: "Recht & Compliance",
  EXISTING_CONTENT: "Bestehender Content",
  VISUAL_GUIDELINES: "Bilder & Medien",
  AI_RULES: "KI-Wissensbasis",
};

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="48" y="52" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">
        {Math.round(score)}
      </text>
    </svg>
  );
}

function QualityCheckPanel({
  qualityCheck,
  running,
  onRun,
}: {
  qualityCheck: { findings: QualityFinding[]; score: number } | null;
  running: boolean;
  onRun: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  // Group findings by section
  const grouped = qualityCheck?.findings.reduce<Record<string, QualityFinding[]>>((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {}) ?? {};

  const errors = qualityCheck?.findings.filter((f) => f.severity === "error").length ?? 0;
  const warnings = qualityCheck?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const infos = qualityCheck?.findings.filter((f) => f.severity === "info").length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Qualitätsprüfung</h2>
          <p className="text-sm text-gray-500">KI-basierte Analyse Ihrer Wissensbasis</p>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 flex items-center gap-2"
        >
          {running && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {running ? "Wird analysiert..." : "Qualität prüfen"}
        </button>
      </div>

      {qualityCheck ? (
        <div>
          {/* Score + summary row */}
          <div className="flex items-center gap-6 mb-5">
            <ScoreRing score={qualityCheck.score} />
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-2">Qualitätsscore von 100</div>
              <div className="flex flex-wrap gap-3">
                {errors > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                    ❌ {errors} {errors === 1 ? "Fehler" : "Fehler"}
                  </span>
                )}
                {warnings > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full">
                    ⚠️ {warnings} {warnings === 1 ? "Warnung" : "Warnungen"}
                  </span>
                )}
                {infos > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    ℹ️ {infos} {infos === 1 ? "Hinweis" : "Hinweise"}
                  </span>
                )}
                {errors === 0 && warnings === 0 && infos === 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    ✅ Keine Probleme gefunden
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grouped findings */}
          {Object.keys(grouped).length > 0 && (
            <div className="space-y-2">
              {Object.entries(grouped).map(([section, sectionFindings]) => {
                const isOpen = expandedSections.has(section);
                const worstSeverity = sectionFindings.some((f) => f.severity === "error")
                  ? "error"
                  : sectionFindings.some((f) => f.severity === "warning")
                    ? "warning"
                    : "info";
                const sectionLabel = SECTION_LABELS_MAP[section] ?? section;

                return (
                  <div
                    key={section}
                    className={`rounded-xl border overflow-hidden ${
                      worstSeverity === "error"
                        ? "border-red-200"
                        : worstSeverity === "warning"
                          ? "border-yellow-200"
                          : "border-blue-200"
                    }`}
                  >
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${
                        worstSeverity === "error"
                          ? "bg-red-50 text-red-800 hover:bg-red-100"
                          : worstSeverity === "warning"
                            ? "bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                            : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{worstSeverity === "error" ? "❌" : worstSeverity === "warning" ? "⚠️" : "ℹ️"}</span>
                        <span>{sectionLabel}</span>
                        <span className="font-normal opacity-70">
                          · {sectionFindings.length} {sectionFindings.length === 1 ? "Problem" : "Probleme"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/brain/${section.toLowerCase()}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs underline opacity-70 hover:opacity-100"
                        >
                          Bearbeiten
                        </Link>
                        <span className="text-xs opacity-50">{isOpen ? "▲" : "▼"}</span>
                      </span>
                    </button>

                    {/* Findings list */}
                    {isOpen && (
                      <div className="divide-y divide-gray-100">
                        {sectionFindings.map((f, i) => (
                          <div key={i} className="px-4 py-3 bg-white">
                            {f.title && (
                              <div className="text-sm font-medium text-gray-900 mb-0.5">{f.title}</div>
                            )}
                            <div className="text-sm text-gray-600">{f.message}</div>
                            {f.suggestion && (
                              <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                <span className="font-medium text-gray-700">Vorschlag: </span>
                                {f.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-400 bg-gray-50 px-4 py-8 rounded-xl text-center">
          Noch keine Qualitätsprüfung durchgeführt.{" "}
          <button onClick={onRun} className="text-blue-600 hover:underline font-medium">
            Jetzt analysieren
          </button>
        </div>
      )}
    </div>
  );
}
