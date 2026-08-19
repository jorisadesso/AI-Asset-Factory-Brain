"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainLogo } from "@/components/BrainLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (result?.error) {
      setError("E-Mail oder Passwort ist falsch.");
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
        <BrainLogo variant="white" id="login-logo" className="h-16 w-auto mb-4" />
        <h1 className="text-white text-2xl font-bold tracking-tight">AI Asset Factory Brain</h1>
        <p className="text-white/70 text-sm mt-1">adesso SE</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Anmelden</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              E-Mail-Adresse
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ backgroundColor: "#f9fafb", color: "#111827", borderColor: "#e5e7eb" }}
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${rememberMe ? "bg-[#1B7FD4]" : "bg-gray-200"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${rememberMe ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm text-gray-600">Angemeldet bleiben</span>
          </label>

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
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-gray-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-[#1B7FD4] hover:underline font-medium">
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
