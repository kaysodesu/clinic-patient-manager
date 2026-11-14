// Demo build (VITE_DEMO_MODE=true): runs as a static page with no server, for example as a
// shareable preview link. Data stays in the visitor's browser, and browser pop-ups (which some
// hosts block) are replaced with on-screen notices.

function showNotice(message: string) {
  let host = document.getElementById('demo-notices');
  if (!host) {
    host = document.createElement('div');
    host.id = 'demo-notices';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    Object.assign(host.style, {
      position: 'fixed', top: 'calc(36px + env(safe-area-inset-top, 0px))', left: '50%',
      transform: 'translateX(-50%)', zIndex: '120', display: 'flex', flexDirection: 'column',
      gap: '8px', width: 'min(440px, calc(100vw - 32px))', pointerEvents: 'none',
    });
    document.body.appendChild(host);
  }
  const note = document.createElement('div');
  note.textContent = message;
  Object.assign(note.style, {
    background: '#0f172a', color: '#f8fafc', border: '1px solid #2dd4bf', borderRadius: '12px',
    padding: '10px 14px', fontSize: '13px', lineHeight: '1.45', whiteSpace: 'pre-line',
    boxShadow: '0 12px 30px rgba(2,6,23,.35)', fontFamily: 'Inter, system-ui, sans-serif',
  });
  host.appendChild(note);
  setTimeout(() => note.remove(), Math.min(9000, 3500 + message.length * 30));
}

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => (data.has(key) ? data.get(key)! : null),
    key: i => Array.from(data.keys())[i] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, String(value)); },
  };
}

export function installDemoMode() {
  // Storage can be blocked (private windows, embedded previews): fall back to memory
  try {
    localStorage.setItem('__demo_probe', '1');
    localStorage.removeItem('__demo_probe');
  } catch {
    try {
      Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), configurable: true });
    } catch { /* keep going without persistence */ }
  }

  // No server in the demo: API calls fail fast so the app uses browser storage instead
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = url.replace(window.location.origin, '');
    if (path.startsWith('/api/')) {
      return Promise.resolve(new Response(
        JSON.stringify({ error: 'Not available in the demo.', details: 'This feature needs the full server version of the app.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    return realFetch(input, init);
  };

  window.alert = (message?: unknown) => showNotice(String(message ?? ''));
  window.confirm = (message?: string) => {
    showNotice(`${message ?? ''}\n(Confirmed automatically in the demo.)`);
    return true;
  };
  window.prompt = (message?: string) => {
    // The beta shows each access code in its question, e.g. "Enter Level 1 Code (1111):"
    const code = message?.match(/\((\d{4})\)|'(\d{4})'/);
    const value = code ? code[1] || code[2] : null;
    showNotice(value ? `Demo: entered access code ${value} for you.` : String(message ?? ''));
    return value;
  };
}
