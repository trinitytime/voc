import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getCredentials, getLlmConfig, saveLlmConfig, saveCredentials } from './db/settings'
import { bootstrapPlugins, pluginManager, discoverWithMeta, writeState } from './plugin/manager'
import { startScheduler, syncOnce, summary as crawlerSummary, isRunning } from './voc/crawler'
import { searchVoc } from './voc/search'

export const EXIT_RESTART = 42;

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------

app.post('/api/settings/credentials', async (c) => {
  const body = await c.req.json<{ id: string; password: string }>()
  if (!body.id || !body.password) {
    return c.json({ error: '아이디와 비밀번호를 입력해 주세요.' }, 400)
  }
  await saveCredentials(body.id, body.password)
  return c.json({ ok: true })
})

app.post('/api/settings/llm', async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  await saveLlmConfig(body)
  return c.json({ ok: true })
})

app.get('/api/settings/llm', async (c) => {
  const config = await getLlmConfig()
  if (!config) return c.json(null, 404)
  return c.json(config)
})

app.get('/api/settings/credentials', async (c) => {
  const stored = await getCredentials()
  if (!stored) return c.json({ stored: false }, 404)
  return c.json({ stored: true, id: stored.id })
})

// ---------------------------------------------------------------------------
// plugins
// ---------------------------------------------------------------------------

app.get('/api/plugins', async (c) => {
  const plugins = await discoverWithMeta()
  return c.json({ active: pluginManager.getActive(), plugins })
})

app.post('/api/plugins/state', async (c) => {
  const body = await c.req.json<Record<string, boolean>>()
  await writeState(body)
  setTimeout(() => process.exit(EXIT_RESTART), 2000)
  return c.json({ ok: true, restarting: true })
})

// ---------------------------------------------------------------------------
// voc — sync + search
// ---------------------------------------------------------------------------

app.get('/api/voc/status', (c) => c.json(crawlerSummary()))

app.post('/api/voc/sync', async (c) => {
  if (isRunning()) return c.json({ error: '이미 동기화가 진행 중입니다.' }, 409)
  try {
    const report = await syncOnce()
    return c.json(report)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500)
  }
})

app.post('/api/voc/search', async (c) => {
  const body = await c.req.json<{ q?: string; k?: number }>()
  const q = (body.q ?? '').toString()
  const k = Math.max(1, Math.min(20, Number(body.k) || 5))
  if (!q.trim()) return c.json({ error: '질문을 입력해 주세요.' }, 400)
  try {
    const result = await searchVoc(q, k)
    return c.json(result)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500)
  }
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// ---------------------------------------------------------------------------
// bootstrap
// ---------------------------------------------------------------------------

const SYNC_INTERVAL_MS = Number(process.env.VOC_SYNC_INTERVAL_MS ?? 5 * 60 * 1000) // 5 min

await bootstrapPlugins()
startScheduler(SYNC_INTERVAL_MS)

serve({ fetch: app.fetch, port: 8787 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
