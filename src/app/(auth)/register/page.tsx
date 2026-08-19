"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainLogo } from "@/components/BrainLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json() as { error?: string };

    if (!res.ok) {
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    // Auto-login after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Konto erstellt, aber Anmeldung fehlgeschlagen. Bitte manuell anmelden.");
      router.push("/login");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="auth-light min-h-screen bg-gradient-to-b from-[#E8956D] to-[#1B7FD4] flex flex-col items-center justify-center p-6">
      {/* Logo + title above card */}
      <div className="flex flex-col items-center mb-8">
        <BrainLogo variant="white" id="register-logo" className="h-16 w-auto mb-4" />
        <h1 className="text-white text-2xl font-bold tracking-tight">AI Asset Factory Brain</h1>
        <p className="text-white/70 text-sm mt-1">adesso SE</p>
      </div>

      {/* Register card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Konto erstellen</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm placeholder:text-gray-400"
              placeholder="Ihr Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail-Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm placeholder:text-gray-400"
              placeholder="ihre@email.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm placeholder:text-gray-400"
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
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm placeholder:text-gray-400"
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
            className="w-full bg-gradient-to-r from-[#E8956D] to-[#1B7FD4] hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Wird erstellt…" : "Konto erstellen"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-500">
          Bereits ein Konto?{" "}
          <Link href="/login" className="text-[#1B7FD4] hover:underline font-medium">
            Anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
