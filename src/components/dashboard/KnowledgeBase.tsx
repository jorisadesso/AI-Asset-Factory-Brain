"use client";

import { useEffect, useState } from "react";
import type { SectionType } from "@/types";
import { SECTION_CONFIGS } from "@/types";

interface KnowledgeDoc {
  id: string;
  fileName: string;
  content: string;
  sectionType: string;
  version: number;
  updatedAt: string;
}

const SECTION_LABEL = Object.fromEntries(SECTION_CONFIGS.map((c) => [c.type, c.label]));
const SECTION_ICON: Record<string, string> = {
  Building2: "🏢", Package: "📦", Users: "👥", MessageSquare: "💬",
  Megaphone: "📢", TrendingUp: "📈", Shield: "🛡️", FileText: "📄",
  Image: "🖼️", Brain: "🧠",
};

function getIcon(sectionType: string): string {
  const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
  return config ? (SECTION_ICON[config.icon] ?? "📄") : "📄";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fileSizeLabel(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

// Minimal markdown → HTML for the patterns our generator produces
function renderMarkdown(md: string): string {
  return md
    // Fenced code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-2 first:mt-0">$1</h1>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-gray-800 mt-5 mb-1.5 border-b border-gray-100 pb-1">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-gray-700 mt-3 mb-1">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-700">$1</em>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-gray-200 my-4"/>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-200 pl-4 text-gray-500 italic my-2">$1</blockquote>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    // Blank lines → paragraph breaks
    .replace(/\n\n+/g, '</p><p class="text-sm text-gray-600 my-1.5">')
    // Remaining newlines
    .replace(/\n/g, "<br/>");
}

export function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeDoc | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  useEffect(() => {
    fetch("/api/brain/knowledge")
      .then((r) => r.json())
      .then((data: KnowledgeDoc[]) => {
        setDocs(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleDownloadSingle(doc: KnowledgeDoc) {
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wissensbasis</h1>
          <p className="text-sm text-gray-500 mt-1">
            {docs.length > 0
              ? `${docs.length} Dokument${docs.length !== 1 ? "e" : ""} · generierte Markdown-Dateien`
              : "Generierte Markdown-Dokumente für KI-gestützte Content-Erstellung"}
          </p>
        </div>
        {docs.length > 0 && (
          <a
            href="/api/brain/knowledge/download-zip"
            download
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            <span>↓</span>
            <span>ZIP herunterladen</span>
            <span className="text-blue-200 text-xs">({docs.length} Dateien)</span>
          </a>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Wissensbasis noch leer
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Füllen Sie die Bereiche im Onboarding-Wizard aus, um automatisch Markdown-Dokumente zu generieren.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* File list */}
          <div className="space-y-1.5">
            {SECTION_CONFIGS.map((config) => {
              const doc = docs.find((d) => d.sectionType === config.type);
              if (!doc) {
                return (
                  <div
                    key={config.type}
                    className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-gray-200 opacity-40 cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{SECTION_ICON[config.icon]}</span>
                      <span className="text-sm text-gray-400">{config.label}</span>
                    </div>
                    <div className="text-xs text-gray-300 mt-0.5 ml-6">Noch nicht ausgefüllt</div>
                  </div>
                );
              }
              return (
                <button
                  key={doc.id}
                  onClick={() => { setSelected(doc); setViewMode("rendered"); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition group ${
                    selected?.id === doc.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{getIcon(doc.sectionType)}</span>
                      <span className={`text-sm font-medium truncate ${selected?.id === doc.id ? "text-blue-900" : "text-gray-800"}`}>
                        {SECTION_LABEL[doc.sectionType as SectionType] ?? doc.sectionType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">v{doc.version}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 ml-6 flex items-center gap-2">
                    <span>{wordCount(doc.content)} Wörter</span>
                    <span>·</span>
                    <span>{fileSizeLabel(doc.content)}</span>
                    <span>·</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString("de-DE")}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview panel */}
          {selected && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{getIcon(selected.sectionType)}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {SECTION_LABEL[selected.sectionType as SectionType] ?? selected.sectionType}
                    </div>
                    <div className="text-xs text-gray-400">{selected.fileName} · {fileSizeLabel(selected.content)} · {wordCount(selected.content)} Wörter</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* View toggle */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button
                      onClick={() => setViewMode("rendered")}
                      className={`px-2.5 py-1.5 transition ${viewMode === "rendered" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      Vorschau
                    </button>
                    <button
                      onClick={() => setViewMode("raw")}
                      className={`px-2.5 py-1.5 transition ${viewMode === "raw" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      Markdown
                    </button>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(selected)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                  >
                    ↓ .md
                  </button>
                </div>
              </div>

              {/* Content */}
              {viewMode === "rendered" ? (
                <div
                  className="px-6 py-5 overflow-auto max-h-[calc(100vh-18rem)] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-gray-600 my-1.5">${renderMarkdown(selected.content)}</p>` }}
                />
              ) : (
                <pre className="px-6 py-5 text-xs text-gray-600 bg-gray-50 overflow-auto max-h-[calc(100vh-18rem)] font-mono whitespace-pre-wrap">
                  {selected.content}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
