<script setup>
import { ref, inject, onMounted } from 'vue';

const accent = inject('accent');

const credentials = ref({ id: '', pw: '' });
const showPw = ref(false);
const saved = ref(false);
const saveError = ref('');
const saving = ref(false);
const autoLogin = ref(true);
const savedAt = ref('');

const llmConfigRaw = ref('');
const llmConfigError = ref('');
const llmSaved = ref(false);
const llmSaveError = ref('');
const llmSaving = ref(false);
const llmSavedAt = ref('');

function nowStr() {
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
}

onMounted(async () => {
  try {
    const res = await fetch('/api/settings/credentials');
    if (res.ok) {
      const data = await res.json();
      if (data.stored) credentials.value.id = data.id;
    }
  } catch {
    try {
      const local = JSON.parse(localStorage.getItem('voc_creds') || 'null');
      if (local) credentials.value = local;
    } catch { /* localStorage 없으면 빈 폼으로 시작 */ }
  }

  try {
    const res = await fetch('/api/settings/llm');
    if (res.ok) {
      const data = await res.json();
      llmConfigRaw.value = JSON.stringify(data, null, 2);
    }
  } catch { /* 서버 미응답 시 빈 폼으로 시작 */ }
});

async function save() {
  if (!credentials.value.id || !credentials.value.pw) {
    saveError.value = '아이디와 비밀번호를 입력해 주세요.';
    return;
  }
  saving.value = true;
  saveError.value = '';
  try {
    const res = await fetch('/api/settings/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: credentials.value.id, password: credentials.value.pw }),
    });
    if (!res.ok) {
      const err = await res.json();
      saveError.value = err.error || '저장에 실패했습니다.';
      return;
    }
    savedAt.value = nowStr();
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 1800);
  } catch {
    saveError.value = '서버에 연결할 수 없습니다.';
  } finally {
    saving.value = false;
  }
}

async function saveLlmConfig() {
  llmConfigError.value = '';
  llmSaveError.value = '';
  let parsed;
  try {
    parsed = JSON.parse(llmConfigRaw.value);
  } catch {
    llmConfigError.value = '유효하지 않은 JSON 형식입니다.';
    return;
  }
  llmSaving.value = true;
  try {
    const res = await fetch('/api/settings/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    if (!res.ok) {
      const err = await res.json();
      llmSaveError.value = err.error || '저장에 실패했습니다.';
      return;
    }
    llmSavedAt.value = nowStr();
    llmSaved.value = true;
    setTimeout(() => { llmSaved.value = false; }, 1800);
  } catch {
    llmSaveError.value = '서버에 연결할 수 없습니다.';
  } finally {
    llmSaving.value = false;
  }
}

function reset() { credentials.value = { id: '', pw: '' }; }
function resetLlmConfig() { llmConfigRaw.value = ''; llmConfigError.value = ''; }
</script>

<template>
  <div class="page">
    <div class="settings-grid">
      <!-- Left column -->
      <div class="settings-col">
        <!-- Credentials -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2 class="card-title">계정 정보</h2>
              <p class="card-sub">VOC 사이트에 자동 로그인할 자격 증명을 저장합니다. 로컬에만 저장됩니다.</p>
            </div>
            <span class="badge-soft" :style="{ color: accent.deep, background: accent.soft }">
              <span class="dot" :style="{ background: accent.base }"></span>
              암호화 저장
            </span>
          </div>

          <div class="form">
            <div class="field">
              <label>아이디 (ID)</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  class="input"
                  placeholder="회사 계정 이메일 또는 사번"
                  v-model="credentials.id"
                  :style="{ '--ring': accent.ring }"
                />
              </div>
            </div>

            <div class="field">
              <label>비밀번호 (Password)</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  class="input"
                  :type="showPw ? 'text' : 'password'"
                  placeholder="•••••••••••"
                  v-model="credentials.pw"
                  :style="{ '--ring': accent.ring }"
                />
                <button class="reveal" @click="showPw = !showPw" aria-label="비밀번호 표시">
                  <svg v-if="showPw" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <label class="toggle-row">
              <span>
                <strong>자동 로그인</strong>
                <small>VOC 사이트 열 때 저장된 자격으로 자동 로그인 시도</small>
              </span>
              <button
                :class="['switch', { on: autoLogin }]"
                @click="autoLogin = !autoLogin"
                :style="autoLogin ? { background: accent.base } : {}"
                type="button"
              >
                <span class="switch-knob"></span>
              </button>
            </label>
          </div>

          <div class="card-foot">
            <div class="muted">
              <span v-if="saved" style="color: #059669;">✓ 저장되었습니다</span>
              <span v-else-if="saveError" style="color: #dc2626;">{{ saveError }}</span>
              <span v-else-if="savedAt">마지막 저장: {{ savedAt }}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" @click="reset" :disabled="saving">초기화</button>
              <button class="btn-primary" :style="{ background: accent.base }" @click="save" :disabled="saving">
                {{ saving ? '저장 중…' : '저장하기' }}
              </button>
            </div>
          </div>
        </section>

        <!-- ChatOpenAI 설정 -->
        <section class="card">
          <div class="card-head">
            <div>
              <h2 class="card-title">ChatOpenAI 설정</h2>
              <p class="card-sub">LLM 연결 설정을 JSON 형태로 입력합니다. API 키가 암호화되어 저장됩니다.</p>
            </div>
            <span class="badge-soft" :style="{ color: accent.deep, background: accent.soft }">
              <span class="dot" :style="{ background: accent.base }"></span>
              암호화 저장
            </span>
          </div>

          <div class="form">
            <div class="field">
              <label>설정 JSON</label>
              <textarea
                class="input"
                style="font-family: 'JetBrains Mono', monospace; font-size: 12px; resize: vertical; min-height: 140px; line-height: 1.6;"
                v-model="llmConfigRaw"
                placeholder='{"model": "gpt-4o", "apiKey": "sk-...", "temperature": 0.7}'
                rows="6"
                :style="{ '--ring': accent.ring }"
                spellcheck="false"
              />
              <span v-if="llmConfigError" style="font-size: 12px; color: #dc2626; margin-top: 4px; display: block;">{{ llmConfigError }}</span>
            </div>
          </div>

          <div class="card-foot">
            <div class="muted">
              <span v-if="llmSaved" style="color: #059669;">✓ 저장되었습니다</span>
              <span v-else-if="llmSaveError" style="color: #dc2626;">{{ llmSaveError }}</span>
              <span v-else-if="llmSavedAt">마지막 저장: {{ llmSavedAt }}</span>
            </div>
            <div class="row-actions">
              <button class="ghost-btn" @click="resetLlmConfig" :disabled="llmSaving">초기화</button>
              <button class="btn-primary" :style="{ background: accent.base }" @click="saveLlmConfig" :disabled="llmSaving">
                {{ llmSaving ? '저장 중…' : '저장하기' }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <!-- Right column — info -->
      <div class="settings-col side">
        <section class="card mini">
          <h3 class="mini-title">연결 상태</h3>
          <div class="status-list">
            <div class="status-line">
              <span class="status">
                <span class="status-dot" style="background: #10B981;"></span>
                <span style="color: #047857;">정상</span>
              </span>
              <span class="muted">API 연결</span>
            </div>
            <div class="status-line">
              <span class="status">
                <span class="status-dot" style="background: #10B981;"></span>
                <span style="color: #047857;">인증됨</span>
              </span>
              <span class="muted">로그인 세션</span>
            </div>
            <div class="status-line">
              <span class="status">
                <span class="status-dot" style="background: #F59E0B;"></span>
                <span style="color: #92400E;">23분 전</span>
              </span>
              <span class="muted">마지막 동기화</span>
            </div>
          </div>
          <button class="ghost-btn full">지금 연결 테스트</button>
        </section>

        <section class="card mini">
          <h3 class="mini-title">정보</h3>
          <dl class="kv">
            <div><dt>버전</dt><dd>v 2.4.1</dd></div>
            <div><dt>릴리스</dt><dd>2026-05-08</dd></div>
            <div><dt>환경</dt><dd>Production</dd></div>
          </dl>
        </section>

        <section class="card mini help" :style="{ background: accent.soft, borderColor: accent.ring }">
          <h3 class="mini-title" :style="{ color: accent.deep }">도움이 필요하신가요?</h3>
          <p class="muted" :style="{ color: accent.deep, opacity: 0.85 }">
            VOC 사이트 접속 문제가 있다면 IT 헬프데스크로 문의하세요.
          </p>
          <button class="link-btn" :style="{ color: accent.deep }">헬프데스크 →</button>
        </section>
      </div>
    </div>
  </div>
</template>
