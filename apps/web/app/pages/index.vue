<script setup lang="ts">
import Topbar from '../components/Topbar.vue'
import VocSearch from '../components/VocSearch.vue'
import SettingsScreen from '../components/SettingsScreen.vue'
import PluginsScreen from '../components/PluginsScreen.vue'

const ui = useUiStore()

const pageTitle = computed(() => {
  if (ui.active === 'search') return 'VOC 검색'
  if (ui.active === 'plugins') return '플러그인'
  return '설정'
})

const pageSub = computed(() => {
  if (ui.active === 'search') return '고객의 소리를 ID 또는 키워드로 검색합니다'
  if (ui.active === 'plugins') return '설치된 플러그인을 관리합니다'
  return '계정 자격 증명과 VOC 사이트 연결을 관리합니다'
})
</script>

<template>
  <Topbar :title="pageTitle" :sub="pageSub" />
  <VocSearch v-if="ui.active === 'search'" />
  <PluginsScreen v-else-if="ui.active === 'plugins'" />
  <SettingsScreen v-else />
</template>
