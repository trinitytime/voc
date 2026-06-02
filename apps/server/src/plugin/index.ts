export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  minServerVersion?: string
}

export type PluginStatus = 'loaded' | 'disabled' | 'error'

export interface PluginRecord {
  id: string
  manifest: PluginManifest
  status: PluginStatus
  error?: string
}

export interface PluginAPI {
  log: (msg: string) => void
  getCredentials: () => Promise<{ id: string; password: string } | null>
}

// ---------------------------------------------------------------------------
// 전역 함수 레지스트리
// ---------------------------------------------------------------------------

interface RegistryEntry {
  pluginId: string
  handler: Function
}

class FunctionRegistry {
  private readonly store = new Map<string, RegistryEntry>()

  set(pluginId: string, name: string, handler: Function): void {
    this.store.set(name, { pluginId, handler })
  }

  get<T extends (...args: any[]) => any>(name: string): T | undefined {
    return this.store.get(name)?.handler as T | undefined
  }

  delete(name: string): void {
    this.store.delete(name)
  }

  unregisterPlugin(pluginId: string): void {
    for (const [name, entry] of this.store) {
      if (entry.pluginId === pluginId) this.store.delete(name)
    }
  }

  list(): Array<{ name: string; pluginId: string }> {
    return [...this.store.entries()].map(([name, { pluginId }]) => ({ name, pluginId }))
  }
}

export const registry = new FunctionRegistry()

// ---------------------------------------------------------------------------
// Plugin 베이스 클래스
// ---------------------------------------------------------------------------

export abstract class Plugin {
  public pluginId!: string
  protected log: PluginAPI['log']
  protected getCredentials: PluginAPI['getCredentials']
  private _registeredNames = new Set<string>()

  constructor(api: PluginAPI) {
    this.log = api.log
    this.getCredentials = api.getCredentials
  }

  register(name: string, handler: Function): void {
    registry.set(this.pluginId, name, handler)
    this._registeredNames.add(name)
  }

  abstract onLoad(): Promise<void>
  abstract onUnload(): Promise<void>

  // PluginManager가 onUnload 대신 이 메서드를 호출
  // onUnload 완료 후 등록된 함수를 자동으로 해제
  async destroy(): Promise<void> {
    await this.onUnload()
    for (const name of this._registeredNames) {
      registry.delete(name)
    }
    this._registeredNames.clear()
  }
}
