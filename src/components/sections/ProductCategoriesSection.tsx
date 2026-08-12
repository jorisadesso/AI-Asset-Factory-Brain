"use client";

import { useEffect, useState } from "react";
import type { ProductCategory } from "@/types";

type ProductForm = {
  name: string;
  description: string;
  features: string;
  usps: string;
};

const EMPTY_FORM: ProductForm = { name: "", description: "", features: "", usps: "" };

export function ProductCategoriesSection() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/brain/products")
      .then((r) => r.json())
      .then((data: ProductCategory[]) => setCategories(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function startEdit(cat: ProductCategory) {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description,
      features: cat.features.join(", "),
      usps: cat.usps.join(", "),
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
      description: form.description,
      features: form.features.split(",").map((s) => s.trim()).filter(Boolean),
      usps: form.usps.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editId) {
        const res = await fetch(`/api/brain/products/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json() as ProductCategory;
        setCategories((prev) => prev.map((c) => (c.id === editId ? updated : c)));
      } else {
        const res = await fetch("/api/brain/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json() as ProductCategory;
        setCategories((prev) => [...prev, created]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Kategorie wirklich löschen?")) return;
    await fetch(`/api/brain/products/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-gray-900">{cat.name}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Löschen
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-gray-600 mb-3">{cat.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                {cat.features.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Funktionen</div>
                    <div className="flex flex-wrap gap-1">
                      {cat.features.map((f, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {cat.usps.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">USPs</div>
                    <div className="flex flex-wrap gap-1">
                      {cat.usps.map((u, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {editId ? "Kategorie bearbeiten" : "Neue Kategorie"}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name der Kategorie *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="z.B. Marketing Automation"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Beschreibung
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Kurze Beschreibung dieser Produkt-/Dienstleistungskategorie..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Funktionen & Leistungen
              <span className="text-gray-400 font-normal ml-1">(kommagetrennt)</span>
            </label>
            <input
              type="text"
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              placeholder="z.B. E-Mail-Automatisierung, Lead Scoring, Segmentierung"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              USPs
              <span className="text-gray-400 font-normal ml-1">(kommagetrennt)</span>
            </label>
            <input
              type="text"
              value={form.usps}
              onChange={(e) => setForm((f) => ({ ...f, usps: e.target.value }))}
              placeholder="z.B. Schnelle Implementierung, persönlicher Support"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
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

      {/* Add button */}
      {!showForm && (
        <button
          onClick={startNew}
          className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-600 text-sm font-medium py-4 rounded-xl transition"
        >
          + Kategorie hinzufügen
        </button>
      )}

      {categories.length === 0 && !showForm && (
        <div className="text-center text-sm text-gray-400 py-4">
          Noch keine Kategorien erfasst. Fügen Sie die erste Kategorie hinzu.
        </div>
      )}
    </div>
  );
}
