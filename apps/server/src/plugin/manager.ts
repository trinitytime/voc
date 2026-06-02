import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Plugin, registry, type PluginAPI } from './index'
import { getCredentials } from '../db/settings'

const PLUGINS_ROOT = resolve(import.meta.dir, '../../../../plugins')
const STATE_FILE = resolve(PLUGINS_ROOT, 'plugins.json')

// ---------------------------------------------------------------------------
// State file — { [pluginId]: boolean }
// ---------------------------------------------------------------------------

async function readState(): Promise<Record<string, boolean>> {
  try {
    return await Bun.file(STATE_FILE).json()
  } catch {
    return {}
  }
}

export async function writeState(state: Record<string, boolean>): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2))
}

// ---------------------------------------------------------------------------
// Plugin manager
// ---------------------------------------------------------------------------

export interface LoadedPlugin {
  id: string
  instance: Plugin
}

export interface PluginInfo {
  id: string
  name: string
  version: string
  description?: string
  enabled: boolean
  loaded: boolean
}

class PluginManager {
  private loaded = new Map<string, LoadedPlugin>()
  private activeId: string | null = null

  async discover(): Promise<string[]> {
    try {
      const entries = await readdir(PLUGINS_ROOT, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      return []
    }
  }

  async load(id: string): Promise<LoadedPlugin> {
    if (this.loaded.has(id)) return this.loaded.get(id)!

    const pkgPath = resolve(PLUGINS_ROOT, id, 'package.json')
    const pkg = await Bun.file(pkgPath).json()
    const entry = pkg.module ?? pkg.main ?? 'src/index.ts'
    const entryPath = resolve(PLUGINS_ROOT, id, entry)
    const mod = await import(pathToFileURL(entryPath).href)
    const Ctor = mod.default
    if (typeof Ctor !== 'function') {
      throw new Error(`Plugin "${id}" has no default export class`)
    }

    const api: PluginAPI = {
      log: (msg: string) => console.log(`[plugin:${id}] ${msg}`),
      getCredentials,
    }
    const instance: Plugin = new Ctor(api)
    instance.pluginId = id
    await instance.onLoad()

    const loaded = { id, instance }
    this.loaded.set(id, loaded)
    return loaded
  }

  async unload(id: string): Promise<void> {
    const lp = this.loaded.get(id)
    if (!lp) return
    await lp.instance.destroy()
    this.loaded.delete(id)
    if (this.activeId === id) this.activeId = null
  }

  setActive(id: string): void {
    if (!this.loaded.has(id)) throw new Error(`Plugin "${id}" not loaded`)
    this.activeId = id
  }

  getActive(): string | null {
    return this.activeId
  }

  list(): Array<{ id: string; active: boolean }> {
    return [...this.loaded.keys()].map((id) => ({ id, active: id === this.activeId }))
  }

  call<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
    const handler = registry.get<(...a: unknown[]) => unknown>(name)
    if (!handler) throw new Error(`Plugin function "${name}" is not registered`)
    return Promise.resolve(handler(...args) as T)
  }

  has(name: string): boolean {
    return !!registry.get(name)
  }
}

export const pluginManager = new PluginManager()

// ---------------------------------------------------------------------------
// Discover all plugins with metadata + enabled state
// ---------------------------------------------------------------------------

export async function discoverWithMeta(): Promise<PluginInfo[]> {
  const [ids, state] = await Promise.all([pluginManager.discover(), readState()])
  const loadedIds = new Set(pluginManager.list().map((p) => p.id))

  return Promise.all(
    ids.map(async (id) => {
      let pkg: Record<string, unknown> = {}
      try {
        pkg = await Bun.file(resolve(PLUGINS_ROOT, id, 'package.json')).json()
      } catch {}

      return {
        id,
        name: (pkg.name as string) ?? id,
        version: (pkg.version as string) ?? '0.0.0',
        description: pkg.description as string | undefined,
        enabled: state[id] !== false,
        loaded: loadedIds.has(id),
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// Bootstrap — reads state file, skips disabled plugins
// ---------------------------------------------------------------------------

export async function bootstrapPlugins(): Promise<void> {
  const ids = await pluginManager.discover()
  if (ids.length === 0) {
    console.log('[plugins] no plugins discovered')
    return
  }

  const state = await readState()

  for (const id of ids) {
    if (state[id] === false) {
      console.log(`[plugins] skip disabled "${id}"`)
      continue
    }
    try {
      await pluginManager.load(id)
      console.log(`[plugins] loaded "${id}"`)
    } catch (err) {
      console.error(`[plugins] failed to load "${id}":`, err)
    }
  }

  const loaded = pluginManager.list()
  if (loaded.length === 0) return

  const preferred = ids.includes('mockup') ? 'mockup' : ids[0]!
  const activeId = loaded.find((p) => p.id === preferred)?.id ?? loaded[0]!.id
  try {
    pluginManager.setActive(activeId)
    console.log(`[plugins] active = "${activeId}"`)
  } catch (err) {
    console.error('[plugins] could not set active plugin:', err)
  }
}
