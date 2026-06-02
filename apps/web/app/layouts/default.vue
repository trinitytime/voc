<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'

const ui = useUiStore()
const theme = ref('light')                       // 'light' | 'dark'
const density = ref('comfortable')               // 'comfortable' | 'compact'

provide('density', density)

onMounted(() => {
  document.documentElement.dataset.theme = theme.value
});

</script>

<template>
  <div :class="['shell', `theme-${theme}`, `density-${density}`]">
    <Sidebar :active="ui.active" @change="ui.active = $event" />
    <main class="main">
      <slot />
    </main>
  </div>
</template>
