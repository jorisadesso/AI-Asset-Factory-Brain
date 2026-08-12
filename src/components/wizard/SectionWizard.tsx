"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SectionConfig, SectionType, ExtractedInfo } from "@/types";
import { SECTION_CONFIGS } from "@/types";
import { DocumentUploader } from "@/components/upload/DocumentUploader";
import { ProductCategoriesSection } from "@/components/sections/ProductCategoriesSection";
import { TargetGroupsSection } from "@/components/sections/TargetGroupsSection";

interface SectionWizardProps {
  config: SectionConfig;
}

const SECTION_ICONS: Record<string, string> = {
  Building2: "🏢", Package: "📦", Users: "👥", MessageSquare: "💬",
  Megaphone: "📢", TrendingUp: "📈", Shield: "🛡️", FileText: "📄",
  Image: "🖼️", Brain: "🧠",
};

const SECTION_HINTS: Partial<Record<string, string>> = {
  COMPANY: "Grundlage für alle KI-Inhalte — ohne klares Unternehmensprofil entstehen generische Texte ohne Wiedererkennungswert.",
  PRODUCT_CATEGORIES: "KI-Tools brauchen genaue Produktbeschreibungen, Features und USPs, um überzeugende Produkttexte zu schreiben.",
  TARGET_GROUPS: "Wer die Zielgruppe nicht kennt, trifft den falschen Ton. Personas helfen der KI, die richtige Sprache zu wählen.",
  BRAND_LANGUAGE: "Tonalität und Stilregeln verhindern, dass die KI einen beliebigen Standardton verwendet — legen Sie Ihren fest.",
  MARKETING_CONTENT: "Content-Ziele und Themen geben der KI eine klare Richtung, welche Inhalte erstellt werden sollen.",
  SALES: "Vertriebsargumente und Referenzen helfen der KI, kaufüberzeugende Texte zu schreiben statt allgemeiner Beschreibungen.",
  LEGAL_COMPLIANCE: "Ohne Compliance-Vorgaben kann die KI unbeabsichtigt rechtlich problematische Formulierungen verwenden.",
  EXISTING_CONTENT: "Gute Beispiele aus der Vergangenheit zeigen der KI Ihren bevorzugten Schreibstil und vermeiden Stilbrüche.",
  VISUAL_GUIDELINES: "Bildsprache-Regeln helfen der KI bei der Beschreibung und Auswahl von Bildmotiven und Designelementen.",
  AI_RULES: "Explizite KI-Verarbeitungsregeln stellen sicher, dass die KI immer im Sinne Ihres Unternehmens handelt.",
};

export function SectionWizard({ config }: SectionWizardProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [applyingExtraction, setApplyingExtraction] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = JSON.stringify(answers) !== JSON.stringify(savedAnswers);
  const isDynamic =
    config.type === "PRODUCT_CATEGORIES" || config.type === "TARGET_GROUPS";

  const fetchBrain = useCallback(async () => {
    try {
      const res = await fetch("/api/brain");
      const data = await res.json() as {
        sections: Array<{ sectionType: string; answers: Record<string, string> }>;
      };
      const section = data.sections.find((s) => s.sectionType === config.type);
      if (section?.answers) {
        setAnswers(section.answers);
        setSavedAnswers(section.answers);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [config.type]);

  useEffect(() => {
    void fetchBrain();
  }, [fetchBrain]);

  // Cmd/Ctrl+Enter to save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function handleSave(): Promise<boolean> {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/brain/sections/${config.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) return false;
      setSavedAnswers({ ...answers });
      setSaved(true);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndNavigate(href: string) {
    if (isDirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    router.push(href);
  }

  function handleExtractionComplete(info: ExtractedInfo) {
    setExtractedInfo(info);
  }

  function handleApplyExtraction() {
    if (!extractedInfo) return;
    setApplyingExtraction(true);

    const newAnswers = { ...answers };
    for (const [key, value] of Object.entries(extractedInfo.data)) {
      if (typeof value === "string" && value.trim()) {
        newAnswers[key] = value;
      } else if (Array.isArray(value)) {
        newAnswers[key] = value.join(", ");
      }
    }
    setAnswers(newAnswers);
    setExtractedInfo(null);
    setApplyingExtraction(false);
  }

  const currentIndex = SECTION_CONFIGS.findIndex((c) => c.type === config.type);
  const prevSection = SECTION_CONFIGS[currentIndex - 1];
  const nextSection = SECTION_CONFIGS[currentIndex + 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{config.label}</span>
        <span className="ml-auto text-xs">
          {currentIndex + 1} / {SECTION_CONFIGS.length}
        </span>
      </div>

      {/* Section progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / SECTION_CONFIGS.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
            {SECTION_ICONS[config.icon]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{config.label}</h1>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
      </div>

      {/* "Why it matters" hint */}
      {SECTION_HINTS[config.type] && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>{SECTION_HINTS[config.type]}</span>
        </div>
      )}

      {/* Document upload */}
      {config.hasUpload && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Dokument hochladen (optional)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Laden Sie ein Dokument hoch, um Informationen automatisch zu extrahieren.
            Das Originaldokument wird nach der Verarbeitung sofort gelöscht.
          </p>
          <DocumentUploader
            sectionType={config.type}
            onExtractionComplete={handleExtractionComplete}
          />
        </div>
      )}

      {/* Extracted info review */}
      {extractedInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-blue-900">KI-Extraktion abgeschlossen</h3>
              <p className="text-sm text-blue-700 mt-0.5">
                Konfidenz:{" "}
                <span className="font-medium">
                  {extractedInfo.confidence === "high"
                    ? "Hoch ✓"
                    : extractedInfo.confidence === "medium"
                      ? "Mittel"
                      : "Niedrig – bitte prüfen"}
                </span>
              </p>
            </div>
            <button
              onClick={() => setExtractedInfo(null)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              ✕ Verwerfen
            </button>
          </div>

          {extractedInfo.warnings.length > 0 && (
            <div className="space-y-1 mb-4">
              {extractedInfo.warnings.map((w, i) => (
                <div key={i} className="text-xs text-blue-600 bg-blue-100 rounded px-3 py-1">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl p-4 mb-4 text-sm font-mono text-gray-700 max-h-40 overflow-y-auto">
            <pre>{JSON.stringify(extractedInfo.data, null, 2)}</pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApplyExtraction}
              disabled={applyingExtraction}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Auf Felder anwenden
            </button>
            <button
              onClick={() => setExtractedInfo(null)}
              className="text-blue-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-100 transition"
            >
              Manuell eingeben
            </button>
          </div>
        </div>
      )}

      {/* Dynamic sections */}
      {config.type === "PRODUCT_CATEGORIES" && (
        <ProductCategoriesSection />
      )}

      {config.type === "TARGET_GROUPS" && (
        <TargetGroupsSection />
      )}

      {/* Standard questions */}
      {!isDynamic && config.questions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900">Fragen</h2>
          {config.questions.map((question) => (
            <div key={question.key}>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                {question.label}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {question.examples && question.examples.length > 0 && (
                <div className="mb-2 space-y-1">
                  {question.examples.slice(0, 1).map((ex, i) => (
                    <p key={i} className="text-xs text-gray-400 italic">
                      Beispiel: {ex}
                    </p>
                  ))}
                </div>
              )}

              {question.type === "textarea" ? (
                <textarea
                  value={answers[question.key] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.key]: e.target.value,
                    }))
                  }
                  placeholder={question.placeholder}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm resize-none"
                />
              ) : question.type === "list" ? (
                <div>
                  <input
                    type="text"
                    value={answers[question.key] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.key]: e.target.value,
                      }))
                    }
                    placeholder={question.placeholder ?? "Kommagetrennte Liste"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                  {answers[question.key] && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {answers[question.key]
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((item, i) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[question.key] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.key]: e.target.value,
                    }))
                  }
                  placeholder={question.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              )}
            </div>
          ))}

          {/* Save button */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-sm font-medium">
              {saved && <span className="text-green-600">✓ Gespeichert</span>}
              {isDirty && !saved && (
                <span className="text-gray-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  Ungespeicherte Änderungen · <kbd className="font-mono bg-gray-100 px-1 rounded text-gray-500">⌘ Enter</kbd>
                </span>
              )}
            </div>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !isDirty}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={() => void handleSaveAndNavigate(
            prevSection ? `/brain/${prevSection.type.toLowerCase()}` : "/dashboard"
          )}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          ← {prevSection ? prevSection.label : "Dashboard"}
        </button>

        <div className="flex items-center gap-2">
          {isDirty && nextSection && (
            <span className="text-xs text-gray-400">Speichert automatisch</span>
          )}
          <button
            onClick={() => void handleSaveAndNavigate(
              nextSection ? `/brain/${nextSection.type.toLowerCase()}` : "/dashboard"
            )}
            disabled={saving}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60 ${
              nextSection
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {saving
              ? "Wird gespeichert..."
              : nextSection
                ? `${nextSection.label} →`
                : "Abschließen ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
