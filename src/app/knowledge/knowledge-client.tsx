"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FileText, RefreshCw, Download, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  filename: string;
  content: string;
  updatedAt: string;
}

export function KnowledgeClient() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchDocs = async () => {
    const res = await fetch("/api/brain/knowledge");
    const json = await res.json();
    setDocuments(json.documents || []);
  };

  useEffect(() => {
    fetchDocs().finally(() => setLoading(false));
  }, []);

  const generateAll = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/brain/knowledge", { method: "POST" });
      const json = await res.json();
      setDocuments(json.documents || []);
      toast("Wissensbasis erfolgreich generiert.", "success");
    } catch {
      toast("Generierung fehlgeschlagen.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const downloadDoc = (doc: KnowledgeDoc) => {
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-violet-600" />
              KI-Wissensbasis
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Strukturierte Markdown-Dokumente für die KI-Verarbeitung
            </p>
          </div>
          <Button onClick={generateAll} loading={generating} size="md">
            <RefreshCw className="h-4 w-4" />
            Alle generieren
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Noch keine Dokumente</p>
            <p className="text-slate-400 text-sm mt-1">
              Füllen Sie zunächst die Wissensbereiche aus und klicken Sie auf &quot;Alle generieren&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-violet-500" />
                    <div>
                      <p className="font-medium text-slate-900">{doc.filename}</p>
                      <p className="text-xs text-slate-400">
                        Aktualisiert: {new Date(doc.updatedAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadDoc(doc); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      title="Herunterladen"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {expanded === doc.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>
                {expanded === doc.id && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-80 overflow-auto">
                      {doc.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
