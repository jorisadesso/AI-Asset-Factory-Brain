"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface OrgData {
  organization: { id: string; name: string } | null;
  members: Member[];
  currentUserId: string;
}

interface Invitation {
  id: string;
  email: string | null;
  role: string;
  joinUrl: string;
  expiresAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Inhaber",
  ADMIN: "Administrator",
  EDITOR: "Editor",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-yellow-100 text-yellow-800",
  ADMIN: "bg-purple-100 text-purple-700",
  EDITOR: "bg-blue-100 text-blue-700",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR">("EDITOR");
  const [inviteEmail, setInviteEmail] = useState("");
  const [newInvite, setNewInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnerOrAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [orgRes, invRes] = await Promise.all([
        fetch("/api/organization"),
        fetch("/api/organization/invite"),
      ]);
      const org = await orgRes.json() as OrgData;
      const inv = await invRes.json() as Invitation[];
      setOrgData(org);
      setInvitations(Array.isArray(inv) ? inv : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrg() {
    if (!orgName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Fehler beim Erstellen");
        return;
      }
      await loadData();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite() {
    setError(null);
    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() || undefined, role: inviteRole }),
      });
      const data = await res.json() as Invitation & { error?: string };
      if (!res.ok) { setError(data.error ?? "Fehler"); return; }
      setNewInvite(data);
      setInviteEmail("");
      await loadData();
    } catch {
      setError("Netzwerkfehler");
    }
  }

  function copyLink(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verwalten Sie Ihre Organisation und laden Sie Teammitglieder ein
        </p>
      </div>

      {/* No org yet */}
      {!orgData?.organization && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Organisation erstellen</h2>
            <p className="text-sm text-gray-500 mb-5">
              Erstellen Sie eine Organisation, um Kollegen einzuladen. Alle Mitglieder teilen sich dann denselben AI Asset Factory Brain.
            </p>
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">{error}</div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="z.B. Muster GmbH"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreateOrg(); }}
              />
              <button
                onClick={() => void handleCreateOrg()}
                disabled={creating || !orgName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                {creating ? "…" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {orgData?.organization && (
        <>
          {/* Org header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                {orgData.organization.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{orgData.organization.name}</h2>
                <p className="text-sm text-gray-500">{orgData.members.length} Mitglied{orgData.members.length !== 1 ? "er" : ""}</p>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Mitglieder</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {orgData.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {(member.name ?? member.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.name ?? member.email}
                        {member.id === orgData.currentUserId && (
                          <span className="ml-2 text-xs text-gray-400">(Sie)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{member.email}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABEL[member.role] ?? member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite — only for owner/admin */}
          {isOwnerOrAdmin && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Mitglied einladen</h2>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">{error}</div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="E-Mail (optional)"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "EDITOR")}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <button
                  onClick={() => void handleInvite()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Einladen
                </button>
              </div>

              {/* Newly created invite */}
              {newInvite && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-sm font-medium text-green-800 mb-2">✓ Einladungslink erstellt</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 font-mono text-gray-700 break-all">
                      {newInvite.joinUrl}
                    </code>
                    <button
                      onClick={() => copyLink(newInvite.joinUrl)}
                      className="shrink-0 text-xs font-medium text-green-700 bg-white border border-green-200 px-3 py-2 rounded-lg hover:bg-green-50 transition"
                    >
                      {copied ? "✓ Kopiert" : "Kopieren"}
                    </button>
                  </div>
                  <div className="text-xs text-green-600 mt-1.5">
                    Gültig bis {new Date(newInvite.expiresAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              )}

              {/* Active invitations */}
              {invitations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Offene Einladungen</h3>
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <div className="text-sm text-gray-800">{inv.email ?? "Offen (kein E-Mail)"}</div>
                          <div className="text-xs text-gray-400">
                            {ROLE_LABEL[inv.role] ?? inv.role} · bis {new Date(inv.expiresAt).toLocaleDateString("de-DE")}
                          </div>
                        </div>
                        <button
                          onClick={() => copyLink(inv.joinUrl)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                        >
                          Link kopieren
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
