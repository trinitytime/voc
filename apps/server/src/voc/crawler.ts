import { pluginManager } from '../plugin/manager'
import {
  articleText,
  getLastSyncedAt,
  setLastSyncedAt,
  upsertVoc,
  countItems,
} from '../db/voc'
import { embed, summarizeArticle } from '../llm/openai'
import type { VocArticle, VocListResult } from '../types'

export interface SyncReport {
  startedAt: string
  finishedAt: string
  scanned: number
  ingested: number
  errors: string[]
  lastSyncedAt: string
}

let running = false
let lastReport: SyncReport | null = null

export function getLastReport(): SyncReport | null {
  return lastReport
}

export function isRunning(): boolean {
  return running
}

export async function syncOnce(): Promise<SyncReport> {
  if (running) throw new Error('Sync already in progress')
  running = true
  const startedAt = new Date().toISOString()
  const errors: string[] = []
  let scanned = 0
  let ingested = 0

  try {
    if (!pluginManager.has('fetchList') || !pluginManager.has('fetchItem')) {
      throw new Error('활성 플러그인에 fetchList/fetchItem 함수가 없습니다.')
    }

    const since = getLastSyncedAt() ?? undefined
    const list = await pluginManager.call<VocListResult>('fetchList', since)
    scanned = list.items.length

    if (scanned > 0) {
      // 1. Fetch raw articles
      const articles: VocArticle[] = []
      for (const it of list.items) {
        try {
          const article = await pluginManager.call<VocArticle | null>('fetchItem', it.id)
          if (article) articles.push(article)
        } catch (err) {
          errors.push(`fetchItem(${it.id}): ${(err as Error).message}`)
        }
      }

      // 2. Summarize each article with LLM (sequential to avoid rate limits)
      const reports: string[] = []
      for (const article of articles) {
        try {
          const report = await summarizeArticle(article)
          reports.push(report)
        } catch (err) {
          errors.push(`summarize(${article.id}): ${(err as Error).message}`)
          reports.push('')
        }
      }

      // 3. Embed reports in batches of 32, then upsert
      const BATCH = 32
      for (let i = 0; i < articles.length; i += BATCH) {
        const slice = articles.slice(i, i + BATCH)
        const reportSlice = reports.slice(i, i + BATCH)
        // Use report text for embedding; fall back to raw content when report is empty
        const texts = slice.map((a, j) => reportSlice[j] || articleText(a))
        try {
          const vectors = await embed(texts)
          for (let j = 0; j < slice.length; j++) {
            const a = slice[j]!
            const v = vectors[j]
            if (!v) {
              errors.push(`embedding missing for ${a.id}`)
              continue
            }
            upsertVoc(a, reportSlice[j] ?? '', v)
            ingested++
          }
        } catch (err) {
          errors.push(`embed batch: ${(err as Error).message}`)
        }
      }
    }

    const finishedAt = new Date().toISOString()
    setLastSyncedAt(finishedAt)
    lastReport = { startedAt, finishedAt, scanned, ingested, errors, lastSyncedAt: finishedAt }
    return lastReport
  } finally {
    running = false
  }
}

let timer: ReturnType<typeof setInterval> | null = null

export function startScheduler(intervalMs: number): void {
  stopScheduler()
  const tick = async () => {
    try {
      const report = await syncOnce()
      console.log(
        `[crawler] sync ok scanned=${report.scanned} ingested=${report.ingested} errors=${report.errors.length}`,
      )
    } catch (err) {
      console.warn(`[crawler] sync skipped: ${(err as Error).message}`)
    }
  }
  // Fire first tick on next event-loop turn (don't block server startup).
  setTimeout(tick, 0)
  timer = setInterval(tick, intervalMs)
}

export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function summary() {
  return {
    running,
    itemCount: countItems(),
    lastSyncedAt: getLastSyncedAt(),
    lastReport,
  }
}
