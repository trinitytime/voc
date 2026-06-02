import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const active = ref<'search' | 'settings' | 'plugins'>('search')
  return { active }
})
