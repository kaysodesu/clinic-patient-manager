import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createStore } from "./store";
import { createAuth } from "./auth";
import { isSharedKey } from "./src/shared/storageKeys";

dotenv.config();

const app = express();
// Hosting platforms (Render, Cloud Run, ...) tell the app which port to use
const PORT = Number(process.env.PORT) || 3000;
const store = createStore();

// === OPTIONAL AI KEY ===
// Each clinic brings its own Gemini key: either GEMINI_API_KEY in the environment, or pasted by an
// administrator in Setup & integrations (stored server-side, never sent to browsers).
const ENV_GEMINI_KEY =
  process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? process.env.GEMINI_API_KEY : undefined;
const INTEGRATIONS_KEY = "settings_integrations";

let cachedAi: { key: string; client: GoogleGenAI } | null = null;
async function getGeminiKey(): Promise<{ key: string; source: "environment" | "app" } | null> {
  if (ENV_GEMINI_KEY) return { key: ENV_GEMINI_KEY, source: "environment" };
  const saved = (await store.get(INTEGRATIONS_KEY)) as { geminiApiKey?: string } | undefined;
  return saved?.geminiApiKey ? { key: saved.geminiApiKey, source: "app" } : null;
}
// Gemini client is only created when a key exists; otherwise the SDK falls back to
// Google Cloud default credentials and fails with a confusing error.
async function getAi(): Promise<GoogleGenAI | null> {
  const found = await getGeminiKey();
  if (!found) return null;
  if (cachedAi?.key !== found.key) cachedAi = { key: found.key, client: new GoogleGenAI({ apiKey: found.key }) };
  return cachedAi.client;
}

app.use(express.json({ limit: "10mb" }));

// API Route: Healthcheck (left outside the password gate so the host can check it)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", storage: store.kind, timestamp: new Date().toISOString() });
});

// Staff accounts and sessions: /api/auth/* is public (status, first-run setup, sign in);
// every other /api route requires a signed-in staff member.
const auth = createAuth(store);
app.use(auth.loadSession);
app.use(auth.router);
app.use("/api", auth.requireUser);

// === CLINICAL DATA, PERSISTED IN THE KEY/VALUE STORE ===
const asyncRoute =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response) => {
    fn(req, res).catch(err => {
      console.error(`Error in ${req.method} ${req.path}:`, err);
      res.status(500).json({ error: "Storage error.", details: err?.message || String(err) });
    });
  };

const getList = async (key: string): Promise<any[]> => {
  const value = await store.get(key);
  return Array.isArray(value) ? value : [];
};

// Legacy list endpoints used by the data hooks; each maps to a browser-storage key name
const listRoutes: Record<string, string> = {
  "/api/patients": "clinic_patients",
  "/api/invoices": "clinic_invoices",
  "/api/visitations": "clinic_visitation_records",
  "/api/progress-notes": "clinic_progress_notes",
};

for (const [route, key] of Object.entries(listRoutes)) {
  app.get(route, asyncRoute(async (_req, res) => {
    res.json(await getList(key));
  }));

  app.post(route, asyncRoute(async (req, res) => {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Invalid payload: list must be an array." });
    }
    await store.set(key, req.body);
    res.json({ success: true, count: req.body.length });
  }));
}

// API Route: Confirm Patient Merge
app.post("/api/patients/merge", asyncRoute(async (req, res) => {
  const { masterId, dupeId } = req.body;
  console.log(`[HIPAA Secure Service] Merging duplicate record ${dupeId} into clinical master ${masterId}`);

  // Re-point invoices & visitations from the duplicate to the master record
  for (const key of ["clinic_invoices", "clinic_visitation_records"]) {
    const list = await getList(key);
    await store.set(key, list.map(item => (item.patientId === dupeId ? { ...item, patientId: masterId } : item)));
  }

  res.json({ success: true, message: `Successfully merged and logged de-duplication of patient records.` });
}));

// Generic shared storage: the browser mirrors its clinic data keys here so all users see the same records
app.get("/api/store", asyncRoute(async (_req, res) => {
  const all = await store.getAll();
  res.json(Object.fromEntries(Object.entries(all).filter(([key]) => isSharedKey(key))));
}));

app.put("/api/store/:key", asyncRoute(async (req, res) => {
  const { key } = req.params;
  if (!isSharedKey(key)) {
    return res.status(400).json({ error: `Key "${key}" is not shared storage.` });
  }
  if (!req.body || !("value" in req.body)) {
    return res.status(400).json({ error: "Body must be { value }." });
  }
  await store.set(key, req.body.value);
  res.json({ success: true });
}));

// === SETUP & INTEGRATIONS (administrators) ===
// Reports what still needs configuring and lets the clinic store its own AI key.
app.get("/api/settings/integrations", auth.requireRole("admin"), asyncRoute(async (_req, res) => {
  const gemini = await getGeminiKey();
  res.json({
    storage: store.kind, // "postgres" = durable; "memory" = lost on restart
    sessionSecretSet: Boolean(process.env.SESSION_SECRET),
    gemini: gemini ? { configured: true, source: gemini.source, hint: `••••${gemini.key.slice(-4)}` } : { configured: false },
  });
}));

app.put("/api/settings/integrations", auth.requireRole("admin"), asyncRoute(async (req, res) => {
  if (ENV_GEMINI_KEY) {
    return res.status(400).json({ error: "The AI key is set in the server environment (GEMINI_API_KEY). Change it there." });
  }
  const { geminiApiKey } = req.body ?? {};
  if (geminiApiKey === null || geminiApiKey === "") {
    await store.set(INTEGRATIONS_KEY, {});
    return res.json({ success: true, gemini: { configured: false } });
  }
  if (typeof geminiApiKey !== "string" || geminiApiKey.trim().length < 20 || /\s/.test(geminiApiKey.trim())) {
    return res.status(400).json({ error: "That doesn't look like a Gemini API key. Copy it again from Google AI Studio." });
  }
  const key = geminiApiKey.trim();
  await store.set(INTEGRATIONS_KEY, { geminiApiKey: key });
  res.json({ success: true, gemini: { configured: true, source: "app", hint: `••••${key.slice(-4)}` } });
}));

// API Route: AI Code & Architecture Audit Breakdown
app.post("/api/audit-code", auth.requireRole("admin", "it_support"), async (req, res) => {
  try {
    const {
      persona = "architect",
      customSystemInstruction,
      codeSnippet = "",
      targetContext = "App Core Codebase",
      modelName = "gemini-3.6-flash"
    } = req.body;

    if (!codeSnippet || typeof codeSnippet !== "string" || !codeSnippet.trim()) {
      return res.status(400).json({ error: "Code snippet or prompt structure content is required for audit analysis." });
    }

    const ai = await getAi();
    if (!ai) {
      return res.status(503).json({
        error: "AI audit is not configured.",
        details: "An administrator can add your clinic's Gemini API key in Setup & integrations."
      });
    }

    let systemInstruction = "";

    switch (persona) {
      case "architect":
        systemInstruction = `You are a strict, uncompromising Senior Software Architect with 20+ years of enterprise engineering experience. 
Your objective is to perform a deep architectural breakdown of the provided web application code or prompt structure.
Evaluate software architecture patterns, component modularity, state management strategy, coupling, scalability bottlenecks, type-safety, and technical debt. 
Be direct, authoritative, and highly analytical.

Format your analysis cleanly in structured Markdown using the following headings:
# 🏗️ Architectural Audit Breakdown: ${targetContext}

## 📊 Scorecard & Rating
- **Overall Grade**: [A / B / C / D / F]
- **Modularity & Separation**: [Rating /10]
- **State Efficiency & Scalability**: [Rating /10]
- **Maintainability Index**: [High / Medium / Low]

## 🌟 Key Architectural Strengths
List 2-4 well-executed patterns or structural choices in the code.

## ⚠️ Critical Flaws & Anti-Patterns
Identify structural bottlenecks, prop drilling, bloated component boundaries, state duplication, or tight coupling.

## 🛠️ Concrete Refactoring Roadmap
Provide bulleted, actionable step-by-step refactoring recommendations and code snippets to elevate the system architecture.`;
        break;

      case "security":
        systemInstruction = `You are a relentless Lead Cybersecurity Auditor and HIPAA Compliance Specialist. 
Your objective is to conduct a strict security and privacy code breakdown of the provided web application code or prompt structure.
Evaluate OWASP Top 10 vulnerabilities, sensitive client-side data leaks, unauthenticated endpoints, input sanitization gaps, local storage privacy exposures, and regulatory/HIPAA compliance risks. 
Be uncompromising, precise, and threat-oriented.

Format your analysis cleanly in structured Markdown using the following headings:
# 🛡️ Cybersecurity & HIPAA Compliance Breakdown: ${targetContext}

## 📊 Security & Compliance Scorecard
- **Threat Risk Level**: [CRITICAL / HIGH / MEDIUM / LOW / PASSED]
- **OWASP Top 10 Vulnerabilities Identified**: [Count & Categories]
- **HIPAA / PHI Exposure Index**: [Compliant / At Risk / Severe Violation]
- **Overall Security Grade**: [A / B / C / D / F]

## 🚨 Vulnerability & Threat Findings
Detail specific lines, functions, or patterns that pose security or data leakage risks.

## 🔒 Privacy & Compliance Gaps
Detail any local storage, unencrypted state, audit logging, or access control deficiencies.

## 🛡️ Immediate Hardening Actions
Provide clear, step-by-step security patch recommendations and secure code patterns.`;
        break;

      case "ux":
        systemInstruction = `You are a world-class Senior UX/UI Design Critic and Accessibility Director. 
Your objective is to evaluate the provided web application code, layout structures, and user interface components.
Inspect visual hierarchy, typography scaling, component layout ergonomics, WCAG 2.1 AA accessibility compliance, interactive feedback states, empty/error state handling, and anti-pattern / "AI slop" visual design choices. 
Be sharp, constructive, and design-minded.

Format your analysis cleanly in structured Markdown using the following headings:
# 🎨 UX / UI & Design System Critique Breakdown: ${targetContext}

## 📊 UX & Accessibility Scorecard
- **Usability & Ergonomics Score**: [Score /10]
- **WCAG 2.1 AA Accessibility**: [Passed / Needs Improvement / Failed]
- **Visual Rhythm & Design Polish**: [A / B / C / D / F]

## ✨ Usability & Design Highlights
List effective interface decisions, clear typography pairings, or responsive interactions.

## 🎨 Design Deficiencies & Ergonomic Anti-Patterns
Highlight layout clutter, awkward touch targets, contrast issues, missing keyboard focus states, or unhandled loading/empty states.

## 🚀 Recommended UX & Styling Enhancements
Provide specific visual, spatial, and Tailwind/React code adjustments to polish the user experience.`;
        break;

      case "custom":
      default:
        systemInstruction = customSystemInstruction || `You are an expert software reviewer analyzing web application code or prompt structures. Provide a detailed, objective breakdown.`;
        break;
    }

    const promptText = `Please analyze the following application code / prompt structure context (${targetContext}):

\`\`\`typescript
${codeSnippet}
\`\`\`

Provide your detailed audit breakdown adhering strictly to your persona system instructions.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    const auditOutput = response.text || "No audit output generated.";

    return res.json({
      success: true,
      persona,
      systemInstructionUsed: systemInstruction,
      targetContext,
      result: auditOutput,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error in /api/audit-code endpoint:", error);
    return res.status(500).json({
      error: "Failed to perform AI code audit.",
      details: error?.message || String(error)
    });
  }
});

async function startServer() {
  await store.init();
  console.log(`Clinic data storage: ${store.kind}${store.kind === "memory" ? " (data is lost when the server restarts; set DATABASE_URL for Postgres)" : ""}`);

  // The bundled build (dist/server.cjs) always serves the built files, so `npm start`
  // works on Windows without having to set NODE_ENV.
  const isProduction =
    process.env.NODE_ENV === "production" || (process.argv[1] ?? "").endsWith("server.cjs");
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
