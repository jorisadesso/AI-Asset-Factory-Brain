"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain, Lightbulb,
  CheckCircle2, Paperclip, XCircle, BookOpen, ChevronDown, ChevronUp, LayoutDashboard, Loader2,
} from "lucide-react";
import type { SectionConfig, SectionType } from "@/types";
import { SECTION_CONFIGS } from "@/types";
import { CrossSectionModal, type CrossSectionEntry } from "@/components/wizard/CrossSectionModal";

interface SectionWizardProps {
  config: SectionConfig;
}

type LucideIcon = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Package, Users, MessageSquare, Megaphone,
  TrendingUp, Shield, FileText, Image, Brain,
};

// ─── Branchenspezifische Compliance-Vorlagen ────────────────────────────────
const INDUSTRY_TEMPLATES: Record<string, { label: string; legal_requirements: string; forbidden_statements: string; mandatory_disclosures: string }> = {
  healthcare: {
    label: "Gesundheitswesen / Medizintechnik",
    legal_requirements: "DSGVO: Keine personenbezogenen Gesundheitsdaten ohne Einwilligung. MDR (EU) 2017/745: Nur klinisch validierte Wirksamkeitsaussagen. HWG: Keine irreführende Heilmittelwerbung. DiGA-Regularien: Transparenzpflichten gegenüber Nutzern.",
    forbidden_statements: "Keine Garantien für Heilungserfolge oder medizinische Ergebnisse. Keine Aussage, dass das Produkt Behandlungsfehler verhindert. Keine Aussagen über nicht zugelassene Indikationen oder Funktionen.",
    mandatory_disclosures: "Impressum und Datenschutzerklärung. CE-Kennzeichnung als Medizinprodukt. DiGA-Zulassungsnummer (sofern zutreffend). KI-generierte Inhalte kennzeichnen (EU AI Act).",
  },
  banking: {
    label: "Banking / Finanzdienstleistungen",
    legal_requirements: "MiFID II: Geeignetheitsprüfung vor Anlageempfehlungen. BaFin-Lizenzpflichten: Keine Finanzberatung ohne Erlaubnis. KWG: Keine unerlaubte Kreditvermittlung. DSGVO: Finanzdaten besonders schützen. PRIIPs-Verordnung bei Anlageprodukten.",
    forbidden_statements: "Keine garantierten Rendite- oder Gewinnversprechen. Keine Anlageempfehlungen ohne BaFin-Zulassung. Keine irreführenden Risikodarstellungen. Risikowarnungen dürfen nicht weggelassen werden.",
    mandatory_disclosures: "Risikohinweise bei Finanzprodukten. BaFin-Zulassungsnummer. Impressum mit Aufsichtsbehörde. Werbung klar als solche kennzeichnen.",
  },
  insurance: {
    label: "Versicherung",
    legal_requirements: "VVG (Versicherungsvertragsgesetz): Vollständige Produktinformation. IDD (Insurance Distribution Directive): Bedarfsanalyse vor Empfehlung. BaFin-Aufsicht: Keine unerlaubte Versicherungsvermittlung. DSGVO: Sensible Gesundheits- und Finanzdaten schützen.",
    forbidden_statements: "Keine Versprechen zur Leistungspflicht ohne Prüfung des Einzelfalls. Keine irreführenden Prämienvergleiche. Keine Garantien für Schadensregulierung. Keine Versicherungsberatung ohne IHK-Zulassung.",
    mandatory_disclosures: "IDD-Informationsblatt vor Vertragsabschluss. Versicherungsvermittlerregister-Nummer (DIHK). Courtagedisclosure bei provisionsbasierter Beratung. Impressum mit BaFin-Registernummer.",
  },
  ecommerce: {
    label: "E-Commerce / Handel",
    legal_requirements: "UWG: Keine unlauteren Wettbewerbshandlungen. PAngV: Vollständige Preisangaben inkl. MwSt. und Versandkosten. EU-Verbraucherrecht: 14-tägiges Widerrufsrecht kommunizieren. DSGVO: Cookie-Einwilligung und Datenschutzerklärung.",
    forbidden_statements: "Keine falschen Rabatt-Angaben (UVP muss nachweisbar sein). Keine irreführenden Verfügbarkeitsangaben. Keine gefälschten oder anonymisierten Kundenbewertungen. Keine Dark Patterns im Checkout.",
    mandatory_disclosures: "Preise inkl. MwSt. und Versandkosten. Widerrufsbelehrung und Muster-Widerrufsformular. Impressum, Datenschutzerklärung, AGB. Unterschied Herstellergarantie vs. gesetzliche Gewährleistung.",
  },
  saas: {
    label: "B2B Software / SaaS",
    legal_requirements: "DSGVO: Auftragsverarbeitungsvertrag (AVV) mit allen Kunden abschließen. Haftungsbeschränkungen in AGB klar regeln. ISO 27001 / SOC 2 Anforderungen wenn kommuniziert nachweisen. EU Data Act beachten (ab 2025).",
    forbidden_statements: "Keine Uptime-Garantien ohne vertragliche SLA-Absicherung. Keine Datensicherheitsversprechen ohne technischen Nachweis. Keine unbegrenzten Leistungsversprechen. Keine DSGVO-Compliance behaupten ohne geprüften AVV.",
    mandatory_disclosures: "AVV-Angebot und Datenschutzerklärung. SLA-Dokument mit Reaktionszeiten. Impressum mit Geschäftsführer. Subunternehmer-Liste für DSGVO-Anforderungen.",
  },
  realestate: {
    label: "Immobilien",
    legal_requirements: "MaBV (Makler- und Bauträgerverordnung). Fernabsatzrecht bei Online-Vertragsabschlüssen. DSGVO: Kundendaten bei Besichtigungen und Interessentenlisten. GEG: Energieausweis-Pflicht in Inseraten.",
    forbidden_statements: "Keine garantierten Immobilienwertversprechen. Keine irreführenden Lagebeschreibungen. Keine Courtagezusagen ohne schriftlichen Maklervertrag. Keine Renditegarantien bei Anlageimmobilien.",
    mandatory_disclosures: "Maklerprovision und Courtagemodell klar ausweisen. Energieausweis-Pflichtangaben in Inseraten. IHK-Erlaubnisnachweis §34c GewO. Widerrufsrecht bei Fernabsatzverträgen.",
  },
};

const SECTION_HINTS: Partial<Record<string, string>> = {
  COMPANY: "Grundlage für alle KI-Inhalte — ohne klares Unternehmensprofil entstehen generische Texte ohne Wiedererkennungswert.",
  PRODUCT_CATEGORIES: "KI-Tools brauchen genaue Produktbeschreibungen, Features und USPs, um überzeugende Produkttexte zu schreiben.",
  TARGET_GROUPS: "Wer die Zielgruppe nicht kennt, trifft den falschen Ton. Personas helfen der KI, die richtige Sprache zu wählen.",
  BRAND_LANGUAGE: "Tonalität und Stilregeln verhindern, dass die KI einen beliebigen Standardton verwendet — legen Sie Ihren fest.",
  MARKETING_CONTENT: "Content-Ziele und Themen geben der KI eine klare Richtung, welche Inhalte erstellt werden sollen.",
  SALES: "Vertriebsargumente und Referenzen helfen der KI, kaufüberzeugende Texte zu schreiben statt allgemeiner Beschreibungen.",
  LEGAL_COMPLIANCE: "Ohne Compliance-Vorgaben kann die KI unbeabsichtigt rechtlich problematische Formulierungen verwenden.",
  EXISTING_CONTENT: "Gute Beispiele aus der Vergangenheit zeigen der KI Ihren bevorzugten Schreibstil und vermeiden Stilbrüche.",
  VISUAL_GUIDELINES: "Bildsprache-Regeln helfen der KI bei der Beschreibung und Auswahl von Bildmotiven und Designelementen.",
  AI_RULES: "Explizite KI-Verarbeitungsregeln stellen sicher, dass die KI immer im Sinne Ihres Unternehmens handelt.",
};

type UploadState = "idle" | "loading" | "done" | "error";

const MAX_ANSWER_LENGTH = 5000;

function AutoResizeTextarea({
  value, onChange, onBlur, onFocus, placeholder, className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_ANSWER_LENGTH - value.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        maxLength={MAX_ANSWER_LENGTH}
        rows={5}
        style={{ resize: "none", minHeight: "120px", overflow: "hidden" }}
        className={className}
      />
      {value.length > MAX_ANSWER_LENGTH * 0.9 && (
        <span className={`absolute bottom-2 right-3 text-xs ${remaining < 100 ? "text-red-500" : "text-gray-400"}`}>
          {remaining}
        </span>
      )}
    </div>
  );
}

function SectionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Brain;
  return <Icon className={className ?? "w-5 h-5"} />;
}

function PhosphorCheckFat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" fill="currentColor">
      <path d="M243.28,68.24l-24-23.56a16,16,0,0,0-22.57.06L96,152.59l-36.69-35.4A16,16,0,0,0,36.8,117.3L12.9,141.26a16,16,0,0,0,0,22.63L89.54,240a16,16,0,0,0,22.63,0L243.33,90.91A16,16,0,0,0,243.28,68.24Z" />
    </svg>
  );
}

function PhosphorArrowCircleLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" fill="currentColor">
      <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm52-84a12,12,0,0,1-12,12H117l11.52,11.51a12,12,0,0,1-17,17l-32-32a12,12,0,0,1,0-17l32-32a12,12,0,0,1,17,17L117,116h51A12,12,0,0,1,180,128Z" />
    </svg>
  );
}

function PhosphorArrowCircleRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" fill="currentColor">
      <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm48.49-92.49a12,12,0,0,1,0,17l-32,32a12,12,0,1,1-17-17L139,140H88a12,12,0,0,1,0-24h51l-11.52-11.51a12,12,0,1,1,17-17Z" />
    </svg>
  );
}

function KnowledgePreview({ sectionType, savedAnswers }: { sectionType: SectionType; savedAnswers: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevAnswers = useRef<string>("");

  const answersKey = JSON.stringify(savedAnswers);
  const hasContent = Object.values(savedAnswers).some((v) => v.trim().length > 0);

  useEffect(() => {
    if (!open || !hasContent) return;
    if (prevAnswers.current === answersKey && content !== null) return;
    prevAnswers.current = answersKey;
    setLoading(true);
    fetch("/api/brain/knowledge")
      .then((r) => r.json())
      .then((docs: Array<{ sectionType: string; content: string }>) => {
        const doc = docs.find((d) => d.sectionType === sectionType);
        setContent(doc?.content ?? null);
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [open, answersKey, sectionType, hasContent, content]);

  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#1B7FD4]" />
          Generierte Wissensbasis ansehen
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <span className="w-5 h-5 border-2 border-[#1B7FD4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : content ? (
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto border border-gray-100">
              {content}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">Noch kein Dokument generiert. Speichern Sie zuerst Ihre Antworten.</p>
          )}
        </div>
      )}
    </div>
  );
}

function IndustryComplianceHelper({ onApply }: { onApply: (tpl: Record<string, string>) => void }) {
  const [selected, setSelected] = useState("");
  const [applied, setApplied] = useState(false);
  const tpl = selected ? INDUSTRY_TEMPLATES[selected] : null;

  function handleApply() {
    if (!tpl) return;
    onApply({
      legal_requirements: tpl.legal_requirements,
      forbidden_statements: tpl.forbidden_statements,
      mandatory_disclosures: tpl.mandatory_disclosures,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  }

  return (
    <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#1B7FD4] shrink-0" />
        <span className="text-sm font-semibold text-[#1569B8]">Branchenvorlage wählen</span>
      </div>
      <p className="text-xs text-[#3B82F6]">
        Wählen Sie Ihre Branche — die Felder werden automatisch mit den relevanten regulatorischen Anforderungen vorausgefüllt.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setApplied(false); }}
          className="flex-1 min-w-48 px-3 py-2 bg-white border border-[#93C5FD] rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B7FD4]"
        >
          <option value="">— Branche auswählen —</option>
          {Object.entries(INDUSTRY_TEMPLATES).map(([key, t]) => (
            <option key={key} value={key}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={handleApply}
          disabled={!selected}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1B7FD4] hover:bg-[#1569B8] disabled:opacity-40 text-white text-sm font-medium rounded-xl transition"
        >
          {applied ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          {applied ? "Übernommen!" : "Vorlage übernehmen"}
        </button>
      </div>
      {tpl && (
        <div className="bg-white border border-[#DBEAFE] rounded-xl p-4 space-y-2 text-xs text-gray-700">
          <div><span className="font-semibold text-[#1569B8]">Rechtliche Vorgaben:</span> {tpl.legal_requirements}</div>
          <div><span className="font-semibold text-[#1569B8]">Verbotene Aussagen:</span> {tpl.forbidden_statements}</div>
          <div><span className="font-semibold text-[#1569B8]">Pflichtangaben:</span> {tpl.mandatory_disclosures}</div>
        </div>
      )}
    </div>
  );
}

export function SectionWizard({ config }: SectionWizardProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [uploadWarnings, setUploadWarnings] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [crossSections, setCrossSections] = useState<CrossSectionEntry[] | null>(null);
  const [checkedSectionTypes, setCheckedSectionTypes] = useState<string[] | undefined>(undefined);
  const [crossCheckRunning, setCrossCheckRunning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const isDirtyRef = useRef(false);
  const configTypeRef = useRef(config.type);

  const isDirty = JSON.stringify(answers) !== JSON.stringify(savedAnswers);
  const isDynamic = false;

  const fetchBrain = useCallback(async () => {
    try {
      const res = await fetch("/api/brain");
      const data = await res.json() as {
        sections: Array<{ sectionType: string; answers: Record<string, string> }>;
      };
      const section = data.sections.find((s) => s.sectionType === config.type);
      if (section?.answers) {
        setAnswers(section.answers);
        setSavedAnswers(section.answers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [config.type]);

  useEffect(() => { void fetchBrain(); }, [fetchBrain]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  useEffect(() => {
    return () => {
      if (!isDirtyRef.current) return;
      void fetch(`/api/brain/sections/${configTypeRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => { void handleSave(); }, 2000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function handleSave(answersOverride?: Record<string, string>): Promise<boolean> {
    const answersToSave = answersOverride ?? answers;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/brain/sections/${config.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersToSave }),
      });
      if (!res.ok) return false;
      setSavedAnswers({ ...answersToSave });
      setSaved(true);
      setSavedAt(new Date());
      router.refresh();
      window.dispatchEvent(new CustomEvent("brain-updated"));
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndNavigate(href: string) {
    if (isDirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    router.push(href);
  }

  function handleFieldBlur() {
    if (!isDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    // Delay slightly so tabbing between fields doesn't trigger intermediate saves
    autoSaveTimerRef.current = setTimeout(() => { void handleSave(); }, 800);
  }

  function handleFieldFocus() {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  }

  function triggerUploadForAll() {
    fileInputRef.current?.click();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processUpload(file);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await processUpload(file);
  }

  async function processUpload(file: File) {
    if (!file || config.questions.length === 0) return;

    const allKeys = config.questions.map((q) => q.key);

    // Show loading on all questions
    setUploadStates((prev) => {
      const next = { ...prev };
      for (const key of allKeys) next[key] = "loading";
      return next;
    });
    setUploadWarnings({});
    setCrossCheckRunning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sectionType", config.type);
      formData.append("questions", JSON.stringify(config.questions.map((q) => ({ key: q.key, label: q.label, type: q.type ?? "text" }))));
      formData.append("crossCheck", "true");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as {
        success?: boolean;
        answers?: Record<string, string>;
        warnings?: Record<string, string>;
        crossSections?: CrossSectionEntry[];
        error?: string;
      };

      if (!res.ok || !data.success) {
        setUploadStates((prev) => {
          const next = { ...prev };
          for (const key of allKeys) next[key] = "error";
          return next;
        });
        setUploadWarnings(Object.fromEntries(allKeys.map((k) => [k, data.error ?? "Fehler beim Verarbeiten."])));
        return;
      }

      const filled = data.answers ?? {};
      const warnings = data.warnings ?? {};

      const mergedAnswers = { ...answers, ...filled };
      setAnswers(mergedAnswers);

      setUploadStates((prev) => {
        const next = { ...prev };
        for (const key of allKeys) {
          next[key] = filled[key] ? "done" : "error";
        }
        return next;
      });
      setUploadWarnings((prev) => ({ ...prev, ...warnings }));

      // Save immediately with merged answers so isDirty becomes false.
      // This prevents the auto-save useEffect from calling router.refresh()
      // while the cross-section modal is open (which would reset its state).
      await handleSave(mergedAnswers);

      if (data.crossSections && data.crossSections.length > 0) {
        const checked = SECTION_CONFIGS
          .filter((s) => s.type !== config.type && s.questions.length > 0)
          .map((s) => s.type);
        setCheckedSectionTypes(checked);
        setCrossSections(data.crossSections);
      }

      setTimeout(() => {
        setUploadStates((prev) => {
          const next = { ...prev };
          for (const key of allKeys) if (next[key] === "done") next[key] = "idle";
          return next;
        });
      }, 4000);
    } catch {
      setUploadStates((prev) => {
        const next = { ...prev };
        for (const key of allKeys) next[key] = "error";
        return next;
      });
      setUploadWarnings(Object.fromEntries(allKeys.map((k) => [k, "Netzwerkfehler."])));
    } finally {
      setCrossCheckRunning(false);
    }
  }

  const currentIndex = SECTION_CONFIGS.findIndex((c) => c.type === config.type);
  const prevSection = SECTION_CONFIGS[currentIndex - 1];
  const nextSection = SECTION_CONFIGS[currentIndex + 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B7FD4] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden shared file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.html,.htm,.rtf,.odt,.odp,.ods"
        onChange={handleFileSelected}
      />

      {/* Cross-section suggestion modal */}
      {crossSections && (
        <CrossSectionModal
          crossSections={crossSections}
          checkedSectionTypes={checkedSectionTypes}
          onClose={() => { setCrossSections(null); setCheckedSectionTypes(undefined); }}
          onApplied={() => { setCrossSections(null); setCheckedSectionTypes(undefined); }}
        />
      )}

      {/* Breadcrumb + Dashboard Button */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-[#1B7FD4] hover:text-[#1569B8] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-3 py-1.5 rounded-lg transition"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">{config.label}</span>
        <span className="ml-auto text-xs text-gray-400">{currentIndex + 1} / {SECTION_CONFIGS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-[#1B7FD4] h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / SECTION_CONFIGS.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <SectionIcon name={config.icon} className="w-6 h-6 text-[#1B7FD4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{config.label}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Hint */}
      {SECTION_HINTS[config.type] && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-sm text-yellow-700 min-h-[66px]">
          <Lightbulb className="w-4 h-4 shrink-0 text-yellow-400" />
          <span>{SECTION_HINTS[config.type]}</span>
        </div>
      )}

      {/* Dynamic sections */}

      {/* Branchenspezifische Compliance-Auswahl */}
      {config.type === "LEGAL_COMPLIANCE" && (
        <IndustryComplianceHelper onApply={(tpl) => setAnswers((prev) => ({ ...prev, ...tpl }))} />
      )}

      {/* Standard questions */}
      {!isDynamic && config.questions.length > 0 && (
        <div
          className={`bg-white rounded-2xl border p-6 space-y-7 transition-colors ${dragOver ? "border-[#1B7FD4] bg-blue-50/40" : "border-gray-200"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Fragen</h2>
            {crossCheckRunning ? (
              <span className="text-xs text-[#1B7FD4] flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Prüft auch andere Bereiche …
              </span>
            ) : dragOver ? (
              <span className="text-xs text-[#1B7FD4] font-medium flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" /> Datei hier loslassen…
              </span>
            ) : null}
          </div>
          {config.questions.map((question) => {
            const uploadState = uploadStates[question.key] ?? "idle";
            const uploadWarning = uploadWarnings[question.key];
            return (
              <div key={question.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-800">
                  {question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {question.type === "textarea" ? (
                  <AutoResizeTextarea
                    value={answers[question.key] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.key]: e.target.value }))}
                    onBlur={handleFieldBlur}
                    onFocus={handleFieldFocus}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm resize-none text-gray-900 placeholder:text-gray-300"
                  />
                ) : question.type === "list" ? (
                  <div>
                    <input
                      type="text"
                      value={answers[question.key] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [question.key]: e.target.value }))}
                      onBlur={handleFieldBlur}
                      onFocus={handleFieldFocus}
                      placeholder={question.placeholder ?? "Kommagetrennte Liste"}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm text-gray-900 placeholder:text-gray-300"
                    />
                    {answers[question.key] && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {answers[question.key].split(",").map((item) => item.trim()).filter(Boolean).map((item, i) => (
                          <span key={i} className="text-xs bg-[#EFF6FF] text-[#1569B8] px-2.5 py-0.5 rounded-full">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[question.key] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [question.key]: e.target.value }))}
                    onBlur={handleFieldBlur}
                    onFocus={handleFieldFocus}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B7FD4] focus:border-transparent transition text-sm text-gray-900 placeholder:text-gray-300"
                  />
                )}

                {/* Per-question file upload */}
                <div className="flex items-center gap-3 pt-0.5">
                  {answers[question.key]?.trim() && (
                    confirmClear === question.key ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500">Wirklich löschen?</span>
                        <button
                          type="button"
                          onClick={() => { setAnswers((prev) => ({ ...prev, [question.key]: "" })); setConfirmClear(null); }}
                          className="text-red-500 hover:text-red-600 font-medium transition"
                        >Ja</button>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(null)}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >Nein</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(question.key)}
                        className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Leeren
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={triggerUploadForAll}
                    disabled={uploadState === "loading"}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1B7FD4] transition disabled:opacity-50"
                  >
                    {uploadState === "loading" ? (
                      <><span className="w-3 h-3 border border-[#1B7FD4] border-t-transparent rounded-full animate-spin inline-block" /> Wird analysiert…</>
                    ) : (
                      <><Paperclip className="w-3.5 h-3.5" /> Datei anhängen</>
                    )}
                  </button>

                  {uploadState === "done" && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aus Datei übernommen
                    </span>
                  )}
                  {uploadState === "error" && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {uploadWarning ?? "Nicht gefunden"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Save button */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-sm font-medium">
              {saved && !saving && savedAt && (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gespeichert um {savedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  <span className="text-gray-300">·</span>
                  <span className="text-[#1B7FD4]">Dokument aktualisiert</span>
                </span>
              )}
              {saving && (
                <span className="text-gray-400 text-xs flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-[#1B7FD4] border-t-transparent rounded-full animate-spin inline-block" />
                  Speichert…
                </span>
              )}
              {!saving && isDirty && !saved && (
                <span className="text-gray-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  Ungespeicherte Änderungen · <kbd className="font-mono bg-gray-100 px-1 rounded text-gray-500">⌘ Enter</kbd>
                </span>
              )}
            </div>
            <button
              onClick={() => void handleSave()}
              disabled={saving || !isDirty}
              className="bg-[#1B7FD4] hover:bg-[#1569B8] text-white font-medium text-sm px-6 py-2.5 rounded-xl transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-default"
            >
              {saving ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </div>
      )}

      {/* Knowledge preview */}
      {!isDynamic && <KnowledgePreview sectionType={config.type} savedAnswers={savedAnswers} />}

      {/* Navigation */}
      <div className="flex items-center pb-4 pt-2 border-t border-gray-100 mt-2">
        {/* Prev — 336 px fixed on desktop, proportional on small screens */}
        <button
          onClick={() => void handleSaveAndNavigate(
            prevSection ? `/brain/${prevSection.type.toLowerCase()}` : "/dashboard"
          )}
          className="flex items-center gap-2 shrink-0 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition group w-[336px] max-w-[calc(50%-8px)]"
        >
          <PhosphorArrowCircleLeft className="w-5 h-5 shrink-0 text-gray-500 group-hover:text-gray-700 transition" />
          <span className="flex-1 truncate">{prevSection ? prevSection.label : "Dashboard"}</span>
        </button>

        {/* Center spacer — shows auto-save hint when active */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
          {isDirty && nextSection && (
            <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">Speichert automatisch</span>
          )}
        </div>

        {/* Next — identical dimensions */}
        <button
          onClick={() => void handleSaveAndNavigate(
            nextSection ? `/brain/${nextSection.type.toLowerCase()}` : "/dashboard"
          )}
          disabled={saving}
          className={`flex items-center gap-2 shrink-0 text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-60 w-[336px] max-w-[calc(50%-8px)] ${
            nextSection ? "bg-[#1B7FD4] text-white hover:bg-[#1569B8]" : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {saving ? (
            <span className="flex-1 truncate">Wird gespeichert...</span>
          ) : nextSection ? (
            <>
              <span className="flex-1 truncate">{nextSection.label}</span>
              <PhosphorArrowCircleRight className="w-5 h-5 shrink-0" />
            </>
          ) : (
            <>
              <span className="flex-1 truncate">Abschließen</span>
              <PhosphorCheckFat className="w-4 h-4 shrink-0" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
