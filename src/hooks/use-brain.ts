"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionKey, CompletionStatus, SectionStatus } from "@/types";

interface BrainData {
  brain: {
    id: string;
    name: string;
    completionScore: number;
  };
  completionStatus: CompletionStatus[];
}

export function useBrain() {
  const [data, setData] = useState<BrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/brain");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const sectionStatuses = Object.fromEntries(
    (data?.completionStatus || []).map((s) => [s.sectionKey, s.status])
  ) as Record<SectionKey, SectionStatus>;

  return {
    brain: data?.brain,
    completionStatus: data?.completionStatus || [],
    completionScore: data?.brain?.completionScore || 0,
    sectionStatuses,
    loading,
    error,
    refetch: fetch_,
  };
}

export function useSectionData(sectionKey: SectionKey) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brain/section?key=${sectionKey}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.section?.data) {
          try {
            setData(JSON.parse(json.section.data));
          } catch {
            setData({});
          }
        } else {
          setData({});
        }
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [sectionKey]);

  const save = useCallback(
    async (newData: Record<string, unknown>) => {
      const res = await fetch("/api/brain/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, data: newData }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setData(newData);
    },
    [sectionKey]
  );

  return { data, loading, save };
}
