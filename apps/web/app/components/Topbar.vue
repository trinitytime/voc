<script setup>
import { inject } from 'vue';

defineProps({
  title: { type: String, default: '' },
  sub:   { type: String, default: '' },
});
const accent = inject('accent');
</script>

<template>
  <header class="topbar">
    <div>
      <div class="crumb">VOC Console</div>
      <h1 class="page-title">{{ title }}</h1>
      <div class="page-sub">{{ sub }}</div>
    </div>
    <div class="topbar-right">
      <div class="search-mini">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>빠른 검색</span>
        <kbd>⌘K</kbd>
      </div>
      <div class="avatar" :style="{ background: accent.deep }">HJ</div>
    </div>
  </header>
</template>
