import { CheckCircle, Circle, Clock } from "lucide-react";
import { SectionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface SectionStatusIconProps {
  status: SectionStatus;
  size?: "sm" | "md";
}

export function SectionStatusIcon({ status, size = "md" }: SectionStatusIconProps) {
  const s = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (status === "complete") {
    return <CheckCircle className={cn(s, "text-emerald-500")} />;
  }
  if (status === "partial") {
    return <Clock className={cn(s, "text-amber-500")} />;
  }
  return <Circle className={cn(s, "text-slate-300")} />;
}
