"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Etwas ist schiefgelaufen
      </h2>
      <p className="text-sm text-[var(--text-secondary)] text-center max-w-sm">
        {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition"
      >
        Neu laden
      </button>
    </div>
  );
}
