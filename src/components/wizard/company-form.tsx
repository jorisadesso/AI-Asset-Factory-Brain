"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { FieldGroup } from "./field-group";
import { ExampleHint } from "@/components/ui/example-hint";
import { DocumentUploader } from "@/components/upload/document-uploader";
import { useToast } from "@/components/ui/toast";
import { Save, Upload } from "lucide-react";
import { CompanyData } from "@/schemas/sections";

interface CompanyFormProps {
  initialData?: Partial<CompanyData>;
  onSave: (data: CompanyData) => Promise<void>;
}

export function CompanyForm({ initialData, onSave }: CompanyFormProps) {
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CompanyData>({
    name: "",
    description: "",
    mission: "",
    vision: "",
    values: [],
    ...initialData,
  });

  useEffect(() => {
    if (initialData) setData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const set = (field: keyof CompanyData, value: unknown) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!data.name.trim()) {
      toast("Bitte geben Sie den Unternehmensnamen ein.", "error");
      return;
    }
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

  const handleDocumentConfirm = async (extracted: Record<string, unknown>) => {
    const merged = { ...data, ...(extracted as Partial<CompanyData>) };
    setData(merged);
    setShowUpload(false);
    toast("Informationen aus Dokument übernommen. Bitte prüfen und speichern.", "info");
  };

  return (
    <div className="space-y-6">
      <FieldGroup label="Unternehmensname" required>
        <Input
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="z. B. Muster GmbH"
        />
        <ExampleHint examples={["Muster GmbH", "Example Digital Solutions AG"]} />
      </FieldGroup>

      <FieldGroup label="Unternehmensbeschreibung" description="2–5 Sätze über Ihr Unternehmen">
        <Textarea
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Beschreiben Sie Ihr Unternehmen in wenigen Sätzen..."
          rows={4}
        />
        <ExampleHint
          examples={[
            "Wir entwickeln Softwarelösungen für mittelständische Unternehmen...",
            "Wir sind eine regionale Immobiliengesellschaft...",
          ]}
        />
      </FieldGroup>

      <FieldGroup label="Mission" description="Was ist der Zweck Ihres Unternehmens?">
        <Textarea
          value={data.mission}
          onChange={(e) => set("mission", e.target.value)}
          placeholder="Unsere Mission ist es, ..."
          rows={3}
        />
        <ExampleHint examples={["Wir machen Marketing für Unternehmen einfacher und effizienter."]} />
      </FieldGroup>

      <FieldGroup label="Vision" description="Wo wollen Sie in Zukunft stehen?">
        <Textarea
          value={data.vision}
          onChange={(e) => set("vision", e.target.value)}
          placeholder="Unsere Vision ist es, ..."
          rows={3}
        />
        <ExampleHint examples={["Wir wollen die führende Plattform für automatisiertes B2B-Marketing werden."]} />
      </FieldGroup>

      <FieldGroup label="Unternehmenswerte" description="3–5 zentrale Werte Ihres Unternehmens">
        <TagInput
          value={data.values}
          onChange={(v) => set("values", v)}
          placeholder="Wert eingeben und Enter drücken"
        />
        <ExampleHint examples={["Innovation, Transparenz, Kundennähe, Nachhaltigkeit"]} />
      </FieldGroup>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        {showUpload ? (
          <DocumentUploader
            sectionKey="company"
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
