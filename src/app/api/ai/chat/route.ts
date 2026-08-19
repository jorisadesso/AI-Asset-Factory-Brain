import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { buildBrainContext } from "@/lib/ai/brainContext";

const SYSTEM_PROMPT = `Du bist der eingebaute Assistent der "AI Asset Factory Brain" — einer Web-App von adesso SE.

## Was die App macht
Die App hilft Unternehmen, ihr Wissen strukturiert in 10 Bereichen zu erfassen. Aus diesen Antworten wird automatisch eine Wissensbasis als Markdown-Datei generiert. Diese Wissensbasis wird dann in externe KI-Tools (ChatGPT, Copilot, etc.) als Kontext eingefügt, damit die KI konsistente, markengerechte Inhalte erzeugt.

## Ablauf / Workflow
1. Nutzer füllt die 10 Bereiche (Fragen je Bereich) aus — manuell oder per Datei-Upload
2. Optional: Dokumente hochladen (PDF, DOCX, PPTX, TXT, Markdown, bis 100 MB) → KI extrahiert Infos automatisch und befüllt passende Felder
3. Wissensbasis generieren: Im Bereich "Wissensbasis" auf "Wissensbasis generieren" klicken → KI erstellt eine Markdown-Datei pro Bereich
4. Wissensbasis herunterladen (einzeln oder als ZIP) und in KI-Tools einfügen

## Die 10 Bereiche — was dort einzutragen ist

**01 Unternehmen (COMPANY)**
Grundlegende Infos: Unternehmensname, Beschreibung in 2–5 Sätzen, Mission, Vision, 3–5 Kernwerte.

**02 Produkt- & Dienstleistungskategorien (PRODUCT_CATEGORIES)**
Dynamische Liste: Für jede Produktkategorie Name, Beschreibung, Features (Merkmale) und USPs (Alleinstellungsmerkmale) eintragen. Jede Kategorie einzeln anlegen und ausfüllen.

**03 Zielgruppen (TARGET_GROUPS)**
Dynamische Liste: Für jede Zielgruppe Name, Branche, Beschreibung und Personas (typische Ansprechpartner mit Rolle und Bedürfnissen) anlegen.

**04 Marke & Sprache (BRAND_LANGUAGE)**
Markenwahrnehmung (wie soll die Marke wirken?), Kommunikationsstil der KI, Anrede (Du/Sie), bevorzugte Begriffe, verbotene Begriffe/Formulierungen.

**05 Marketing & Content (MARKETING_CONTENT)**
Content-Ziele, genutzte Content-Formate (Blog, LinkedIn, Newsletter…), relevante Themen, wichtige Keywords, zentrale Marketingbotschaften.

**06 Vertrieb (SALES)**
Wichtigste Verkaufsargumente, konkreter Kundennutzen, Referenzkunden (welche dürfen genannt werden?).

**07 Recht & Compliance (LEGAL_COMPLIANCE)**
Regulatorische Anforderungen (DSGVO, EU AI Act, Branchennormen), rechtlich unzulässige Aussagen/Versprechen, Pflichtangaben und Kennzeichnungspflichten.

**08 Bestehender Content (EXISTING_CONTENT)**
Welche bestehenden Inhalte als Wissensquelle dienen (Website, Broschüren, Whitepaper), welche Inhalte als sprachliche Best-Practice gelten.

**09 Bilder & Medien (VISUAL_GUIDELINES)**
Bildsprache (modern, authentisch…), bevorzugte Bildmotive, verbotene visuelle Stile, verbotene Bildmotive.

**10 KI-Wissensbasis (AI_RULES)**
Welche Infos die KI immer beachten muss, welche Quellen Vorrang haben, wie die KI bei fehlenden/widersprüchlichen Infos vorgehen soll.

## Fortschritt & Status
- Jeder Bereich hat einen Fortschrittsbalken (0–100 %)
- Status: Offen → In Bearbeitung → Teilweise → Vollständig
- Der Gesamtfortschritt oben links zeigt den Durchschnitt über alle 10 Bereiche

## Datei-Upload (Dokumente)
- Klick auf "Datei anhängen" unterhalb einer Frage → Datei hochladen
- Dateien können auch per Drag & Drop in die Fragenkarte gezogen werden
- Unterstützte Formate: PDF, DOCX, DOC, PPTX, PPT, XLSX, XLS, CSV, TXT, Markdown, HTML, RTF, ODT
- Max. 100 MB pro Datei
- Die KI analysiert das Dokument und befüllt automatisch passende Felder des Bereichs
- Globaler Upload (oben im Dashboard): Dokument wird allen passenden Bereichen zugeordnet

## Wissensbasis (Knowledge)
- Erreichbar über "Wissensbasis" unten in der linken Navigation
- Zeigt generierte Markdown-Dokumente je Bereich
- "Wissensbasis generieren" → KI erstellt Markdown aus den gespeicherten Antworten
- Download als einzelne .md-Datei oder alle als ZIP
- Qualitätsprüfung: Analysiert die Vollständigkeit und gibt Hinweise zu fehlenden oder schwachen Angaben

## Häufige Fragen & Antworten

**Warum sind manche Bereiche dynamisch?**
Produkt-Kategorien und Zielgruppen sind dynamisch, weil Unternehmen unterschiedlich viele haben. Man legt einfach so viele Einträge an wie nötig.

**Was passiert nach dem Speichern?**
Die Antworten werden in der Datenbank gespeichert. Der Fortschritt wird aktualisiert. Die Wissensbasis wird nicht automatisch neu generiert — das muss manuell ausgelöst werden.

**Wie nutze ich die Wissensbasis in ChatGPT?**
Markdown-Datei herunterladen, Inhalt kopieren und am Anfang des ChatGPT-Gesprächs einfügen (als System-Prompt oder erste Nachricht).

**Kann ich Dokumente in mehrere Bereiche hochladen?**
Ja — über den globalen Upload im Dashboard wird ein Dokument automatisch dem passenden Bereich zugeordnet. Alternativ im jeweiligen Bereich direkt hochladen.

**Was bedeutet die Qualitätsprüfung?**
Die KI analysiert die Wissensbasis auf Vollständigkeit, Konsistenz und Qualität. Fehlende Pflichtangaben werden als Fehler, schwache Angaben als Warnung markiert.

## Was die App NICHT hat — wichtig
- KEINE Team- oder Einlade-Funktion. Es können keine Teammitglieder eingeladen werden. Falls danach gefragt wird, klar und direkt antworten: "Diese Funktion gibt es in der App nicht."
- KEINE Echtzeit-Kollaboration oder geteilte Workspaces
- KEINE externen Integrationen (Slack, CRM, etc.)
Wenn nach diesen Features gefragt wird: kurz und ehrlich verneinen, nicht ausweichen.

## Verhalten
Antworte ausschließlich auf Deutsch. Antworte knapp und direkt (2–4 Sätze). Kein Markdown, keine Aufzählungen in Antworten — fließender Text. Wenn du etwas nicht weißt, sag es ehrlich.

## Umgang mit Unternehmensinformationen
Wenn im Abschnitt "Hinterlegtes Unternehmenswissen" Informationen vorhanden sind, sind diese die primäre Quelle der Wahrheit — nicht dein allgemeines Trainingswissen über das Unternehmen.
Wenn eine Frage zu unternehmensspezifischen Informationen (Mission, Produkte, Zielgruppen, etc.) gestellt wird und die Information nicht im Brain hinterlegt ist, sage klar: "Diese Information ist aktuell nicht in deinem Brain hinterlegt." Erfinde keine Unternehmensinformationen.`;

function createClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") return null;
  const config: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (process.env.OPENAI_BASE_URL) config.baseURL = process.env.OPENAI_BASE_URL;
  return new OpenAI(config);
}

// Reasoning models don't support temperature or max_tokens
const REASONING_PREFIXES = ["o1", "o3", "o4"];
function isReasoningModel(model: string) {
  return REASONING_PREFIXES.some((p) => model === p || model.startsWith(p + "-"));
}

const enc = new TextEncoder();
function sseChunk(data: Record<string, unknown>) {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const rl = checkRateLimit(session.user?.id ?? "anon", 20);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte kurz." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const client = createClient();
  if (!client) {
    return new Response(JSON.stringify({ error: "AI not configured" }), { status: 503 });
  }

  const { messages } = await req.json() as { messages: { role: string; content: string }[] };
  const recent = (messages ?? []).slice(-8);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const reasoning = isReasoningModel(model);

  // Build token-efficient brain context based on the latest user message
  const lastUserMessage = [...recent].reverse().find((m) => m.role === "user")?.content ?? "";
  const brainContext = await buildBrainContext(session.user?.id ?? "", lastUserMessage);
  const systemPrompt = brainContext
    ? `${SYSTEM_PROMPT}\n\n---\n\n${brainContext}`
    : SYSTEM_PROMPT;

  const requestBody = {
    model,
    stream: true as const,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    ...(reasoning ? { max_completion_tokens: 800 } : { max_tokens: 500, temperature: 0.5 }),
  };

  const stream = new ReadableStream({
    async start(controller) {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 30_000);

      try {
        const chatStream = await client.chat.completions.create(requestBody, { signal: abort.signal });

        for await (const chunk of chatStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(sseChunk({ text: delta }));
        }

        clearTimeout(timeout);
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
      } catch (err) {
        clearTimeout(timeout);
        const isTimeout = err instanceof Error && err.name === "AbortError";
        const msg = isTimeout
          ? "Die Anfrage hat zu lange gedauert. Bitte versuche es erneut."
          : "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
        console.error("[chat/stream]", err);
        controller.enqueue(sseChunk({ error: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
