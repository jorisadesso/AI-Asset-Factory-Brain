"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import type { SectionType } from "@/types";

interface SectionStatus {
  sectionType: SectionType;
  status: string;
  completionScore: number;
}

export function SidebarWrapper() {
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data: { sections: SectionStatus[]; completionScore: number }) => {
        setSections(data.sections ?? []);
        setOverallScore(data.completionScore ?? 0);
      })
      .catch(() => {});
  }, []);

  return <Sidebar sections={sections} overallScore={overallScore} />;
}
