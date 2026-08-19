"use client";

import { useEffect, useState } from "react";
import { Upload, Globe, Download } from "lucide-react";
import { SECTION_CONFIGS } from "@/types";

interface UploadEntry {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  hasFile: boolean;
  sectionsUpdated: string[];
  filledCount: number;
  sectionType: string | null;
  global: boolean;
  uploadedAt: string;
}

const SECTION_LABEL = Object.fromEntries(SECTION_CONFIGS.map((c) => [c.type, c.label]));

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocCard({ entry }: { entry: UploadEntry }) {
  const date = new Date(entry.uploadedAt);
  const dateStr = date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const sectionLabel = entry.global
    ? null
    : entry.sectionType
      ? (SECTION_LABEL[entry.sectionType] ?? entry.sectionType)
      : null;

  const meta = [
    entry.fileSize !== null ? formatBytes(entry.fileSize) : null,
    `${dateStr} · ${timeStr}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3.5 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{entry.fileName}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{meta}</p>
        <div className="mt-1">
          {entry.global ? (
            <span className="inline-flex items-center gap-1 text-xs text-[#1B7FD4]">
              <Globe className="w-3 h-3" /> Alle Bereiche
            </span>
          ) : sectionLabel ? (
            <span className="text-xs text-gray-400">{sectionLabel}</span>
          ) : null}
        </div>
      </div>

      {entry.hasFile && (
        <a
          href={`/api/brain/uploads/${entry.id}/download`}
          download={entry.fileName}
          className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-[#1B7FD4] hover:bg-[#EFF6FF] transition"
          aria-label={`${entry.fileName} herunterladen`}
          title="Herunterladen"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

export function UploadLibrary() {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brain/uploads")
      .then((r) => r.json())
      .then((data: UploadEntry[]) => setUploads(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin w-6 h-6 border-[3px] border-[#1B7FD4] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hochgeladene Dokumente</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {uploads.length > 0
              ? `${uploads.length} Dokument${uploads.length !== 1 ? "e" : ""} hochgeladen`
              : "Noch keine Dokumente hochgeladen"}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
          <Upload className="w-4 h-4 text-[#1B7FD4]" />
        </div>
      </div>

      {uploads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">
            Laden Sie über das Dashboard oder in einem Bereich ein Dokument hoch,<br />
            um es hier zu sehen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {uploads.map((u) => (
            <DocCard key={u.id} entry={u} />
          ))}
        </div>
      )}
    </div>
  );
}
