import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldGroupProps {
  label: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldGroup({ label, description, required, children, className }: FieldGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}
