import Database from 'better-sqlite3'
import { resolve } from 'node:path'

const db = new Database(resolve(import.meta.dirname, '../../../settings.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

async function deriveKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(
    process.env.SETTINGS_ENCRYPTION_KEY ?? 'voc-local-encryption-key-change-me',
  )
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encrypt(plaintext: string): Promise<{ data: string; iv: string }> {
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return {
    data: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  }
}

async function decrypt(data: string, iv: string): Promise<string> {
  const key = await deriveKey()
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(iv, 'base64') },
    key,
    Buffer.from(data, 'base64'),
  )
  return new TextDecoder().decode(plaintext)
}

export async function saveCredentials(id: string, password: string): Promise<void> {
  const [encId, encPw] = await Promise.all([encrypt(id), encrypt(password)])
  const value = JSON.stringify({ id: encId, pw: encPw })
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('credentials', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(value, new Date().toISOString())
}

export async function saveLlmConfig(config: Record<string, unknown>): Promise<void> {
  const enc = await encrypt(JSON.stringify(config))
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('llm_config', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(JSON.stringify(enc), new Date().toISOString())
}

export async function getLlmConfig(): Promise<Record<string, unknown> | null> {
  const row = db
    .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
    .get('llm_config')
  if (!row) return null

  const { data, iv } = JSON.parse(row.value) as { data: string; iv: string }
  return JSON.parse(await decrypt(data, iv))
}

export async function getCredentials(): Promise<{ id: string; password: string } | null> {
  const row = db
    .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
    .get('credentials')
  if (!row) return null

  const { id, pw } = JSON.parse(row.value) as {
    id: { data: string; iv: string }
    pw: { data: string; iv: string }
  }
  const [decId, decPw] = await Promise.all([decrypt(id.data, id.iv), decrypt(pw.data, pw.iv)])
  return { id: decId, password: decPw }
}
