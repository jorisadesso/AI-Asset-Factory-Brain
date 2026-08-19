"use client";

import { useRef, useState } from "react";
import type { ExtractedInfo, SectionType } from "@/types";
import { Paperclip, XCircle, CheckCircle2 } from "lucide-react";

interface DocumentUploaderProps {
  sectionType: SectionType;
  onExtractionComplete: (info: ExtractedInfo) => void;
}

export function DocumentUploader({
  sectionType,
  onExtractionComplete,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function processFile(file: File) {
    setError(null);
    setStatus("Datei wird hochgeladen...");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionType", sectionType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as {
        success?: boolean;
        extractedInfo?: ExtractedInfo;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Upload fehlgeschlagen.");
        setStatus(null);
        return;
      }

      setStatus("Analyse abgeschlossen. Originaldatei wurde gelöscht.");
      if (data.extractedInfo) {
        onExtractionComplete(data.extractedInfo);
      }
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        } ${uploading ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.html,.htm,.rtf,.odt,.odp,.ods"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600">{status}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-1">
              <Paperclip className="w-5 h-5 text-[#1B7FD4]" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Datei hierher ziehen oder{" "}
              <span className="text-[#1B7FD4]">auswählen</span>
            </p>
            <p className="text-xs text-gray-400">PDF, DOCX, PPTX, TXT, Markdown · max. 100 MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {status && !uploading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {status}
        </div>
      )}
    </div>
  );
}
