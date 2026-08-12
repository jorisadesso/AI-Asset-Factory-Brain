"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface InviteInfo {
  valid: boolean;
  organizationName?: string;
  role?: string;
  expiresAt?: string;
}

export default function JoinPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/organization/join/${params.token}`)
      .then((r) => r.json())
      .then((d: InviteInfo) => setInfo(d))
      .catch(() => setInfo({ valid: false }));
  }, [params.token]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/organization/join/${params.token}`, { method: "POST" });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Beitreten");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setJoining(false);
    }
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!info.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Einladung ungültig</h1>
          <p className="text-sm text-gray-500 mb-6">
            Diese Einladung ist abgelaufen, bereits verwendet oder existiert nicht.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            Zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Willkommen im Team!</h1>
          <p className="text-sm text-gray-500">
            Sie sind jetzt Mitglied von <strong>{info.organizationName}</strong>. Sie werden weitergeleitet…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">
            👥
          </div>
          <h1 className="text-xl font-bold text-gray-900">Team-Einladung</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sie wurden eingeladen, dem Team beizutreten
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Organisation</span>
            <span className="font-semibold text-gray-900">{info.organizationName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Rolle</span>
            <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
              info.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}>
              {info.role === "ADMIN" ? "Administrator" : "Editor"}
            </span>
          </div>
          {info.expiresAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Gültig bis</span>
              <span className="text-gray-700">
                {new Date(info.expiresAt).toLocaleDateString("de-DE")}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">{error}</div>
        )}

        {status === "unauthenticated" ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Melden Sie sich an, um der Einladung zu folgen.
            </p>
            <Link
              href={`/login?callbackUrl=/join/${params.token}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition text-center"
            >
              Anmelden
            </Link>
            <Link
              href={`/register?callbackUrl=/join/${params.token}`}
              className="block w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm px-4 py-2.5 rounded-xl transition text-center"
            >
              Registrieren & beitreten
            </Link>
          </div>
        ) : (
          <button
            onClick={() => void handleJoin()}
            disabled={joining}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-60"
          >
            {joining ? "Wird beigetreten…" : `Als ${session?.user?.name ?? session?.user?.email} beitreten`}
          </button>
        )}
      </div>
    </div>
  );
}
