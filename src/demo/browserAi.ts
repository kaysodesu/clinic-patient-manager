// Public demo only: visitors can add their own Gemini API key. It is saved in their browser
// only and sent straight to Google, never to us.
import { buildAuditRequest, DEFAULT_AUDIT_MODEL } from '../shared/auditPrompts';

const KEY = 'cpm_demo_gemini_key';
const MODEL = 'cpm_demo_gemini_model';
export const OPEN_AI_KEY_EVENT = 'cpm:open-ai-key';

const get = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const set = (k: string, v: string) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* blocked */ } };

export const getBrowserAiKey = () => get(KEY);
export const getBrowserAiModel = () => get(MODEL) || DEFAULT_AUDIT_MODEL;
export function saveBrowserAi(key: string, model: string) {
  set(KEY, key.trim());
  set(MODEL, model.trim() === DEFAULT_AUDIT_MODEL ? '' : model.trim());
}
export const openAiKeyDialog = () => window.dispatchEvent(new Event(OPEN_AI_KEY_EVENT));

export async function runAuditInBrowser(req: { persona: string; customSystemInstruction?: string; codeSnippet: string; targetContext: string }) {
  const apiKey = getBrowserAiKey();
  if (!apiKey) throw new Error('Add your Gemini API key first (the "AI key" button in the top bar).');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const { systemInstruction, promptText } = buildAuditRequest(req);
  try {
    const response = await ai.models.generateContent({
      model: getBrowserAiModel(),
      contents: promptText,
      config: { systemInstruction, temperature: 0.2 },
    });
    return response.text || 'No audit output generated.';
  } catch (err) {
    throw new Error(friendlyAiError(err));
  }
}

function friendlyAiError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|API key not valid/i.test(msg)) return "Google says this API key isn't valid. Open \"AI key\" at the top and paste the key again.";
  if (/PERMISSION_DENIED|403/.test(msg)) return "This key isn't allowed to use the Gemini API. Check the key's settings in Google AI Studio.";
  if (/NOT_FOUND|404|not found for API version/i.test(msg)) return `The model "${getBrowserAiModel()}" isn't available for this key. Open "AI key" and try another model name (for example gemini-2.5-flash).`;
  if (/RESOURCE_EXHAUSTED|429|quota/i.test(msg)) return 'Your key has hit its usage limit. Wait a minute and try again.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return "Couldn't reach Google. Check your internet connection and try again.";
  return 'The AI request failed: ' + msg.slice(0, 200);
}
