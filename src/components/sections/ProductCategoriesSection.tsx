"use client";

import { useEffect, useRef, useState } from "react";
import { Package, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { ProductCategory } from "@/types";
import { CrossSectionModal, type CrossSectionEntry } from "@/components/wizard/CrossSectionModal";

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [crossSections, setCrossSections] = useState<CrossSectionEntry[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      window.dispatchEvent(new CustomEvent("brain-updated"));
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/brain/products/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    window.dispatchEvent(new CustomEvent("brain-updated"));
  }

  async function handleUpload(file: File) {
    setUploadState("loading");
    setUploadMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sectionType", "PRODUCT_CATEGORIES");
    formData.append("questions", JSON.stringify([]));
    formData.append("crossCheck", "true");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as { success?: boolean; error?: string; crossSections?: CrossSectionEntry[] };
      if (!res.ok || !data.success) {
        setUploadState("error");
        setUploadMessage(data.error ?? "Fehler beim Verarbeiten der Datei.");
      } else {
        setUploadState("done");
        setUploadMessage("Dokument gespeichert. Es steht nun in der Dokumentenbibliothek zur Verfügung.");
        window.dispatchEvent(new CustomEvent("brain-updated"));
        if (data.crossSections && data.crossSections.length > 0) {
          setCrossSections(data.crossSections);
        }
        setTimeout(() => setUploadState("idle"), 5000);
      }
    } catch {
      setUploadState("error");
      setUploadMessage("Netzwerkfehler beim Upload.");
    }
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
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs text-[#1B7FD4] hover:text-[#1569B8] px-2 py-1 rounded hover:bg-[#EFF6FF] transition"
                  >
                    Bearbeiten
                  </button>
                  {deleteConfirmId === cat.id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500">Wirklich löschen?</span>
                      <button
                        onClick={() => void handleDelete(cat.id)}
                        className="text-red-500 hover:text-red-600 font-medium transition"
                      >Ja</button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >Nein</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                    >
                      Löschen
                    </button>
                  )}
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
                        <span key={i} className="text-xs bg-[#EFF6FF] text-[#1569B8] px-2 py-0.5 rounded">
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
        <div className="bg-white rounded-2xl border border-[#93C5FD] p-6 space-y-4">
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] text-sm"
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] text-sm resize-none"
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] text-sm"
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="bg-[#1B7FD4] hover:bg-[#1569B8] text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-60"
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

      {/* Add button — only shown when at least one item exists (empty state provides its own CTA) */}
      {!showForm && categories.length > 0 && (
        <button
          onClick={startNew}
          className="w-full bg-white border-2 border-dashed border-gray-200 hover:border-[#93C5FD] hover:bg-[#EFF6FF] text-gray-500 hover:text-[#1B7FD4] text-sm font-medium py-4 rounded-xl transition"
        >
          + Kategorie hinzufügen
        </button>
      )}

      {categories.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Noch keine Kategorien</div>
            <div className="text-xs text-gray-400 mt-0.5">Fügen Sie Ihre erste Produkt- oder Dienstleistungskategorie hinzu.</div>
          </div>
          <button
            onClick={startNew}
            className="mt-1 text-sm font-medium text-[#1B7FD4] hover:text-[#1569B8] transition"
          >
            + Erste Kategorie anlegen
          </button>
        </div>
      )}

      {crossSections && (
        <CrossSectionModal
          crossSections={crossSections}
          onClose={() => setCrossSections(null)}
          onApplied={() => setCrossSections(null)}
        />
      )}

      {/* File upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void handleUpload(f); }}
      />
      <div
        className="border border-dashed border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between gap-4 bg-gray-50 hover:border-[#93C5FD] hover:bg-[#EFF6FF] transition cursor-pointer"
        onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void handleUpload(f); }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {uploadState === "loading" && <Loader2 className="w-4 h-4 text-[#1B7FD4] shrink-0 animate-spin" />}
          {uploadState === "done"    && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
          {uploadState === "error"   && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          {uploadState === "idle"    && <Upload className="w-4 h-4 text-gray-400 shrink-0" />}
          <span className="text-sm text-gray-500 truncate">
            {uploadState === "idle"    && "Dokument anhängen (PDF, DOCX, PPTX …)"}
            {uploadState === "loading" && "Dokument wird verarbeitet …"}
            {uploadState === "done"    && (uploadMessage || "Gespeichert.")}
            {uploadState === "error"   && (uploadMessage || "Fehler beim Upload.")}
          </span>
        </div>
        {uploadState === "idle" && (
          <span className="shrink-0 text-xs font-medium text-[#1B7FD4] bg-[#EFF6FF] px-3 py-1.5 rounded-lg whitespace-nowrap">
            Datei wählen
          </span>
        )}
      </div>
    </div>
  );
}
