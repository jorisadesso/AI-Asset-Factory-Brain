# AI Asset Factory Brain

Ein geführter Onboarding-Assistent, mit dem Unternehmen ihr individuelles Wissen für eine KI-gestützte Erstellung von Texten und Bildern strukturieren.

## Features

- **10 Wissensbereiche**: Unternehmen, Produkte, Zielgruppen, Marke & Sprache, Marketing, Vertrieb, Recht, Content, Bilder, KI-Regeln
- **Dokument-Upload**: PDF, DOCX, PPTX, TXT, MD – mit KI-Extraktion und anschließendem Löschen der Originaldatei
- **KI-gestützte Extraktion**: Strukturierte Informationsextraktion via Anthropic Claude
- **Completion Scoring**: Qualitätsbasierte Bewertung jedes Bereichs
- **Markdown-Wissensbasis**: Automatische Generierung strukturierter Markdown-Dokumente
- **Qualitätsprüfung**: KI-basierte Analyse auf Vollständigkeit und Konsistenz
- **Auth**: Email/Passwort-Authentifizierung mit NextAuth v5
- **Multi-Tenant**: Mandantentrennung auf Organisations- und Benutzerebene

## Tech Stack

| Layer | Technologie |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | SQLite (dev) via Prisma v7 + better-sqlite3 |
| Auth | NextAuth v5 (Credentials) |
| AI | Anthropic Claude API |
| Validation | Zod v4 |
| Testing | Jest + ts-jest |

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Folgende Variablen anpassen:

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
MAX_FILE_SIZE_MB=10
UPLOAD_DIR="/tmp/ai-asset-factory-uploads"
```

### 3. Datenbank initialisieren

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft auf [http://localhost:3000](http://localhost:3000).

## Verfügbare Skripte

```bash
npm run dev          # Entwicklungsserver
npm run build        # Produktions-Build
npm run start        # Produktionsserver
npm run test         # Tests ausführen
npm run typecheck    # TypeScript-Prüfung
npm run lint         # Linting
npm run db:migrate   # Datenbankmigrationen
npm run db:studio    # Prisma Studio
```

## Architektur

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Registrierung & NextAuth handler
│   │   ├── brain/         # Brain, Sections, Categories, Target Groups
│   │   │   ├── categories/
│   │   │   ├── knowledge/
│   │   │   ├── quality-check/
│   │   │   ├── section/
│   │   │   └── target-groups/
│   │   └── upload/        # Datei-Upload & Bestätigung
│   ├── brain/[sectionKey] # Wizard-Bereiche
│   ├── dashboard/         # Hauptübersicht
│   ├── knowledge/         # Wissensbasis-Anzeige
│   ├── login/
│   ├── quality-check/
│   └── register/
├── components/
│   ├── layout/            # AppShell, Sidebar
│   ├── ui/                # Basiskomponenten (Button, Input, etc.)
│   ├── upload/            # DocumentUploader
│   └── wizard/            # Sektionsformulare
├── hooks/                 # useBrain, useSectionData
├── lib/
│   ├── ai/                # Anthropic-Service (Extraktion, Qualitätsprüfung, Markdown)
│   ├── auth/              # NextAuth-Konfiguration
│   ├── completion/        # Completion Scoring
│   ├── db/                # Prisma-Client
│   ├── document/          # Dokument-Verarbeitung
│   └── knowledge/         # Markdown-Generierung
├── schemas/               # Zod-Schemas pro Bereich
└── types/                 # TypeScript-Typen
```

### Dokument-Upload-Flow

```
UPLOAD → Validierung → Temporär speichern → Text extrahieren
→ KI-Analyse → Strukturierte Daten → Nutzer prüft/korrigiert
→ Wissensbasis aktualisieren → Originaldatei löschen
```

Originaldateien werden **niemals dauerhaft gespeichert**.

### KI-Service-Schnittstelle

```typescript
AIService
├── extractFromDocument(text, sectionKey) → ExtractionResult
├── runQualityCheck(brainData) → QualityIssue[]
└── generateMarkdownContent(sectionKey, data) → string
```

## Sicherheit

- API-Keys ausschließlich über Umgebungsvariablen
- Uploads werden validiert (Dateityp, Größe)
- Temporäre Dateien werden nach Verarbeitung gelöscht
- Mandantentrennung: Nutzer sehen nur ihre eigenen Daten
- Passwörter werden mit bcrypt (12 Runden) gehasht

## Erweiterung

- **Datenbank**: SQLite durch PostgreSQL ersetzbar (nur `DATABASE_URL` und Provider in `prisma/schema.prisma` ändern)
- **AI-Provider**: Anthropic durch anderen LLM-Provider ersetzbar (`src/lib/ai/service.ts`)
- **Authentifizierung**: weitere OAuth-Provider via NextAuth konfigurierbar
