"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { FieldGroup } from "./field-group";
import { ExampleHint } from "@/components/ui/example-hint";
import { DocumentUploader } from "@/components/upload/document-uploader";
import { useToast } from "@/components/ui/toast";
import { Save, Upload } from "lucide-react";
import { SectionKey } from "@/types";

interface FieldConfig {
  key: string;
  label: string;
  description?: string;
  type: "text" | "tags";
  placeholder: string;
  examples: string[];
  rows?: number;
}

interface GenericSectionFormProps {
  sectionKey: SectionKey;
  fields: FieldConfig[];
  initialData?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export function GenericSectionForm({ sectionKey, fields, initialData, onSave }: GenericSectionFormProps) {
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      init[f.key] = f.type === "tags" ? [] : "";
    }
    return { ...init, ...(initialData || {}) };
  });

  useEffect(() => {
    if (initialData) {
      setData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const set = (key: string, value: unknown) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
      toast("Änderungen gespeichert.", "success");
    } catch {
      toast("Speichern fehlgeschlagen.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentConfirm = (extracted: Record<string, unknown>) => {
    setData((prev) => ({ ...prev, ...extracted }));
    setShowUpload(false);
    toast("Informationen aus Dokument übernommen. Bitte prüfen und speichern.", "info");
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <FieldGroup key={field.key} label={field.label} description={field.description}>
          {field.type === "tags" ? (
            <TagInput
              value={(data[field.key] as string[]) || []}
              onChange={(v) => set(field.key, v)}
              placeholder={field.placeholder}
            />
          ) : (
            <Textarea
              value={(data[field.key] as string) || ""}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
            />
          )}
          <ExampleHint examples={field.examples} />
        </FieldGroup>
      ))}

      <div className="border-t border-slate-100 pt-4 space-y-3">
        {showUpload ? (
          <DocumentUploader
            sectionKey={sectionKey}
            onConfirm={handleDocumentConfirm}
            onCancel={() => setShowUpload(false)}
          />
        ) : (
          <Button variant="outline" size="md" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            Dokument hochladen & analysieren
          </Button>
        )}

        <Button onClick={handleSave} loading={saving} size="md">
          <Save className="h-4 w-4" />
          Speichern
        </Button>
      </div>
    </div>
  );
}
