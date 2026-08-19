"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrainLogo } from "@/components/BrainLogo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json() as { success?: boolean; error?: string };
    setLoading(false);

    if (!res.ok || !data.success) {
      setError(data.error ?? "Zurücksetzen fehlgeschlagen.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">Ungültiger Link. Bitte fordere einen neuen Reset-Link an.</p>
    );
  }

  return done ? (
    <div className="text-center space-y-3">
      <p className="text-sm text-green-700 font-medium">Passwort erfolgreich geändert!</p>
      <p className="text-xs text-gray-500">Du wirst zur Anmeldung weitergeleitet…</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Neues Passwort</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
          className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm"
          placeholder="Mindestens 8 Zeichen"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort bestätigen</label>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
          className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm"
          placeholder="Passwort wiederholen"
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
        {loading ? "Wird gespeichert…" : "Passwort speichern"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-light min-h-screen bg-gradient-to-b from-[#E8956D] to-[#1B7FD4] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center mb-8">
        <BrainLogo variant="white" id="reset-logo" className="h-16 w-auto mb-4" />
        <h1 className="text-white text-2xl font-bold tracking-tight">AI Asset Factory Brain</h1>
        <p className="text-white/70 text-sm mt-1">adesso SE</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Neues Passwort setzen</h2>
        <Suspense fallback={<p className="text-sm text-gray-500">Lädt…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <div className="mt-5 text-center text-sm text-gray-500">
          <Link href="/login" className="text-[#1B7FD4] hover:underline font-medium">
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
