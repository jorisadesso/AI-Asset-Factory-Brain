"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
  XCircle, AlertTriangle, Info, CheckCircle2,
  PenLine, Zap, Rocket, ChevronDown, ChevronUp,
  Paperclip, BookOpen,
} from "lucide-react";
import { SECTION_CONFIGS, type SectionType } from "@/types";
import { BrainLogo } from "@/components/BrainLogo";

// ── Types ─────────────────────────────────────────────────────────────────────

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
    answers: Record<string, string>;
  }>;
  qualityCheck: {
    findings: QualityFinding[];
    score: number;
    checkedAt?: string;
  } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  COMPLETE: "Vollständig",
  PARTIAL: "Teilweise",
  IN_PROGRESS: "In Bearbeitung",
  OPEN: "Offen",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETE: "bg-green-100 text-green-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-[#DBEAFE] text-[#1569B8]",
  OPEN: "bg-gray-100 text-gray-500",
};

const STATUS_BAR_COLORS: Record<string, string> = {
  COMPLETE: "bg-green-500",
  PARTIAL: "bg-amber-400",
  IN_PROGRESS: "bg-[#1B7FD4]",
  OPEN: "bg-gray-200",
};

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

type LucideIcon = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
};

// ── Helper components ─────────────────────────────────────────────────────────

function PhosphorArrowCircleRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" fill="currentColor">
      <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm48.49-92.49a12,12,0,0,1,0,17l-32,32a12,12,0,1,1-17-17L139,140H88a12,12,0,0,1,0-24h51l-11.52-11.51a12,12,0,1,1,17-17Z" />
    </svg>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-3">
      <span className="w-4 h-px bg-gray-200" />
      {label}
      <span className="flex-1 h-px bg-gray-100" />
    </h2>
  );
}

function SectionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Brain;
  return <Icon className={className ?? "w-5 h-5"} />;
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="48" y="52" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
        {Math.round(score)}
      </text>
    </svg>
  );
}

function SeverityIcon({ severity }: { severity: "error" | "warning" | "info" }) {
  if (severity === "error") return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (severity === "warning") return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Info className="w-4 h-4 text-[#1B7FD4] shrink-0" />;
}

function QualityCheckPanel({
  qualityCheck, running, onRun,
}: {
  qualityCheck: { findings: QualityFinding[]; score: number; checkedAt?: string } | null;
  running: boolean;
  onRun: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const STATUS_STEPS = [
    "Analysiere Unternehmensdaten…",
    "Prüfe Produkt- und Zielgruppeninfos…",
    "Prüfe Marke & Compliance…",
    "Erstelle Qualitätsbefunde…",
  ];
  const statusCycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setProgress(2);
      setStatusIdx(0);
      let p = 2;
      timerRef.current = setInterval(() => {
        p += (90 - p) * 0.06 + 0.5;
        if (p >= 89) p = 89;
        setProgress(p);
      }, 400);
      statusCycleRef.current = setInterval(() => {
        setStatusIdx((i) => (i + 1) % STATUS_STEPS.length);
      }, 3500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusCycleRef.current) clearInterval(statusCycleRef.current);
      if (progress > 0) {
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusCycleRef.current) clearInterval(statusCycleRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  }

  const grouped = qualityCheck?.findings.reduce<Record<string, QualityFinding[]>>((acc, f) => {
    if (!acc[f.section]) acc[f.section] = [];
    acc[f.section].push(f);
    return acc;
  }, {}) ?? {};

  const errors = qualityCheck?.findings.filter((f) => f.severity === "error").length ?? 0;
  const warnings = qualityCheck?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const infos = qualityCheck?.findings.filter((f) => f.severity === "info").length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Qualitätsprüfung</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {qualityCheck?.checkedAt
              ? `Zuletzt geprüft: ${new Date(qualityCheck.checkedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date(qualityCheck.checkedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
              : "KI-basierte Analyse Ihrer Wissensbasis"}
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center gap-2 bg-[#1B7FD4] hover:bg-[#1569B8] text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
        >
          {running ? "Analysiert…" : "Qualität prüfen"}
        </button>
      </div>
      {running && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="transition-opacity duration-500">{STATUS_STEPS[statusIdx]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-[#1B7FD4] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {qualityCheck ? (
        <div>
          <div className="flex items-center gap-6 mb-4">
            <ScoreRing score={qualityCheck.score} />
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-2">Qualitätsscore von 100</div>
              <div className="flex flex-wrap gap-2">
                {errors > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> {errors} {errors === 1 ? "Fehler" : "Fehler"}
                  </span>
                )}
                {warnings > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> {warnings} {warnings === 1 ? "Warnung" : "Warnungen"}
                  </span>
                )}
                {infos > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1569B8] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full">
                    <Info className="w-3 h-3" /> {infos} {infos === 1 ? "Hinweis" : "Hinweise"}
                  </span>
                )}
                {errors === 0 && warnings === 0 && infos === 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Keine Probleme
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Prüft inhaltliche Qualität — auch vollständige Bereiche können Hinweise haben.
          </p>

          {Object.keys(grouped).length > 0 && (
            <div className="space-y-2">
              {Object.entries(grouped).map(([section, sectionFindings]) => {
                const isOpen = expandedSections.has(section);
                const worstSeverity = sectionFindings.some((f) => f.severity === "error") ? "error"
                  : sectionFindings.some((f) => f.severity === "warning") ? "warning" : "info";
                const sectionLabel = SECTION_LABELS_MAP[section] ?? section;
                const borderColor = worstSeverity === "error" ? "border-red-200"
                  : worstSeverity === "warning" ? "border-amber-200" : "border-[#93C5FD]";
                const headerColor = worstSeverity === "error"
                  ? "bg-red-50 text-red-800 hover:bg-red-100"
                  : worstSeverity === "warning"
                  ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : "bg-[#EFF6FF] text-[#1B5EA8] hover:bg-[#DBEAFE]";

                return (
                  <div key={section} className={`rounded-xl border overflow-hidden ${borderColor}`}>
                    <button
                      onClick={() => toggleSection(section)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors ${headerColor}`}
                    >
                      <span className="flex items-center gap-2">
                        <SeverityIcon severity={worstSeverity} />
                        {sectionLabel}
                        <span className="font-normal opacity-60 text-xs">
                          · {sectionFindings.length} {sectionFindings.length === 1 ? "Problem" : "Probleme"}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Link
                          href={`/brain/${section.toLowerCase()}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs underline opacity-60 hover:opacity-100"
                        >
                          Bearbeiten
                        </Link>
                        {isOpen
                          ? <ChevronUp className="w-3.5 h-3.5 opacity-50" />
                          : <ChevronDown className="w-3.5 h-3.5 opacity-50" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-gray-100">
                        {sectionFindings.map((f, idx) => (
                          <div key={idx} className="px-4 py-3 bg-white">
                            {f.title && (
                              <div className="text-sm font-medium text-gray-900 mb-0.5">{f.title}</div>
                            )}
                            <div className="text-sm text-gray-500">{f.message}</div>
                            {f.suggestion && (
                              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                <span className="font-medium text-gray-600">Vorschlag: </span>
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
          Noch keine Analyse durchgeführt.{" "}
          <button onClick={onRun} className="text-[#1B7FD4] hover:underline font-medium">
            Jetzt starten
          </button>
        </div>
      )}
    </div>
  );
}

// ── Global upload ─────────────────────────────────────────────────────────────

interface UploadProgress {
  step: number;
  total: number;
  label: string;
  doneCount: number;
}

function GlobalUploadCard({ onDone }: { onDone: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<{ sectionsUpdated: string[]; totalFilled: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setState("loading");
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/global", { method: "POST", body: formData });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Upload fehlgeschlagen.");
        setState("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              step?: number;
              total?: number;
              label?: string;
              filledCount?: number;
              sectionsUpdated?: string[];
              totalFilled?: number;
              error?: string;
            };

            if (parsed.error) {
              setError(parsed.error);
              setState("error");
              break;
            }

            if (parsed.type === "progress" && parsed.step && parsed.total && parsed.label) {
              setProgress((prev) => ({
                step: parsed.step!,
                total: parsed.total!,
                label: parsed.label!,
                doneCount: prev?.doneCount ?? 0,
              }));
            }

            if (parsed.type === "section_done") {
              setProgress((prev) => prev ? { ...prev, doneCount: (prev.doneCount ?? 0) + 1 } : null);
            }

            if (parsed.type === "done") {
              setResult({ sectionsUpdated: parsed.sectionsUpdated ?? [], totalFilled: parsed.totalFilled ?? 0 });
              setState("done");
              setTimeout(onDone, 2000);
            }
          } catch { /* ignore malformed SSE */ }
        }
      }
    } catch {
      setError("Netzwerkfehler.");
      setState("error");
    }
  }

  const progressPct = progress ? Math.round((progress.doneCount / progress.total) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-[#E8956D] to-[#1B7FD4] rounded-2xl p-5 shadow-sm">
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.html,.htm,.rtf,.odt,.odp,.ods" onChange={handleFile} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm mb-0.5">Alles auf einmal befüllen</div>
          {state === "idle" && (
            <div className="text-xs text-white/70 leading-relaxed">
              Dokument hochladen — alle 10 Bereiche werden automatisch aus der Datei befüllt.
            </div>
          )}
          {state === "loading" && progress && (
            <div className="mt-2 space-y-1.5">
              <div className="text-xs text-white/90">
                Bereich {progress.step} von {progress.total}: <span className="font-medium">{progress.label}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-xs text-white/60">{progress.doneCount} von {progress.total} Bereichen abgeschlossen</div>
            </div>
          )}
          {state === "loading" && !progress && (
            <div className="text-xs text-white/70 mt-1">Dokument wird verarbeitet…</div>
          )}
          {state === "done" && result && (
            <div className="mt-2 text-xs text-white/90 font-medium">
              {result.sectionsUpdated.length} Bereiche aktualisiert · {result.totalFilled} Felder befüllt
            </div>
          )}
          {state === "error" && (
            <div className="mt-2 text-xs text-red-200">{error}</div>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={state === "loading"}
          className="shrink-0 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
        >
          {state === "loading" ? (
            <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysiert…</>
          ) : state === "done" ? (
            <><CheckCircle2 className="w-4 h-4" /> Fertig</>
          ) : (
            <><Paperclip className="w-4 h-4" /> Dokument hochladen</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({ userName }: { userName: string }) {
  const router = useRouter();
  const [brain, setBrain] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningQualityCheck, setRunningQualityCheck] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const closeResetDialog = useCallback(() => setShowResetConfirm(false), []);
  useEffect(() => {
    if (!showResetConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeResetDialog(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResetConfirm, closeResetDialog]);

  useEffect(() => {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data: BrainData) => {
        setBrain(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleQualityCheck() {
    setRunningQualityCheck(true);
    try {
      const res = await fetch("/api/brain/quality-check", { method: "POST" });
      if (res.status === 429) {
        alert("Bitte warte kurz — du hast die Qualitätsprüfung zu oft hintereinander aufgerufen. Versuche es in einer Minute erneut.");
        return;
      }
      if (!res.ok) return;
      const data = await res.json() as { findings: QualityFinding[]; score: number };
      if (!Array.isArray(data.findings)) return;
      setBrain((prev) => prev ? { ...prev, qualityCheck: { ...data, checkedAt: new Date().toISOString() } } : prev);
    } catch {
      // network error — silent
    } finally {
      setRunningQualityCheck(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/brain", { method: "DELETE" });
      const fresh = await fetch("/api/brain").then((r) => r.json()) as BrainData;
      setBrain(fresh);
      setShowResetConfirm(false);
      router.refresh();
      window.dispatchEvent(new CustomEvent("brain-updated"));
    } catch {
      // silent
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-7 h-7 border-[3px] border-[#1B7FD4] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        Fehler beim Laden. Bitte Seite neu laden.
      </div>
    );
  }

  const overallPercent = Math.round(brain.completionScore * 100);
  const completedSections = brain.sections.filter((s) => s.status === "COMPLETE").length;
  const nextSection = brain.sections.find((s) => s.status !== "COMPLETE");
  const isNew = overallPercent === 0;

  if (isNew) {
    return (
      <div className="space-y-8">
        {/* Hero */}
        <div className="relative bg-gradient-to-b from-[#E8956D] to-[#1B7FD4] rounded-2xl p-10 text-white shadow-lg overflow-hidden">
          <BrainLogo variant="white" id="hero" className="absolute right-6 top-1/2 -translate-y-1/2 h-48 w-auto opacity-10 pointer-events-none hidden md:block" />
          <div className="text-sm text-white/60 font-medium mb-3">AI Asset Factory Brain</div>
          <h1 className="text-5xl font-black leading-none mb-4">
            Willkommen,<br />{userName.split(" ")[0]}
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-8 max-w-lg">
            Strukturieren Sie das Wissen Ihres Unternehmens, damit KI-Tools konsistente,
            markengerechte Inhalte erstellen können. Füllen Sie 10 Bereiche aus und
            generieren Sie automatisch Ihre persönliche Wissensbasis.
          </p>
          <Link
            href={`/brain/${SECTION_CONFIGS[0].type.toLowerCase()}`}
            className="hero-cta-btn inline-flex items-center gap-2 bg-white text-[#1B5EA8] font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition shadow-sm uppercase tracking-wide"
          >
            Jetzt starten
            <PhosphorArrowCircleRight className="w-5 h-5" />
          </Link>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200 inline-block" />
            So funktioniert es
            <span className="flex-1 h-px bg-gray-100 inline-block" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: PenLine, step: "01", title: "Wissen eingeben",
                desc: "Füllen Sie 10 strukturierte Bereiche zu Ihrem Unternehmen, Produkten und Zielgruppen aus.",
              },
              {
                icon: Zap, step: "02", title: "KI generiert Markdown",
                desc: "Jeder ausgefüllte Bereich wird automatisch in ein sauberes Markdown-Dokument umgewandelt.",
              },
              {
                icon: Rocket, step: "03", title: "Content erstellen",
                desc: "Übergeben Sie die Wissensbasis an Ihre KI-Tools für konsistente, markengerechte Texte.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#1B7FD4]" />
                  </div>
                  <span className="text-2xl font-black text-gray-100 font-mono leading-none">{item.step}</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1.5">{item.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section overview */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-200 inline-block" />
            Ihre 10 Bereiche
            <span className="flex-1 h-px bg-gray-100 inline-block" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SECTION_CONFIGS.map((config, i) => (
              <Link
                key={config.type}
                href={`/brain/${config.type.toLowerCase()}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 border-l-2 border-l-gray-200 px-4 py-3 hover:border-[#93C5FD] hover:border-l-[#1B7FD4] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <span className="text-xs font-mono text-gray-300 w-5 group-hover:text-[#5AABF0] transition">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#EFF6FF] transition">
                  <SectionIcon name={config.icon} className="w-4 h-4 text-gray-400 group-hover:text-[#1B7FD4] transition" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#1569B8] transition flex-1">
                  {config.label}
                </span>
                <PhosphorArrowCircleRight className="w-4 h-4 text-gray-300 group-hover:text-[#5AABF0] transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeResetDialog(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <h2 id="reset-dialog-title" className="text-base font-semibold text-gray-900 mb-1">Brain zurücksetzen?</h2>
            <p className="text-sm text-gray-500 mb-5">Alle eingegebenen Daten, Wissensdokumente und Qualitätsprüfungen werden unwiderruflich gelöscht.</p>
            <div className="flex gap-3">
              <button
                onClick={closeResetDialog}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={() => void handleReset()}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-60"
              >
                {resetting ? "Wird gelöscht…" : "Zurücksetzen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Asset Factory Brain</h1>
          <p className="text-sm text-gray-500 mt-1">Willkommen zurück, {userName.split(" ")[0]}</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="text-xs text-gray-400 hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          Brain zurücksetzen
        </button>
      </div>

      {/* Global upload + knowledge base row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlobalUploadCard onDone={() => {
          fetch("/api/brain").then((r) => r.json()).then((data: BrainData) => {
            setBrain(data);
            router.refresh();
            window.dispatchEvent(new CustomEvent("brain-updated"));
          }).catch(() => {});
        }} />
        <Link
          href="/knowledge"
          className="bg-gradient-to-br from-[#E8956D] to-[#1B7FD4] rounded-2xl p-5 text-white shadow-sm hover:shadow-md transition-all group flex items-center justify-between gap-4"
        >
          <div>
            <div className="font-semibold text-sm mb-0.5">Wissensbasis ansehen</div>
            <div className="text-white/75 text-xs leading-relaxed">Alle generierten Markdown-Dokumente</div>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Nudge banner */}
      {overallPercent > 0 && overallPercent < 100 && nextSection && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#1e3a5f]">
              {10 - completedSections} {10 - completedSections === 1 ? "Bereich fehlt" : "Bereiche fehlen"} noch
            </div>
            <div className="text-xs text-[#1B7FD4] mt-0.5">
              Als nächstes:{" "}
              <span className="font-medium text-[#1569B8]">
                {SECTION_CONFIGS.find((c) => c.type === nextSection.sectionType)?.label}
              </span>
            </div>
          </div>
          <Link
            href={`/brain/${nextSection.sectionType.toLowerCase()}`}
            className="shrink-0 inline-flex items-center gap-2 bg-[#1B7FD4] hover:bg-[#1569B8] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            Weiter
            <PhosphorArrowCircleRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Sections grid */}
      <div>
        <SectionDivider label="Bereiche" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {SECTION_CONFIGS.map((config) => {
            const section = brain.sections.find((s) => s.sectionType === config.type);
            const status = section?.status ?? "OPEN";
            const score = section?.completionScore ?? 0;
            const answers = section?.answers ?? {};
            const barColor = STATUS_BAR_COLORS[status] ?? "bg-gray-200";

            const firstMissing = config.questions.find(
              (q) => !answers[q.key] || answers[q.key].trim().length === 0
            );

            return (
              <Link
                key={config.type}
                href={`/brain/${config.type.toLowerCase()}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#93C5FD] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#EFF6FF] transition shrink-0">
                    <SectionIcon name={config.icon} className="w-4 h-4 text-gray-400 group-hover:text-[#1B7FD4] transition" />
                  </div>
                  <span className="font-medium text-gray-800 text-sm group-hover:text-[#1569B8] transition leading-tight">
                    {config.label}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div />
                  {status !== "COMPLETE" && firstMissing && (
                    <div className="text-xs text-gray-400 truncate max-w-[120px] text-right" title={firstMissing.label}>
                      Fehlt: <span className="text-gray-500">{firstMissing.label.split("?")[0].split(" ").slice(-3).join(" ")}…</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quality check — secondary, below sections */}
      <QualityCheckPanel
        qualityCheck={brain.qualityCheck}
        running={runningQualityCheck}
        onRun={handleQualityCheck}
      />

    </div>
  );
}
