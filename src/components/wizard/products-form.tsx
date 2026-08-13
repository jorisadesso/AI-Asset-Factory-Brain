"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { FieldGroup } from "./field-group";
import { ExampleHint } from "@/components/ui/example-hint";
import { DocumentUploader } from "@/components/upload/document-uploader";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { ProductCategoryData } from "@/schemas/sections";

interface ProductsFormProps {
  categories: ProductCategoryData[];
  onAdd: (cat: ProductCategoryData) => Promise<void>;
  onUpdate: (id: string, cat: ProductCategoryData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface CategoryWithId extends ProductCategoryData {
  id?: string;
}

const EMPTY_CATEGORY: ProductCategoryData = {
  name: "",
  description: "",
  features: [],
  usps: [],
};

export function ProductsForm({ categories, onAdd, onUpdate, onDelete }: ProductsFormProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState<ProductCategoryData>({ ...EMPTY_CATEGORY });
  const [showUpload, setShowUpload] = useState(false);

  const handleAdd = async () => {
    if (!newCat.name.trim()) {
      toast("Bitte einen Kategorienamen eingeben.", "error");
      return;
    }
    try {
      await onAdd(newCat);
      setNewCat({ ...EMPTY_CATEGORY });
      setAdding(false);
      toast("Kategorie hinzugefügt.", "success");
    } catch {
      toast("Fehler beim Hinzufügen.", "error");
    }
  };

  const handleDocumentConfirm = async (extracted: Record<string, unknown>) => {
    const cats = (extracted as { categories?: ProductCategoryData[] }).categories;
    if (cats && Array.isArray(cats)) {
      for (const cat of cats) {
        await onAdd(cat).catch(() => {});
      }
      toast(`${cats.length} Kategorie(n) aus Dokument übernommen.`, "success");
    }
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      {/* Existing categories */}
      {(categories as CategoryWithId[]).map((cat, i) => {
        const catId = cat.id || `cat-${i}`;
        const isExpanded = expanded === catId;

        return (
          <div key={catId} className="rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpanded(isExpanded ? null : catId)}
            >
              <div>
                <p className="font-medium text-slate-900">{cat.name || "Unbenannte Kategorie"}</p>
                {cat.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Kategorie löschen?")) onDelete(catId).then(() => toast("Gelöscht.", "success"));
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>

            {isExpanded && (
              <CategoryEditor
                cat={cat}
                onSave={(updated) => onUpdate(catId, updated).then(() => toast("Gespeichert.", "success"))}
              />
            )}
          </div>
        );
      })}

      {/* Add new category form */}
      {adding ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 space-y-4">
          <p className="font-medium text-slate-900">Neue Kategorie</p>
          <CategoryEditor
            cat={newCat}
            onSave={async (data) => { setNewCat(data); }}
            onChange={setNewCat}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAdd} size="md">Hinzufügen</Button>
            <Button variant="ghost" size="md" onClick={() => setAdding(false)}>Abbrechen</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="md" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Kategorie hinzufügen
        </Button>
      )}

      <div className="border-t border-slate-100 pt-4">
        {showUpload ? (
          <DocumentUploader sectionKey="products" onConfirm={handleDocumentConfirm} onCancel={() => setShowUpload(false)} />
        ) : (
          <Button variant="outline" size="md" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            Dokument hochladen & analysieren
          </Button>
        )}
      </div>
    </div>
  );
}

function CategoryEditor({
  cat,
  onSave,
  onChange,
}: {
  cat: ProductCategoryData;
  onSave: (data: ProductCategoryData) => Promise<void>;
  onChange?: (data: ProductCategoryData) => void;
}) {
  const [data, setData] = useState<ProductCategoryData>({ ...cat });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (field: keyof ProductCategoryData, value: unknown) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    onChange?.(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
    } catch {
      toast("Speichern fehlgeschlagen.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white">
      <FieldGroup label="Kategoriename" required>
        <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Marketing Automation" />
        <ExampleHint examples={["Marketing Automation", "CRM-Beratung"]} />
      </FieldGroup>
      <FieldGroup label="Kurzbeschreibung">
        <Textarea value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="Kurze Beschreibung der Kategorie..." rows={3} />
        <ExampleHint examples={["Unsere Marketing-Automation-Lösungen automatisieren wiederkehrende Marketingprozesse."]} />
      </FieldGroup>
      <FieldGroup label="Wichtigste Funktionen & Leistungen">
        <TagInput value={data.features} onChange={(v) => set("features", v)} placeholder="Funktion eingeben und Enter drücken" />
        <ExampleHint examples={["E-Mail-Automatisierung, Lead Scoring, Segmentierung"]} />
      </FieldGroup>
      <FieldGroup label="Alleinstellungsmerkmale (USPs)">
        <TagInput value={data.usps} onChange={(v) => set("usps", v)} placeholder="USP eingeben und Enter drücken" />
        <ExampleHint examples={["Schnelle Implementierung und persönlicher Support"]} />
      </FieldGroup>
      {!onChange && (
        <Button onClick={handleSave} loading={saving} size="sm">Speichern</Button>
      )}
    </div>
  );
}
