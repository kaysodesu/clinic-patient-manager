// Mirrors the clinic data parts of localStorage to the server so every user of the
// site works on the same records. Components keep using localStorage as before.
import { isSharedKey } from './shared/storageKeys';

const PUSH_DELAY_MS = 400;
const pendingPushes = new Map<string, ReturnType<typeof setTimeout>>();

// Arrays/objects are stored as JSON on the server; anything else as the raw string
function toServerValue(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object') return parsed;
  } catch {
    // not JSON - keep the raw string
  }
  return raw;
}

function pushNow(key: string, keepalive = false) {
  const value = toServerValue(localStorage.getItem(key));
  fetch(`/api/store/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
    keepalive,
  }).catch(err => console.warn(`Failed to sync "${key}" to the server:`, err));
}

function schedulePush(key: string) {
  const existing = pendingPushes.get(key);
  if (existing) clearTimeout(existing);
  pendingPushes.set(
    key,
    setTimeout(() => {
      pendingPushes.delete(key);
      pushNow(key);
    }, PUSH_DELAY_MS)
  );
}

function flushPendingPushes() {
  for (const [key, timer] of pendingPushes) {
    clearTimeout(timer);
    pushNow(key, true);
  }
  pendingPushes.clear();
}

/** Loads shared data from the server into localStorage, then keeps the server updated. */
export async function startSharedStorage(): Promise<void> {
  let serverData: Record<string, unknown> | null = null;
  // Retry briefly: free hosting can take a moment to wake up
  for (let attempt = 0; attempt < 4 && !serverData; attempt++) {
    try {
      const res = await fetch('/api/store');
      if (res.ok) serverData = await res.json();
    } catch (err) {
      console.warn('Loading shared clinic data failed, retrying...', err);
    }
    if (!serverData) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }

  if (!serverData) {
    // Never upload this browser's possibly out-of-date copy over everyone else's records
    console.warn('Could not load shared clinic data; changes in this session will NOT be shared.');
    return;
  }

  {
    // The server is the source of truth: drop local copies it doesn't have...
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && isSharedKey(key) && !(key in serverData)) localStorage.removeItem(key);
    }
    // ...and load the ones it does
    for (const [key, value] of Object.entries(serverData)) {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage && isSharedKey(key)) schedulePush(key);
  };
  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem.call(this, key);
    if (this === window.localStorage && isSharedKey(key)) schedulePush(key);
  };

  window.addEventListener('pagehide', flushPendingPushes);
}
