<script setup>
import { inject } from 'vue';

const props = defineProps({
  active: { type: String, default: 'search' },
});
const emit = defineEmits(['change']);
const accent = inject('accent');

const items = [
  { key: 'search', label: 'VOC 검색', desc: 'Voice of Customer' },
  { key: 'plugins', label: '플러그인', desc: 'Plugins' },
  { key: 'settings', label: '설정', desc: 'Settings' },
];
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark" :style="{ background: accent.base }">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <div>
        <div class="brand-name">VOC Console</div>
        <div class="brand-sub">고객의 소리</div>
      </div>
    </div>

    <nav class="nav">
      <div class="nav-label">메뉴</div>
      <button v-for="it in items" :key="it.key" :class="['nav-item', { active: active === it.key }]"
        :style="active === it.key ? { color: accent.deep, background: accent.soft } : {}"
        @click="emit('change', it.key)">
        <span class="nav-icon">
          <svg v-if="it.key === 'search'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <svg v-else-if="it.key === 'settings'" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
            <line x1="16" y1="8" x2="2" y2="22" />
            <line x1="17.5" y1="15" x2="9" y2="15" />
          </svg>
        </span>
        <span class="nav-label-text">
          <span class="nav-title">{{ it.label }}</span>
          <span class="nav-desc">{{ it.desc }}</span>
        </span>
        <span v-if="active === it.key" class="nav-active-bar" :style="{ background: accent.base }"></span>
      </button>
    </nav>

    <div class="sidebar-foot">
      <div class="conn-card">
        <div class="conn-dot"></div>
        <div class="conn-text">
          <div class="conn-title">연결됨</div>
          <div class="conn-sub">voc.company.com</div>
        </div>
      </div>
    </div>
  </aside>
</template>
