"use client";

import { useSectionData, useBrain } from "@/hooks/use-brain";
import { AppShell } from "@/components/layout/app-shell";
import { SectionKey } from "@/types";
import { SECTION_MAP, SECTIONS } from "@/lib/sections";
import { SECTION_FIELDS } from "@/lib/section-fields";
import { CompanyForm } from "@/components/wizard/company-form";
import { ProductsForm } from "@/components/wizard/products-form";
import { TargetGroupsForm } from "@/components/wizard/target-groups-form";
import { GenericSectionForm } from "@/components/wizard/generic-section-form";
import { SectionStatusIcon } from "@/components/wizard/section-status-icon";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CompanyData, ProductCategoryData, TargetGroupData } from "@/schemas/sections";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionPageClientProps {
  sectionKey: SectionKey;
}

export function SectionPageClient({ sectionKey }: SectionPageClientProps) {
  const { data, loading, save } = useSectionData(sectionKey);
  const { completionStatus, sectionStatuses, refetch } = useBrain();
  const [categories, setCategories] = useState<(ProductCategoryData & { id?: string })[]>([]);
  const [groups, setGroups] = useState<(TargetGroupData & { id?: string })[]>([]);

  const section = SECTION_MAP[sectionKey];
  const sectionIndex = SECTIONS.findIndex((s) => s.key === sectionKey);
  const prevSection = SECTIONS[sectionIndex - 1];
  const nextSection = SECTIONS[sectionIndex + 1];
  const status = sectionStatuses[sectionKey] || "open";
  const sectionScore = completionStatus.find((s) => s.sectionKey === sectionKey)?.score || 0;

  // Load categories and groups
  useEffect(() => {
    if (sectionKey === "products") {
      fetch("/api/brain/categories")
        .then((r) => r.json())
        .then((json) => {
          setCategories(
            (json.categories || []).map((c: { features: string; usps: string; id: string; name: string; description: string }) => ({
              ...c,
              features: JSON.parse(c.features),
              usps: JSON.parse(c.usps),
            }))
          );
        });
    }
    if (sectionKey === "target-groups") {
      fetch("/api/brain/target-groups")
        .then((r) => r.json())
        .then((json) => setGroups(json.groups || []));
    }
  }, [sectionKey]);

  const handleSave = async (newData: Record<string, unknown>) => {
    await save(newData);
    refetch();
  };

  // Category CRUD
  const addCategory = async (cat: ProductCategoryData) => {
    const res = await fetch("/api/brain/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    });
    const json = await res.json();
    setCategories((prev) => [...prev, { ...json.category, features: JSON.parse(json.category.features), usps: JSON.parse(json.category.usps) }]);
    refetch();
  };

  const updateCategory = async (id: string, cat: ProductCategoryData) => {
    const res = await fetch("/api/brain/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cat, id }),
    });
    const json = await res.json();
    setCategories((prev) => prev.map((c) => c.id === id ? { ...json.category, features: JSON.parse(json.category.features), usps: JSON.parse(json.category.usps) } : c));
    refetch();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/brain/categories?id=${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    refetch();
  };

  // Target group CRUD
  const addGroup = async (group: TargetGroupData) => {
    const res = await fetch("/api/brain/target-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group),
    });
    const json = await res.json();
    setGroups((prev) => [...prev, json.group]);
    refetch();
  };

  const updateGroup = async (id: string, group: TargetGroupData) => {
    const res = await fetch("/api/brain/target-groups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...group, id }),
    });
    const json = await res.json();
    setGroups((prev) => prev.map((g) => g.id === id ? json.group : g));
    refetch();
  };

  const deleteGroup = async (id: string) => {
    await fetch(`/api/brain/target-groups?id=${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
    refetch();
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <SectionStatusIcon status={status} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{section?.title}</h1>
              <p className="text-sm text-slate-500">{section?.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-600">{sectionScore}%</p>
              <p className="text-xs text-slate-400">vollständig</p>
            </div>
          </div>
          <Progress value={sectionScore} />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {sectionKey === "company" && (
                <CompanyForm
                  initialData={data as Partial<CompanyData>}
                  onSave={(d) => handleSave(d as Record<string, unknown>)}
                />
              )}
              {sectionKey === "products" && (
                <ProductsForm
                  categories={categories}
                  onAdd={addCategory}
                  onUpdate={updateCategory}
                  onDelete={deleteCategory}
                />
              )}
              {sectionKey === "target-groups" && (
                <TargetGroupsForm
                  groups={groups}
                  onAdd={addGroup}
                  onUpdate={updateGroup}
                  onDelete={deleteGroup}
                />
              )}
              {!["company", "products", "target-groups"].includes(sectionKey) &&
                SECTION_FIELDS[sectionKey] && (
                  <GenericSectionForm
                    sectionKey={sectionKey}
                    fields={SECTION_FIELDS[sectionKey]!}
                    initialData={data || {}}
                    onSave={handleSave}
                  />
                )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {prevSection ? (
            <Link href={`/brain/${prevSection.key}`}>
              <Button variant="outline" size="md">
                <ChevronLeft className="h-4 w-4" />
                {prevSection.title}
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button variant="outline" size="md">
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}

          {nextSection ? (
            <Link href={`/brain/${nextSection.key}`}>
              <Button size="md">
                {nextSection.title}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/quality-check">
              <Button size="md">
                Qualitätsprüfung
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
