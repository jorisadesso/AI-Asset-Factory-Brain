"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Sidebar } from "./Sidebar";
import type { SectionType } from "@/types";

// Width below which the sidebar shows icon-only collapsed mode
const COLLAPSE_THRESHOLD = 170;
// Snap targets
const COLLAPSED_WIDTH = 56;
const DEFAULT_WIDTH = 280;

interface SectionStatus {
  sectionType: SectionType;
  status: string;
  completionScore: number;
}

export function SidebarWrapper() {
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  // null until hydrated from localStorage — prevents save effect from firing before load
  const [width, setWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, startX: 0, startWidth: 0 });

  const refetch = useCallback(() => {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data: { sections: SectionStatus[]; completionScore: number }) => {
        setSections(data.sections ?? []);
        setOverallScore(data.completionScore ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetch();
    window.addEventListener("brain-updated", refetch);
    return () => window.removeEventListener("brain-updated", refetch);
  }, [refetch]);

  // Load persisted width after hydration (lazy initializer doesn't run during SSR hydration)
  useEffect(() => {
    const saved = localStorage.getItem("brain-sidebar-width");
    const parsed = saved ? parseInt(saved, 10) : NaN;
    setWidth(isNaN(parsed) ? DEFAULT_WIDTH : parsed);
  }, []);

  // Save width — null means not yet loaded, so skip to avoid overwriting localStorage
  useEffect(() => {
    if (width === null) return;
    localStorage.setItem("brain-sidebar-width", String(width));
  }, [width]);

  useEffect(() => {
    const snap = (w: number) => {
      // Below threshold → icon-only collapsed; anywhere above → keep exact width
      if (w < COLLAPSE_THRESHOLD) return COLLAPSED_WIDTH;
      return w;
    };

    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const delta = e.clientX - drag.current.startX;
      const raw = drag.current.startWidth + delta;
      setWidth(Math.max(COLLAPSED_WIDTH, Math.min(480, raw)));
    };

    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      document.body.style.userSelect = "";
      setWidth((w) => snap(w ?? DEFAULT_WIDTH));
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { active: true, startX: e.clientX, startWidth: resolvedWidth };
    setDragging(true);
    document.body.style.userSelect = "none";
  };

  const resolvedWidth = width ?? DEFAULT_WIDTH;
  const isCollapsed = resolvedWidth < COLLAPSE_THRESHOLD;
  const displayWidth = isCollapsed ? COLLAPSED_WIDTH : resolvedWidth;

  return (
    <div
      className="relative h-full flex shrink-0"
      style={{
        width: `${displayWidth}px`,
        userSelect: dragging ? "none" : undefined,
        transition: dragging ? "none" : "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Sidebar
        sections={sections}
        overallScore={overallScore}
        isCollapsed={isCollapsed}
      />
      {/* Drag-to-resize handle — 10px click area centered on right edge */}
      <div
        className="absolute top-0 bottom-0 cursor-col-resize z-20 flex items-center justify-center group"
        style={{ width: "10px", right: "-5px" }}
        onMouseDown={handleResizeStart}
      >
        <div
          className={`w-0.5 h-10 rounded-full transition-colors duration-150 ${
            dragging ? "bg-[#1B7FD4]" : "bg-transparent group-hover:bg-gray-300"
          }`}
        />
      </div>
    </div>
  );
}
