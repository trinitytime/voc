import { Database } from 'bun:sqlite'
import { resolve } from 'node:path'
import * as sqliteVec from 'sqlite-vec'
import type { VocArticle, VocSearchHit } from '../types'

export const EMBEDDING_DIM = 1536 // text-embedding-3-small default

const dbPath = resolve(import.meta.dir, '../../../voc.db')
const db = new Database(dbPath, { create: true })
db.run('PRAGMA journal_mode = WAL')

// Bun bundles its own SQLite; enable extension loading then load sqlite-vec.
// loadExtension is exposed on the Database instance.
sqliteVec.load(db as unknown as { loadExtension: (file: string, ep?: string) => void })

db.run(`
  CREATE TABLE IF NOT EXISTS voc_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    article_json TEXT NOT NULL,
    content_text TEXT NOT NULL,
    report_text TEXT,
    updated_at TEXT NOT NULL,
    embedded_at TEXT NOT NULL,
    rowid_alias INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_voc_items_updated ON voc_items(updated_at);

  CREATE TABLE IF NOT EXISTS crawl_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// Migration: add report_text column if it doesn't exist yet
const cols = db.query<{ name: string }, []>('PRAGMA table_info(voc_items)').all()
if (!cols.some((c) => c.name === 'report_text')) {
  db.run('ALTER TABLE voc_items ADD COLUMN report_text TEXT')
}

db.run(`
  CREATE VIRTUAL TABLE IF NOT EXISTS vec_voc USING vec0(
    item_id TEXT PRIMARY KEY,
    embedding float[${EMBEDDING_DIM}]
  );
`)

export function getLastSyncedAt(): string | null {
  const row = db
    .query<{ value: string }, [string]>('SELECT value FROM crawl_state WHERE key = ?')
    .get('last_synced_at')
  return row?.value ?? null
}

export function setLastSyncedAt(iso: string): void {
  db.run(
    `INSERT INTO crawl_state (key, value) VALUES ('last_synced_at', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [iso],
  )
}

export function articleText(article: VocArticle): string {
  const blocks = (article.content ?? []).map((b) => `[${b.type}] ${b.text}`).join('\n')
  const meta = [article.category, article.status, article.priority, article.channel]
    .filter(Boolean)
    .join(' / ')
  return `${article.title}\n${meta}\n${blocks}`.trim()
}

function vectorToBlob(vec: number[]): Uint8Array {
  const buf = new Float32Array(vec)
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

export function upsertVoc(article: VocArticle, report: string, embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `Embedding length mismatch: got ${embedding.length}, expected ${EMBEDDING_DIM}`,
    )
  }
  const text = articleText(article)
  const now = new Date().toISOString()
  const tx = db.transaction(() => {
    db.run(
      `INSERT INTO voc_items (id, title, article_json, content_text, report_text, updated_at, embedded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         article_json = excluded.article_json,
         content_text = excluded.content_text,
         report_text = excluded.report_text,
         updated_at = excluded.updated_at,
         embedded_at = excluded.embedded_at`,
      [article.id, article.title, JSON.stringify(article), text, report, article.updatedAt, now],
    )
    db.run(`DELETE FROM vec_voc WHERE item_id = ?`, [article.id])
    db.run(`INSERT INTO vec_voc (item_id, embedding) VALUES (?, ?)`, [
      article.id,
      vectorToBlob(embedding),
    ])
  })
  tx()
}

export function countItems(): number {
  const row = db.query<{ n: number }, []>(`SELECT COUNT(*) AS n FROM voc_items`).get()
  return row?.n ?? 0
}

export function searchSimilar(queryEmbedding: number[], k = 5): VocSearchHit[] {
  if (queryEmbedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `Query embedding length mismatch: got ${queryEmbedding.length}, expected ${EMBEDDING_DIM}`,
    )
  }
  const blob = vectorToBlob(queryEmbedding)
  const rows = db
    .query<
      { item_id: string; distance: number; article_json: string },
      [Uint8Array, number]
    >(
      `SELECT v.item_id, v.distance, i.article_json
       FROM vec_voc v
       JOIN voc_items i ON i.id = v.item_id
       WHERE v.embedding MATCH ? AND k = ?
       ORDER BY v.distance ASC`,
    )
    .all(blob, k)

  return rows.map((row) => {
    const article = JSON.parse(row.article_json) as VocArticle
    return { ...article, score: 1 / (1 + row.distance) }
  })
}
