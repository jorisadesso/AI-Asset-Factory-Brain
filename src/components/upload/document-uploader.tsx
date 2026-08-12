"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionKey } from "@/types";

interface ExtractionResult {
  data: Record<string, unknown>;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

interface DocumentUploaderProps {
  sectionKey: SectionKey;
  onConfirm: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
}

type UploadState = "idle" | "uploading" | "extracted" | "error";

export function DocumentUploader({ sectionKey, onConfirm, onCancel }: DocumentUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [editedData, setEditedData] = useState<Record<string, unknown>>({});

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setState("uploading");
      setError("");
      setFilename(file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionKey", sectionKey);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Upload fehlgeschlagen");
        }

        setExtraction(json.extraction);
        setEditedData(json.extraction.data);
        setState("extracted");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        setState("error");
      }
    },
    [sectionKey]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
  });

  const handleConfirm = () => {
    onConfirm(editedData);
    setState("idle");
    setExtraction(null);
    setFilename("");
  };

  const handleReset = () => {
    setState("idle");
    setExtraction(null);
    setError("");
    setFilename("");
  };

  if (state === "extracted" && extraction) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Dokument analysiert: {filename}</p>
            {extraction.confidence === "low" && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Niedrige Konfidenz – bitte Ergebnisse prüfen
              </p>
            )}
          </div>
          <button onClick={handleReset} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {extraction.warnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            {extraction.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700">{w}</p>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 max-h-64 overflow-auto">
          <p className="text-xs font-medium text-slate-600 mb-2">Extrahierte Informationen (bearbeitbar):</p>
          <textarea
            className="w-full text-xs font-mono bg-transparent outline-none resize-none"
            rows={12}
            value={JSON.stringify(editedData, null, 2)}
            onChange={(e) => {
              try {
                setEditedData(JSON.parse(e.target.value));
              } catch {
                // Let user keep editing
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirm} variant="success" size="md">
            <CheckCircle className="h-4 w-4" />
            Informationen übernehmen
          </Button>
          <Button onClick={handleReset} variant="outline" size="md">
            Verwerfen
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" size="md">
              Abbrechen
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-violet-400 bg-violet-50"
            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50",
          state === "uploading" && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {state === "uploading" ? (
            <>
              <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Dokument wird analysiert…</p>
              <p className="text-xs text-slate-500">KI extrahiert relevante Informationen</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-violet-100 p-3">
                <Upload className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {isDragActive ? "Datei hier ablegen" : "Dokument hochladen"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOCX, PPTX, TXT, MD · max. {process.env.NEXT_PUBLIC_MAX_FILE_SIZE || 10} MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {state === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
