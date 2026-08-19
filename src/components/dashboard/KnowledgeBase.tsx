"use client";

import { useEffect, useRef, useState } from "react";
import type { SectionType } from "@/types";
import { SECTION_CONFIGS } from "@/types";
import {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
  Download, FileDown, Eye, Code2,
} from "lucide-react";

interface KnowledgeDoc {
  id: string;
  fileName: string;
  content: string;
  sectionType: string;
  version: number;
  updatedAt: string;
}

const SECTION_LABEL = Object.fromEntries(SECTION_CONFIGS.map((c) => [c.type, c.label]));

type LucideIcon = React.ComponentType<{ className?: string }>;
const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
};

function SectionIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = ICON_MAP[iconName] ?? FileText;
  return <Icon className={className ?? "w-4 h-4"} />;
}

function getIconName(sectionType: string): string {
  const config = SECTION_CONFIGS.find((c) => c.type === sectionType);
  return config?.icon ?? "FileText";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fileSizeLabel(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function renderMarkdown(md: string): string {
  return md
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:var(--surface-raised);padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;margin:8px 0"><code>$1</code></pre>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:20px 0 6px;padding:0">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);margin:16px 0 5px;border-bottom:1px solid var(--border);padding-bottom:4px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin:12px 0 4px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:var(--text-secondary)">$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin-left:16px;list-style-type:disc;color:var(--text-secondary);margin-bottom:2px">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:16px;list-style-type:decimal;color:var(--text-secondary);margin-bottom:2px">$1</li>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--text-muted);font-style:italic;margin:8px 0">$1</blockquote>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface-raised);color:var(--text-secondary);padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace">$1</code>')
    .replace(/\n\n+/g, '</p><p style="color:var(--text-secondary);font-size:0.875rem;margin:6px 0">')
    .replace(/\n/g, "<br/>");
}

export function KnowledgeBase() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeDoc | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const renderedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!renderedRef.current || !selected || viewMode !== "rendered") return;
    const el = renderedRef.current;
    import("dompurify").then(({ default: DOMPurify }) => {
      el.innerHTML = DOMPurify.sanitize(
        `<p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.6;margin:0">${renderMarkdown(selected.content)}</p>`
      );
    });
  }, [selected, viewMode]);

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
        <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Wissensbasis</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {docs.length > 0
              ? `${docs.length} Dokument${docs.length !== 1 ? "e" : ""} · generierte Markdown-Dateien`
              : "Generierte Markdown-Dokumente für KI-gestützte Content-Erstellung"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://adesso.mycontentbird.io"
            target="_blank"
            rel="noopener noreferrer"
            className="contentbird-btn flex items-center gap-2 border border-[var(--accent)] hover:bg-[var(--accent-light)] px-4 py-2 rounded-lg transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/contentbird.svg" alt="contentbird" className="h-5 w-auto" />
          </a>
          {docs.length > 0 && (
            <a
              href="/api/brain/knowledge/download-zip"
              download
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>ZIP herunterladen</span>
              <span className="text-white/60 text-xs">({docs.length} Dateien)</span>
            </a>
          )}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Wissensbasis noch leer
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
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
                    className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-[var(--border)] opacity-40 cursor-default"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-raised)] flex items-center justify-center shrink-0">
                        <SectionIcon iconName={config.icon} className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </div>
                      <span className="text-sm text-[var(--text-muted)]">{config.label}</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 ml-6">Noch nicht ausgefüllt</div>
                  </div>
                );
              }
              return (
                <button
                  key={doc.id}
                  onClick={() => { setSelected(doc); setViewMode("rendered"); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${
                    selected?.id === doc.id
                      ? "bg-[var(--accent-light)] border-[#93C5FD] shadow-sm"
                      : "bg-[var(--surface-card)] border-[var(--border)] hover:border-[#93C5FD] hover:shadow-sm hover:bg-[var(--accent-light)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selected?.id === doc.id ? "bg-[#DBEAFE]" : "bg-[var(--surface-raised)] group-hover:bg-[#DBEAFE]"
                      }`}>
                        <SectionIcon iconName={getIconName(doc.sectionType)} className={`w-3.5 h-3.5 transition-colors ${
                          selected?.id === doc.id ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent)]"
                        }`} />
                      </div>
                      <span className={`text-sm font-medium truncate transition-colors ${
                        selected?.id === doc.id ? "text-[var(--accent-text)]" : "text-[var(--text-primary)] group-hover:text-[var(--accent-text)]"
                      }`}>
                        {SECTION_LABEL[doc.sectionType as SectionType] ?? doc.sectionType}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 ml-[2.375rem] flex items-center gap-2">
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
            <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                    <SectionIcon iconName={getIconName(selected.sectionType)} className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] text-sm truncate">
                      {SECTION_LABEL[selected.sectionType as SectionType] ?? selected.sectionType}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{selected.fileName} · {fileSizeLabel(selected.content)} · {wordCount(selected.content)} Wörter</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* View toggle */}
                  <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
                    <button
                      onClick={() => setViewMode("rendered")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 transition ${viewMode === "rendered" ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)]"}`}
                    >
                      <Eye className="w-3 h-3" /> Vorschau
                    </button>
                    <button
                      onClick={() => setViewMode("raw")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 transition ${viewMode === "raw" ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--surface-raised)]"}`}
                    >
                      <Code2 className="w-3 h-3" /> Markdown
                    </button>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(selected)}
                    className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--accent-light)] transition"
                  >
                    <FileDown className="w-4 h-4" /> .md
                  </button>
                </div>
              </div>

              {/* Content */}
              {viewMode === "rendered" ? (
                <div
                  ref={renderedRef}
                  className="px-6 py-5 overflow-auto max-h-[calc(100vh-18rem)] text-sm leading-relaxed text-[var(--text-secondary)]"
                />
              ) : (
                <pre className="px-6 py-5 text-xs text-[var(--text-secondary)] bg-[var(--surface-page)] overflow-auto max-h-[calc(100vh-18rem)] font-mono whitespace-pre-wrap">
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
