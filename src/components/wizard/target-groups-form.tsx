"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "./field-group";
import { ExampleHint } from "@/components/ui/example-hint";
import { DocumentUploader } from "@/components/upload/document-uploader";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Upload, UserPlus } from "lucide-react";
import { TargetGroupData } from "@/schemas/sections";

interface TargetGroupsFormProps {
  groups: (TargetGroupData & { id?: string })[];
  onAdd: (group: TargetGroupData) => Promise<void>;
  onUpdate: (id: string, group: TargetGroupData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_GROUP: TargetGroupData = {
  name: "",
  industry: "",
  description: "",
  personas: [],
};

export function TargetGroupsForm({ groups, onAdd, onUpdate, onDelete }: TargetGroupsFormProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newGroup, setNewGroup] = useState<TargetGroupData>({ ...EMPTY_GROUP });
  const [showUpload, setShowUpload] = useState(false);

  const handleAdd = async () => {
    if (!newGroup.name.trim()) {
      toast("Bitte einen Zielgruppennamen eingeben.", "error");
      return;
    }
    try {
      await onAdd(newGroup);
      setNewGroup({ ...EMPTY_GROUP });
      setAdding(false);
      toast("Zielgruppe hinzugefügt.", "success");
    } catch {
      toast("Fehler beim Hinzufügen.", "error");
    }
  };

  const handleDocumentConfirm = async (extracted: Record<string, unknown>) => {
    const gs = (extracted as { groups?: TargetGroupData[] }).groups;
    if (gs && Array.isArray(gs)) {
      for (const g of gs) {
        await onAdd(g).catch(() => {});
      }
      toast(`${gs.length} Zielgruppe(n) übernommen.`, "success");
    }
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      {groups.map((group, i) => {
        const id = group.id || `g-${i}`;
        const isExpanded = expanded === id;
        return (
          <div key={id} className="rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setExpanded(isExpanded ? null : id)}
            >
              <div>
                <p className="font-medium text-slate-900">{group.name}</p>
                {group.industry && <p className="text-xs text-slate-500 mt-0.5">{group.industry}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Zielgruppe löschen?")) onDelete(id).then(() => toast("Gelöscht.", "success"));
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
            {isExpanded && (
              <GroupEditor
                group={group}
                onSave={(updated) => onUpdate(id, updated).then(() => toast("Gespeichert.", "success"))}
              />
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 space-y-4">
          <p className="font-medium text-slate-900">Neue Zielgruppe</p>
          <GroupEditor group={newGroup} onSave={async (d) => setNewGroup(d)} onChange={setNewGroup} />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAdd} size="md">Hinzufügen</Button>
            <Button variant="ghost" size="md" onClick={() => setAdding(false)}>Abbrechen</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="md" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Zielgruppe hinzufügen
        </Button>
      )}

      <div className="border-t border-slate-100 pt-4">
        {showUpload ? (
          <DocumentUploader sectionKey="target-groups" onConfirm={handleDocumentConfirm} onCancel={() => setShowUpload(false)} />
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

function GroupEditor({
  group,
  onSave,
  onChange,
}: {
  group: TargetGroupData;
  onSave: (data: TargetGroupData) => Promise<void>;
  onChange?: (data: TargetGroupData) => void;
}) {
  const [data, setData] = useState<TargetGroupData>({ ...group });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = (field: keyof TargetGroupData, value: unknown) => {
    const updated = { ...data, [field]: value };
    setData(updated);
    onChange?.(updated);
  };

  const addPersona = () => {
    set("personas", [...data.personas, { name: "", description: "" }]);
  };

  const updatePersona = (i: number, field: "name" | "description", value: string) => {
    const personas = [...data.personas];
    personas[i] = { ...personas[i], [field]: value };
    set("personas", personas);
  };

  const removePersona = (i: number) => {
    set("personas", data.personas.filter((_, idx) => idx !== i));
  };

  return (
    <div className="p-4 space-y-6 bg-white">
      <FieldGroup label="Zielgruppe" required>
        <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Marketing Manager in mittelständischen Unternehmen" />
        <ExampleHint examples={["Marketing Manager in mittelständischen Unternehmen", "Geschäftsführer von Industrieunternehmen"]} />
      </FieldGroup>
      <FieldGroup label="Branche / Markt">
        <Input value={data.industry} onChange={(e) => set("industry", e.target.value)} placeholder="z. B. Maschinenbau, Automotive" />
        <ExampleHint examples={["Maschinenbau, Automotive und Logistik", "SaaS und E-Commerce"]} />
      </FieldGroup>
      <FieldGroup label="Beschreibung">
        <Textarea value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="Beschreiben Sie diese Zielgruppe..." rows={3} />
        <ExampleHint examples={["Marketing Manager in Unternehmen mit 100–1.000 Mitarbeitern, die ihre Marketingprozesse automatisieren möchten."]} />
      </FieldGroup>

      <FieldGroup label="Personas">
        <div className="space-y-3">
          {data.personas.map((p, i) => (
            <div key={i} className="flex gap-2 items-start rounded-lg border border-slate-100 p-3">
              <div className="flex-1 space-y-2">
                <Input value={p.name} onChange={(e) => updatePersona(i, "name", e.target.value)} placeholder="Name, z. B. Julia, 38, Marketing Managerin" />
                <ExampleHint examples={["Julia, 38, Marketing Managerin", "Thomas, 52, Geschäftsführer"]} />
                <Textarea value={p.description} onChange={(e) => updatePersona(i, "description", e.target.value)} placeholder="Kurzbeschreibung..." rows={2} />
                <ExampleHint examples={["Verantwortlich für Leadgenerierung, sucht zeitsparende Lösungen."]} />
              </div>
              <button onClick={() => removePersona(i)} className="text-slate-400 hover:text-red-500 mt-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPersona}>
            <UserPlus className="h-3 w-3" />
            Persona hinzufügen
          </Button>
        </div>
        <ExampleHint examples={["Julia, 38, Marketing Managerin, verantwortlich für Leadgenerierung."]} />
      </FieldGroup>

      {!onChange && (
        <Button
          onClick={async () => { setSaving(true); try { await onSave(data); } catch { toast("Speichern fehlgeschlagen.", "error"); } finally { setSaving(false); } }}
          loading={saving}
          size="sm"
        >
          Speichern
        </Button>
      )}
    </div>
  );
}
