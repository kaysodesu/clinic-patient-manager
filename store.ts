// Server-side key/value store for clinic data.
// Uses Postgres when DATABASE_URL is set (durable, shared by all users);
// otherwise keeps data in memory, which is fine for local development only.
import pg from "pg";

export interface KeyValueStore {
  readonly kind: "postgres" | "memory";
  init(): Promise<void>;
  getAll(): Promise<Record<string, unknown>>;
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

class MemoryStore implements KeyValueStore {
  readonly kind = "memory" as const;
  private data = new Map<string, unknown>();
  async init() {}
  async getAll() {
    return Object.fromEntries(this.data);
  }
  async get(key: string) {
    return this.data.get(key);
  }
  async set(key: string, value: unknown) {
    this.data.set(key, value);
  }
}

class PostgresStore implements KeyValueStore {
  readonly kind = "postgres" as const;
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 5 });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_store (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  async getAll() {
    const { rows } = await this.pool.query<{ key: string; value: unknown }>(
      "SELECT key, value FROM clinic_store"
    );
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  async get(key: string) {
    const { rows } = await this.pool.query<{ value: unknown }>(
      "SELECT value FROM clinic_store WHERE key = $1",
      [key]
    );
    return rows[0]?.value;
  }

  async set(key: string, value: unknown) {
    await this.pool.query(
      `INSERT INTO clinic_store (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
  }
}

export function createStore(): KeyValueStore {
  const url = process.env.DATABASE_URL;
  return url ? new PostgresStore(url) : new MemoryStore();
}
