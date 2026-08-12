"use client";

import { useEffect, useState } from "react";
import type { TargetGroup } from "@/types";

type GroupForm = {
  name: string;
  industry: string;
  description: string;
  personas: string[];
};

const EMPTY_FORM: GroupForm = { name: "", industry: "", description: "", personas: [""] };

export function TargetGroupsSection() {
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GroupForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/brain/target-groups")
      .then((r) => r.json())
      .then((data: TargetGroup[]) => setGroups(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function startEdit(group: TargetGroup) {
    setEditId(group.id);
    setForm({
      name: group.name,
      industry: group.industry,
      description: group.description,
      personas: group.personas.length > 0 ? group.personas.map((p) => p.description) : [""],
    });
    setShowForm(true);
  }

  function startNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name,
      industry: form.industry,
      description: form.description,
      personas: form.personas.filter((p) => p.trim()).map((p) => ({ description: p.trim() })),
    };

    try {
      if (editId) {
        const res = await fetch(`/api/brain/target-groups/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json() as TargetGroup;
        setGroups((prev) => prev.map((g) => (g.id === editId ? updated : g)));
      } else {
        const res = await fetch("/api/brain/target-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json() as TargetGroup;
        setGroups((prev) => [...prev, created]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch {
      // Handle
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Zielgruppe wirklich löschen?")) return;
    await fetch(`/api/brain/target-groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function addPersona() {
    setForm((f) => ({ ...f, personas: [...f.personas, ""] }));
  }

  function updatePersona(index: number, value: string) {
    setForm((f) => {
      const personas = [...f.personas];
      personas[index] = value;
      return { ...f, personas };
    });
  }

  function removePersona(index: number) {
    setForm((f) => ({
      ...f,
      personas: f.personas.filter((_, i) => i !== index),
    }));
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900">{group.name}</div>
                  {group.industry && (
                    <div className="text-xs text-gray-500">{group.industry}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(group)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Löschen
                  </button>
                </div>
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
              )}
              {group.personas.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Personas</div>
                  <div className="space-y-1">
                    {group.personas.map((p) => (
                      <div key={p.id} className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-1.5">
                        {p.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? "Zielgruppe bearbeiten" : "Neue Zielgruppe"}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name der Zielgruppe *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="z.B. Marketing Manager im Mittelstand"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Branche / Markt</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              placeholder="z.B. Maschinenbau, Automotive und Logistik"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Wen beschreiben Sie? Welche Bedürfnisse hat diese Zielgruppe?"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personas</label>
            <div className="space-y-2">
              {form.personas.map((persona, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={persona}
                    onChange={(e) => updatePersona(i, e.target.value)}
                    placeholder={`z.B. Julia, 38, Marketing Managerin, verantwortlich für Leadgenerierung`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {form.personas.length > 1 && (
                    <button
                      onClick={() => removePersona(i)}
                      className="text-gray-400 hover:text-red-500 transition px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPersona}
                className="text-sm text-blue-600 hover:text-blue-700 transition"
              >
                + Persona hinzufügen
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); }}
              className="text-gray-600 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={startNew}
          className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-sm font-medium py-4 rounded-xl transition"
        >
          + Zielgruppe hinzufügen
        </button>
      )}

      {groups.length === 0 && !showForm && (
        <div className="text-center text-sm text-gray-400 py-4">
          Noch keine Zielgruppen erfasst. Fügen Sie die erste Zielgruppe hinzu.
        </div>
      )}
    </div>
  );
}
