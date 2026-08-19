"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainLogo } from "@/components/BrainLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json() as { success?: boolean; token?: string; error?: string };
    setLoading(false);

    if (!res.ok || !data.success) {
      setError(data.error ?? "Fehler beim Zurücksetzen.");
      return;
    }

    if (data.token) {
      const base = window.location.origin;
      setResetUrl(`${base}/reset-password?token=${data.token}`);
    } else {
      // User not found — show generic message without revealing existence
      setResetUrl("not-found");
    }
  }

  return (
    <div className="auth-light min-h-screen bg-gradient-to-b from-[#E8956D] to-[#1B7FD4] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center mb-8">
        <BrainLogo variant="white" id="forgot-logo" className="h-16 w-auto mb-4" />
        <h1 className="text-white text-2xl font-bold tracking-tight">AI Asset Factory Brain</h1>
        <p className="text-white/70 text-sm mt-1">adesso SE</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Passwort zurücksetzen</h2>

        {resetUrl && resetUrl !== "not-found" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Dein Reset-Link (gültig für 1 Stunde). Öffne ihn in deinem Browser:
            </p>
            <div
              style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb", color: "#111827" }}
              className="text-xs border rounded-xl px-4 py-3 break-all font-mono"
            >
              {resetUrl}
            </div>
            <a
              href={resetUrl}
              className="block w-full text-center bg-gradient-to-r from-[#E8956D] to-[#1B7FD4] text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition"
            >
              Link öffnen
            </a>
          </div>
        ) : resetUrl === "not-found" ? (
          <p className="text-sm text-gray-600">
            Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link erstellt.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Gib deine E-Mail-Adresse ein. Du erhältst einen Link zum Zurücksetzen deines Passworts.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail-Adresse</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm"
                  placeholder="ihre@email.de"
                />
              </div>

              {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" }}
                  className="text-sm rounded-xl px-4 py-3 border">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#E8956D] to-[#1B7FD4] hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 text-sm"
              >
                {loading ? "Wird verarbeitet…" : "Reset-Link erstellen"}
              </button>
            </form>
          </>
        )}

        <div className="mt-5 text-center text-sm text-gray-500">
          <Link href="/login" className="text-[#1B7FD4] hover:underline font-medium">
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
