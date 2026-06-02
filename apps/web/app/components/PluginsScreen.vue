<script setup>
import { ref, inject, onMounted, computed } from 'vue';

const accent = inject('accent');

const plugins = ref([]);
const localEnabled = ref({});
const loading = ref(true);
const applying = ref(false);
const restarting = ref(false);
const fetchError = ref('');
const applyError = ref('');
const restartDone = ref(false);

const isDirty = computed(() =>
  plugins.value.some(p => localEnabled.value[p.id] !== p.enabled)
);

onMounted(fetchPlugins);

async function fetchPlugins() {
  loading.value = true;
  fetchError.value = '';
  try {
    const res = await fetch('/api/plugins');
    if (!res.ok) throw new Error();
    const data = await res.json();
    plugins.value = data.plugins ?? [];
    localEnabled.value = Object.fromEntries(plugins.value.map(p => [p.id, p.enabled]));
  } catch {
    fetchError.value = '서버에 연결할 수 없습니다.';
  } finally {
    loading.value = false;
  }
}

function toggle(id) {
  localEnabled.value = { ...localEnabled.value, [id]: !localEnabled.value[id] };
}

async function apply() {
  applying.value = true;
  applyError.value = '';
  restarting.value = false;
  restartDone.value = false;
  try {
    const res = await fetch('/api/plugins/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localEnabled.value),
    });
    if (!res.ok) throw new Error();
    restarting.value = true;
    await pollUntilAlive();
    restarting.value = false;
    restartDone.value = true;
    await fetchPlugins();
    setTimeout(() => { restartDone.value = false; }, 2500);
  } catch {
    applyError.value = '적용에 실패했습니다.';
    restarting.value = false;
  } finally {
    applying.value = false;
  }
}

async function pollUntilAlive() {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('/health');
      if (res.ok) return;
    } catch {}
  }
}
</script>

<template>
  <div class="page">
    <section class="card">
      <div class="card-head">
        <div>
          <h2 class="card-title">플러그인</h2>
          <p class="card-sub">설치된 플러그인을 활성화하거나 비활성화합니다. 변경 후 서버가 자동으로 재시작됩니다.</p>
        </div>
        <span v-if="restarting" class="badge-soft" style="color: #b45309; background: #fef3c7;">
          <span class="dot" style="background: #f59e0b;"></span>
          재시작 중…
        </span>
        <span v-else-if="restartDone" class="badge-soft" style="color: #065f46; background: #d1fae5;">
          <span class="dot" style="background: #10b981;"></span>
          재시작 완료
        </span>
        <span v-else-if="!loading" class="badge-soft" :style="{ color: accent.deep, background: accent.soft }">
          <span class="dot" :style="{ background: accent.base }"></span>
          {{ plugins.length }}개 설치됨
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="empty">
        <div class="spinner"></div>
      </div>

      <!-- Error -->
      <div v-else-if="fetchError" class="empty">
        <span style="color: #dc2626;">{{ fetchError }}</span>
        <button class="ghost-btn sm" @click="fetchPlugins">다시 시도</button>
      </div>

      <!-- Empty -->
      <div v-else-if="plugins.length === 0" class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-3);">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
          <line x1="16" y1="8" x2="2" y2="22" />
          <line x1="17.5" y1="15" x2="9" y2="15" />
        </svg>
        <span class="empty-title">설치된 플러그인 없음</span>
        <span class="empty-sub">plugins/ 디렉토리에 플러그인을 추가하세요.</span>
      </div>

      <!-- Plugin list -->
      <div v-else class="plugin-list">
        <label
          v-for="p in plugins"
          :key="p.id"
          class="toggle-row"
          :class="{ disabled: restarting || applying }"
          @click.prevent="!(restarting || applying) && toggle(p.id)"
        >
          <div class="plugin-info">
            <div class="plugin-name-row">
              <strong>{{ p.name }}</strong>
              <span class="plugin-version mono">v{{ p.version }}</span>
              <span v-if="p.loaded" class="pill plugin-loaded-pill">실행 중</span>
            </div>
            <small v-if="p.description">{{ p.description }}</small>
            <small v-else style="opacity: 0.5;">설명 없음</small>
          </div>
          <button
            :class="['switch', { on: localEnabled[p.id] }]"
            :style="localEnabled[p.id] ? { background: accent.base } : {}"
            type="button"
            :disabled="restarting || applying"
          >
            <span class="switch-knob"></span>
          </button>
        </label>
      </div>

      <div class="card-foot" v-if="!loading && !fetchError && plugins.length > 0">
        <div class="muted">
          <span v-if="applyError" style="color: #dc2626;">{{ applyError }}</span>
          <span v-else-if="isDirty">저장되지 않은 변경 사항이 있습니다.</span>
          <span v-else>변경 사항 없음</span>
        </div>
        <button
          class="btn-primary"
          :style="{ background: accent.base }"
          :disabled="!isDirty || applying || restarting"
          @click="apply"
        >
          {{ restarting ? '재시작 중…' : applying ? '적용 중…' : '변경 사항 적용' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toggle-row.disabled {
  opacity: 0.6;
  cursor: default;
}
.plugin-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.plugin-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.plugin-name-row strong {
  font-size: 13.5px;
  color: var(--text);
}
.plugin-version {
  font-size: 11px;
  color: var(--text-3);
}
.plugin-loaded-pill {
  font-size: 10.5px;
  padding: 2px 7px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 999px;
  font-weight: 600;
}
</style>
