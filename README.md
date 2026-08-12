# AI Asset Factory Brain

Ein geführter Onboarding-Assistent, mit dem Unternehmen ihr individuelles Wissen für eine spätere KI-gestützte Erstellung von Texten und Bildern strukturieren.

## Setup

### Voraussetzungen

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Konfiguration

```bash
cp .env.example .env
```

Passen Sie die `.env` an:

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | Absoluter Pfad zur SQLite-Datenbank, z.B. `file:/absoluter/pfad/prisma/dev.db` |
| `NEXTAUTH_SECRET` | Zufälliger String (min. 32 Zeichen) für JWT-Signierung |
| `NEXTAUTH_URL` | Basis-URL der Anwendung, z.B. `http://localhost:3000` |
| `OPENAI_API_KEY` | API-Key für OpenAI oder adesso AI Hub |
| `OPENAI_BASE_URL` | Base-URL des AI-Providers (leer = OpenAI, oder adesso AI Hub URL) |
| `OPENAI_MODEL` | Modell-ID, z.B. `gpt-4o` |
| `MAX_FILE_SIZE_MB` | Maximale Upload-Dateigröße in MB (Standard: 10) |

**Für adesso AI Hub:**
```env
OPENAI_API_KEY="ihr-hub-api-key"
OPENAI_BASE_URL="https://ai-hub.adesso.de/v1"
OPENAI_MODEL="gpt-4o"
```

### Datenbank initialisieren

```bash
npx prisma db push
```

### Entwicklungsserver starten

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000).

---

## Deployment (Docker)

### Voraussetzungen
- Docker & Docker Compose auf dem Server

### 1. Umgebungsvariablen anlegen

```bash
cp .env.production.example .env
```

Mindestens diese Werte setzen:

```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)   # sicheren Secret generieren
NEXTAUTH_URL=https://brain.ihre-domain.de
OPENAI_API_KEY=ihr-api-key
OPENAI_BASE_URL=https://ai-hub.adesso.de/v1  # für adesso AI Hub
```

### 2. Image bauen und starten

```bash
docker compose up -d --build
```

Die App läuft auf Port 3000. Die SQLite-Datenbank wird in einem Docker-Volume (`db_data`) dauerhaft gespeichert.

### 3. Reverse Proxy (Nginx-Beispiel)

```nginx
server {
    listen 443 ssl;
    server_name brain.ihre-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Updates einspielen

```bash
git pull
docker compose up -d --build
```

Die Datenbank wird beim Start automatisch migriert (`prisma db push`).

### Logs

```bash
docker compose logs -f app
```

---

## Architektur

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login + Registrierung
│   ├── (dashboard)/            # Geschützte Seiten
│   │   ├── dashboard/          # Übersicht + Fortschritt
│   │   ├── brain/[section]/    # Wizard-Bereiche (10 Stück)
│   │   └── knowledge/          # Wissensbasis-Ansicht
│   └── api/
│       ├── auth/               # NextAuth + Registrierung
│       ├── brain/              # Brain-Daten, Sektionen, Qualitätsprüfung
│       ├── brain/products/     # Produkt-/Dienstleistungskategorien (CRUD)
│       ├── brain/target-groups/# Zielgruppen (CRUD)
│       ├── brain/knowledge/    # Wissensbasis-Dokumente (Read)
│       └── upload/             # Dokument-Upload + KI-Extraktion
├── components/
│   ├── dashboard/              # Dashboard, Navigation, Wissensbasis
│   ├── wizard/                 # Wizard-Hauptkomponente
│   ├── upload/                 # Dokument-Uploader
│   └── sections/               # Dynamische Bereiche (Produkte, Zielgruppen)
├── lib/
│   ├── ai/service.ts           # KI-Service (Extraktion, Qualitätsprüfung)
│   ├── db/prisma.ts            # Prisma-Client (Singleton)
│   ├── document/processor.ts  # Dokument-Verarbeitung (PDF, DOCX, PPTX, TXT)
│   ├── knowledge/generator.ts  # Markdown-Generator + Completion-Score
│   └── auth/options.ts         # NextAuth-Konfiguration
├── types/index.ts              # Typen + Bereichs-Konfigurationen
└── types/next-auth.d.ts        # Session-Typ-Erweiterungen
prisma/
└── schema.prisma               # Datenbankschema
```

## Kernfunktionen

### Dokument-Verarbeitungspipeline

```
UPLOAD → Validierung → Textextraktion → KI-Extraktion → Nutzerprüfung → Markdown → Originaldatei löschen
```

Originaldokumente werden **niemals dauerhaft gespeichert**. Die Extraktion erfolgt im Arbeitsspeicher, anschließend wird nur das strukturierte Wissen in der Wissensbasis abgelegt.

### KI-Service (`src/lib/ai/service.ts`)

| Funktion | Beschreibung |
|---|---|
| `extractKnowledgeFromText()` | Extrahiert strukturierte Daten aus Dokumenttext |
| `runQualityCheck()` | Prüft Vollständigkeit und Konsistenz der Wissensbasis |

Die KI-Integration ist OpenAI-kompatibel und funktioniert mit OpenAI, Azure OpenAI und dem adesso AI Hub. Konfiguration über Umgebungsvariablen.

### Markdown-Generator (`src/lib/knowledge/generator.ts`)

Aus den bestätigten Antworten werden automatisch Markdown-Dokumente generiert:

```
content-brain/ (in KnowledgeDocument-Tabelle gespeichert)
├── company.md
├── product-categories.md
├── target-groups.md
├── brand-and-language.md
├── marketing-and-content.md
├── sales.md
├── legal-and-compliance.md
├── existing-content.md
├── visual-guidelines.md
└── ai-rules.md
```

## Datenmodell

```
User → Brain → BrainSection → Answer
                ├── ProductCategory
                ├── TargetGroup → Persona
                ├── KnowledgeDocument
                ├── QualityCheck
                └── (AuditLog)
```

## Sicherheit

- **Mandantentrennung**: Jeder Nutzer sieht nur seinen eigenen Brain
- **Temporäre Uploads**: Dokumente nur im RAM, nie auf Disk gespeichert
- **API Keys**: Ausschließlich serverseitig via Umgebungsvariablen
- **Authentifizierung**: JWT-basiert via NextAuth
- **Passwörter**: bcrypt (Cost Factor 12)
- **Validierung**: Zod-Schemas auf allen API-Endpunkten

## Technologie-Stack

| Komponente | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript (strict) |
| Styling | Tailwind CSS |
| Datenbank | SQLite (via Prisma) / PostgreSQL-ready |
| Authentifizierung | NextAuth.js |
| KI-Integration | OpenAI-kompatibel (OpenAI, adesso AI Hub) |
| PDF-Verarbeitung | pdf-parse |
| DOCX-Verarbeitung | mammoth |
| PPTX-Verarbeitung | jszip |
| Validierung | Zod |
