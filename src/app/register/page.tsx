"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Registrierung fehlgeschlagen");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Konto erstellen</h1>
          <p className="text-slate-500 text-sm mt-1">Starten Sie Ihr AI Asset Factory Brain</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Ihr Name</label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Max Mustermann" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">E-Mail</label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ihre@email.de" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Passwort</label>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mindestens 8 Zeichen" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Unternehmensname</label>
              <Input value={form.organizationName} onChange={(e) => set("organizationName", e.target.value)} placeholder="Muster GmbH" required />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm rounded-lg bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Registrieren
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Bereits registriert?{" "}
          <Link href="/login" className="text-violet-600 hover:underline font-medium">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
