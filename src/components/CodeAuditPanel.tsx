import React, { useState } from 'react';
import { getBrowserAiKey, openAiKeyDialog, runAuditInBrowser } from '../demo/browserAi';
import { DEFAULT_AUDIT_MODEL } from '../shared/auditPrompts';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
import { BRAND } from '../config/brand';
import { 
  Building2, ShieldCheck, Palette, Settings2, Code, Terminal, 
  Sparkles, CheckCircle, AlertTriangle, Download, Copy, Check, 
  FileCode2, RefreshCw, Layers, ShieldAlert, Cpu, ArrowRight, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

interface CodeAuditPanelProps {
  onLogITEvent?: (type: any, details: string, author?: string, status?: any) => void;
  playBeep?: () => void;
}

export type AuditPersona = 'architect' | 'security' | 'ux' | 'custom';

// Preset code / prompt structures to feed into Gemini
const CODE_PRESETS = [
  {
    id: 'app_core',
    title: 'App Core & State Architecture',
    file: 'src/App.tsx',
    category: 'Core System',
    snippet: `// App.tsx State & Navigation Architecture Excerpt
export default function App() {
  const [activePatientId, setActivePatientId] = useState<string>('P001');
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinic_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });
  const [currentRole, setCurrentRole] = useState<ClinicRole>('receptionist');
  const [itEvents, setItEvents] = useState<ITEvent[]>([]);

  const handleMergePatients = (masterId: string, dupeId: string) => {
    setPatients(prev => {
      const dupe = prev.find(p => p.id === dupeId);
      const master = prev.find(p => p.id === masterId);
      if (!dupe || !master) return prev;
      
      const updatedMaster = {
        ...master,
        visitationHistory: [...master.visitationHistory, ...dupe.visitationHistory]
      };
      return prev.filter(p => p.id !== dupeId).map(p => p.id === masterId ? updatedMaster : p);
    });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar & Top Navigation */}
      <AppHeader role={currentRole} onRoleChange={setCurrentRole} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Dynamic Views */}
      </main>
    </div>
  );
}`
  },
  {
    id: 'database_backup',
    title: 'Database Backup & Settings Export',
    file: 'src/components/SettingsPanel.tsx',
    category: 'Security & Persistence',
    snippet: `// SettingsPanel.tsx Database Snapshot Excerpt
const handleExportData = () => {
  try {
    const p = localStorage.getItem('clinic_patients');
    const i = localStorage.getItem('clinic_invoices');
    const v = localStorage.getItem('clinic_visitation_records');
    const e = localStorage.getItem('clinic_it_events');

    const backupData = {
      backupMetadata: {
        facilityName: BRAND.facilityName,
        exportedAt: new Date().toISOString(),
        operatorRole: role,
        backupVersion: "1.0"
      },
      patients: p ? JSON.parse(p) : patientsListForSwitch,
      invoices: i ? JSON.parse(i) : [],
      visitations: v ? JSON.parse(v) : [],
      itEvents: e ? JSON.parse(e) : []
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = \`clinic_backup_\${new Date().toISOString().split('T')[0]}.json\`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Backup failed", err);
  }
};`
  },
  {
    id: 'it_security_gate',
    title: 'Diagnostic Console & Passcode Gate',
    file: 'src/components/ITSupportPanel.tsx',
    category: 'Access Control',
    snippet: `// ITSupportPanel.tsx Keypad Gate & Audit Logging Excerpt
const handlePasscodeSubmit = (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  if (passcode === '8888') {
    onLogITEvent('OTHER', \`IT Support Section unlocked using function code 8888.\`, 'IT Support (8888)');
    onSetRole('it_support');
    setSessionUnlocked(true);
  } else if (passcode === '3333') {
    onLogITEvent('OTHER', \`Level 3 Ops Code verified.\`, 'Ops Mgr (L3)');
    onSetRole('ops_manager');
    setSessionUnlocked(true);
  } else {
    onLogITEvent('LOGIN_ERROR', \`Unauthorized IT entry attempt. Code: "\${passcode}"\`, 'EXTERNAL_IP', 'ERROR');
    setPinError('Access Denied. Invalid Diagnostic Security Code.');
  }
};`
  },
  {
    id: 'prompt_structure',
    title: 'Patient Diagnostic Prompt Structure',
    file: 'src/components/DiagnosticDatabase.tsx',
    category: 'AI System Prompt',
    snippet: `// System Prompt Structure for Diagnostic Clinical Categorization
SYSTEM_INSTRUCTION:
"You are a clinical decision support assistant. Analyze the patient's chief complaint, vital signs, and historical visitation notes.
Output a JSON response with:
1. Primary differential diagnoses ranked by confidence percentage
2. Recommended follow-up diagnostic panels or imaging
3. Urgency triage classification (Emergent / Urgent / Routine)
4. Red flag clinical indicators to alert attending physician."

USER_PROMPT_PAYLOAD:
Patient: Sarah Jenkins (Age: 42, Sex: F)
Chief Complaint: Acute localized lower right quadrant abdominal discomfort, low-grade pyrexia (100.8°F), nausea.
Vitals: BP 128/82, HR 94, SpO2 98%.
Previous Visit Notes: No prior appendectomy recorded.`
  }
];

export default function CodeAuditPanel({ onLogITEvent, playBeep }: CodeAuditPanelProps) {
  const [selectedPersona, setSelectedPersona] = useState<AuditPersona>('architect');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('app_core');
  
  // Custom code or prompt content
  const [codeContent, setCodeContent] = useState<string>(CODE_PRESETS[0].snippet);
  const [targetContext, setTargetContext] = useState<string>(CODE_PRESETS[0].title);
  
  // Custom System Instruction state
  const [customInstruction, setCustomInstruction] = useState<string>(
    `You are an uncompromising Lead Systems Inspector and Code Quality Specialist. Conduct a surgical breakdown of the provided code/prompt structure. Focus on structural integrity, edge-case resilience, and developer ergonomics.`
  );
  
  const [showSystemInstruction, setShowSystemInstruction] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default system instructions mapped by persona
  const personaInstructions: Record<AuditPersona, { title: string; subtitle: string; icon: any; defaultPrompt: string }> = {
    architect: {
      title: 'Senior Software Architect',
      subtitle: 'Evaluates system topology, coupling, state flow, modularity, & technical debt',
      icon: Building2,
      defaultPrompt: `You are a strict, uncompromising Senior Software Architect with 20+ years of enterprise engineering experience. Evaluate software architecture patterns, component modularity, state management strategy, coupling, scalability bottlenecks, type-safety, and technical debt.`
    },
    security: {
      title: 'Cybersecurity & HIPAA Auditor',
      subtitle: 'Audits OWASP Top 10 vulnerabilities, data leakage, secret exposure, & compliance',
      icon: ShieldCheck,
      defaultPrompt: `You are a relentless Lead Cybersecurity Auditor and HIPAA Compliance Specialist. Evaluate OWASP Top 10 vulnerabilities, sensitive client-side data leaks, unauthenticated endpoints, input sanitization gaps, local storage privacy exposures, and regulatory/HIPAA compliance risks.`
    },
    ux: {
      title: 'UX / UI Design Critic',
      subtitle: 'Reviews visual hierarchy, WCAG 2.1 AA accessibility, touch ergonomics, & anti-slop',
      icon: Palette,
      defaultPrompt: `You are a world-class Senior UX/UI Design Critic and Accessibility Director. Inspect visual hierarchy, typography scaling, component layout ergonomics, WCAG 2.1 AA accessibility compliance, interactive feedback states, empty/error state handling, and anti-pattern / "AI slop" visual design choices.`
    },
    custom: {
      title: 'Custom System Persona',
      subtitle: 'Define your own system instructions & specialized review persona',
      icon: Settings2,
      defaultPrompt: customInstruction
    }
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = CODE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCodeContent(preset.snippet);
      setTargetContext(preset.title);
    }
  };

  const handleRunAudit = async () => {
    if (!codeContent.trim()) {
      setErrorMsg("Please provide code content or select a preset to run the audit.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAuditResult(null);

    try {
      if (IS_DEMO) {
        // Public demo: no server, so use the visitor's own key straight from the browser
        if (!getBrowserAiKey()) {
          openAiKeyDialog();
          throw new Error('Add your own Gemini API key to run a review (the "Add AI key" button at the top). It stays in your browser.');
        }
        setAuditResult(await runAuditInBrowser({ persona: selectedPersona, customSystemInstruction: selectedPersona === 'custom' ? customInstruction : undefined, codeSnippet: codeContent, targetContext }));
        if (playBeep) playBeep();
        return;
      }
      const response = await fetch('/api/audit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedPersona,
          customSystemInstruction: selectedPersona === 'custom' ? customInstruction : undefined,
          codeSnippet: codeContent,
          targetContext: targetContext,
          modelName: DEFAULT_AUDIT_MODEL
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          [data.error, data.details].filter(Boolean).join(" ") || "Server returned an error during audit."
        );
      }

      setAuditResult(data.result);

      if (playBeep) playBeep();
      if (onLogITEvent) {
        onLogITEvent(
          'OTHER',
          `Executed AI Code & Architecture Audit Breakdown (${selectedPersona.toUpperCase()} persona) for "${targetContext}".`,
          'AI Inspector Engine',
          'SUCCESS'
        );
      }
    } catch (err: any) {
      console.error("Audit breakdown request failed:", err);
      setErrorMsg(err.message || "Failed to execute AI code audit. Check server API connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!auditResult) return;
    navigator.clipboard.writeText(auditResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadReport = () => {
    if (!auditResult) return;
    const blob = new Blob([auditResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_audit_report_${selectedPersona}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page action */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-slate-600 flex-1 min-w-[200px]">Pick a reviewer, paste code or a prompt, then run the review. {IS_DEMO ? 'Uses your own AI key (top bar).' : 'Uses the AI key set in Setup & integrations.'}</p>
        <button
          type="button"
          onClick={handleRunAudit}
          disabled={isLoading}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Reviewing…</> : <><Sparkles className="w-4 h-4" /> Run review</>}
        </button>
      </div>

      {/* STEP 1: PERSONA SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-600" />
              <span>Step 1: Select Reviewer Persona & System Instruction</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the evaluation perspective and system prompt framework Gemini will enforce.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSystemInstruction(!showSystemInstruction)}
            className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showSystemInstruction ? "Hide System Instruction" : "Inspect System Instruction"}</span>
            {showSystemInstruction ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(personaInstructions) as AuditPersona[]).map((key) => {
            const persona = personaInstructions[key];
            const IconComponent = persona.icon;
            const isSelected = selectedPersona === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPersona(key)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{persona.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{persona.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* SYSTEM INSTRUCTION DRAWER / CUSTOMIZER */}
        {showSystemInstruction && (
          <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 text-xs font-mono space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800 pb-2">
              <span className="text-teal-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-teal-400" />
                Active Gemini System Instruction ({selectedPersona.toUpperCase()})
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Passed as config.systemInstruction</span>
            </div>

            {selectedPersona === 'custom' ? (
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Type custom system instructions here..."
              />
            ) : (
              <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                {personaInstructions[selectedPersona].defaultPrompt}
              </p>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: CODE OR PROMPT STRUCTURE SELECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-teal-600" />
              <span>Step 2: Select or Input Code Snippet / Prompt Structure</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an existing core app component excerpt or paste a custom code snippet / system prompt payload.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CODE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                className={`text-[10.5px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedPresetId === preset.id
                    ? 'bg-slate-900 text-teal-400 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <input
              type="text"
              value={targetContext}
              onChange={(e) => setTargetContext(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 w-full max-w-md"
              placeholder="Target Context Name (e.g. App Core Architecture)"
            />
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {codeContent.split('\n').length} lines • {codeContent.length} chars
            </span>
          </div>

          <textarea
            value={codeContent}
            onChange={(e) => {
              setCodeContent(e.target.value);
              setSelectedPresetId('custom');
            }}
            rows={10}
            className="w-full bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 leading-relaxed scrollbar-thin"
            placeholder="Paste TypeScript code snippet, component code, or AI system prompt structure here..."
          />
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 3: AUDIT RESULTS DISPLAY */}
      {auditResult && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Detailed AI Audit Breakdown Report
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by <strong className="text-slate-800 font-mono">{personaInstructions[selectedPersona].title}</strong> on {targetContext}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? "Copied Report!" : "Copy Report"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Export Markdown</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-slate-800 text-xs leading-relaxed space-y-3 font-sans overflow-x-auto">
            <div className="prose prose-slate max-w-none text-xs leading-relaxed font-sans whitespace-pre-wrap">
              {auditResult}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
