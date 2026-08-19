"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle } from "lucide-react"; // CheckCircle used in footer done-state
import { SECTION_CONFIGS } from "@/types";

export interface CrossSectionEntry {
  sectionType: string;
  sectionLabel: string;
  answers: Record<string, string>;
}

interface CrossSectionModalProps {
  crossSections: CrossSectionEntry[];
  onClose: () => void;
  onApplied: () => void;
  /** All section types that were scanned (including those with no results) */
  checkedSectionTypes?: string[];
}

export function CrossSectionModal({ crossSections, onClose, onApplied, checkedSectionTypes }: CrossSectionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(crossSections.map((s) => s.sectionType))
  );
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState(false);

  function toggle(sectionType: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) next.delete(sectionType);
      else next.add(sectionType);
      return next;
    });
  }

  async function handleApply() {
    const toSave = crossSections.filter((s) => selected.has(s.sectionType));
    if (toSave.length === 0) { onClose(); return; }

    setSaving(true);
    setSaveError(false);
    try {
      const brainRes = await fetch("/api/brain");
      if (!brainRes.ok) throw new Error("Brain konnte nicht geladen werden.");
      const brain = await brainRes.json() as {
        sections: Array<{ sectionType: string; answers: Record<string, string> }>;
      };
      const existingMap = new Map(brain.sections.map((s) => [s.sectionType, s.answers ?? {}]));

      const results = await Promise.all(
        toSave.map(async (entry) => {
          const existing = existingMap.get(entry.sectionType) ?? {};
          const merged = { ...existing, ...entry.answers };
          const res = await fetch(`/api/brain/sections/${entry.sectionType}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: merged }),
          });
          return res.ok;
        })
      );

      if (results.some((ok) => !ok)) throw new Error("Einige Bereiche konnten nicht gespeichert werden.");

      setDone(true);
      window.dispatchEvent(new CustomEvent("brain-updated"));
      setTimeout(() => { onApplied(); }, 1200);
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Inhalte für andere Bereiche gefunden</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Wähle aus, in welche Bereiche der Inhalt übernommen werden soll.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100 ml-3 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections list — only sections with found content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {crossSections.map((entry) => {
            const sectionConfig = SECTION_CONFIGS.find((s) => s.type === entry.sectionType);
            const isSelected = selected.has(entry.sectionType);
            const filledAnswers = Object.entries(entry.answers).filter(([, value]) => value?.trim());
            if (filledAnswers.length === 0) return null;
            return (
              <button
                key={entry.sectionType}
                onClick={() => toggle(entry.sectionType)}
                className={`w-full text-left rounded-xl border-2 p-4 transition ${
                  isSelected
                    ? "border-[#1B7FD4] bg-[#EFF6FF]"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isSelected ? "text-[#1569B8]" : "text-gray-800"}`}>
                    {entry.sectionLabel}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                    isSelected ? "border-[#1B7FD4] bg-[#1B7FD4]" : "border-gray-300 bg-white"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {filledAnswers.map(([key, value]) => {
                    const question = sectionConfig?.questions.find((q) => q.key === key);
                    return (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500">{question?.label ?? key}</p>
                        <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            Speichern fehlgeschlagen. Bitte versuche es erneut.
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            Überspringen
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set(crossSections.map((s) => s.sectionType)))}
              className="text-xs text-[#1B7FD4] hover:text-[#1569B8] transition"
            >
              Alle auswählen
            </button>
            <button
              onClick={handleApply}
              disabled={saving || done || selected.size === 0}
              className="flex items-center gap-2 bg-[#1B7FD4] hover:bg-[#1569B8] text-white text-sm font-medium px-5 py-2 rounded-xl transition disabled:opacity-60"
            >
              {done ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Übernommen
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird gespeichert…
                </>
              ) : (
                `${selected.size} Bereich${selected.size !== 1 ? "e" : ""} übernehmen`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
