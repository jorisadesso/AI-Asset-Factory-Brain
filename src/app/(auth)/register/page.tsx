"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json() as { error?: string };

    if (!res.ok) {
      setError(data.error ?? "Registrierung fehlgeschlagen.");
    } else {
      router.push("/login?registered=1");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">
            AI
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Asset Factory Brain</h1>
          <p className="text-gray-500 mt-1">Konto erstellen</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Ihr Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm text-gray-900 placeholder:text-gray-400"
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
                minLength={8}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Mindestens 8 Zeichen"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Wird erstellt..." : "Konto erstellen"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
