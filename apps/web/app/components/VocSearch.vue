<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { STATUS_STYLES, PRIORITY_STYLES } from '../data.js';

const accent = inject('accent');
const density = inject('density');

const query = ref('');
const results = ref([]);
const selectedId = ref('');
const loading = ref(false);
const summary = ref('키워드 또는 질문을 입력하고 검색해 보세요.');
const errorMsg = ref('');
const status = ref({ itemCount: 0, lastSyncedAt: null });

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function adapt(hit) {
  const inquiry = (hit.content || []).find((b) => b.type === 'inquiry');
  return {
    id: hit.id,
    title: hit.title,
    category: hit.category || '—',
    priority: hit.priority || '보통',
    status: hit.status || '신규',
    channel: hit.channel || '—',
    customer: hit.customer || '—',
    assignee: hit.assignee || '—',
    date: formatDate(hit.updatedAt),
    excerpt: inquiry?.text || (hit.content?.[0]?.text ?? ''),
    score: hit.score,
  };
}

async function loadStatus() {
  try {
    const res = await fetch('/api/voc/status');
    if (res.ok) status.value = await res.json();
  } catch { /* ignore */ }
}

onMounted(loadStatus);

async function runSearch() {
  const q = query.value.trim();
  if (!q) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await fetch('/api/voc/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, k: 5 }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorMsg.value = data.error || '검색에 실패했습니다.';
      results.value = [];
      summary.value = errorMsg.value;
      return;
    }
    results.value = (data.hits || []).map(adapt);
    summary.value = data.summary || '요약 정보가 없습니다.';
    if (results.value.length) selectedId.value = results.value[0].id;
  } catch (err) {
    errorMsg.value = err.message || '서버에 연결할 수 없습니다.';
    summary.value = errorMsg.value;
  } finally {
    loading.value = false;
  }
}

async function triggerSync() {
  loading.value = true;
  try {
    const res = await fetch('/api/voc/sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) errorMsg.value = data.error || '동기화에 실패했습니다.';
    await loadStatus();
  } catch (err) {
    errorMsg.value = err.message;
  } finally {
    loading.value = false;
  }
}

function clearQuery() { query.value = ''; }

const selected = computed(
  () => results.value.find(r => r.id === selectedId.value) || results.value[0]
);
const rowPad = computed(
  () => density?.value === 'compact' ? '10px 16px' : '16px 18px'
);

function copySummary() {
  navigator.clipboard?.writeText(summary.value);
}

function statusStyle(s) { return STATUS_STYLES[s] || STATUS_STYLES['신규']; }
function priorityStyle(p) { return PRIORITY_STYLES[p] || PRIORITY_STYLES['보통']; }
</script>

<template>
  <div class="page">
    <!-- Search card -->
    <section class="search-card">
      <div class="search-row">
        <div class="input-wrap big">
          <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            class="input"
            placeholder="VOC ID 또는 키워드를 입력하세요 (예: VOC-2026-04812, 배송 지연)"
            v-model="query"
            @keydown.enter="runSearch"
            :style="{ '--ring': accent.ring }"
          />
          <button v-if="query" class="input-clear" @click="clearQuery" aria-label="지우기">×</button>
        </div>
        <button class="btn-primary" :style="{ background: accent.base }" @click="runSearch" :disabled="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          검색
        </button>
        <button class="ghost-btn" @click="triggerSync" :disabled="loading" title="플러그인으로 VOC 동기화">
          동기화
        </button>
      </div>
      <div class="muted" style="margin-top: 8px; font-size: 12px;">
        저장된 VOC {{ status.itemCount ?? 0 }}건 · 마지막 동기화: {{ formatDate(status.lastSyncedAt) }}
        <span v-if="errorMsg" style="color: #dc2626; margin-left: 8px;">{{ errorMsg }}</span>
      </div>
    </section>

    <!-- AI summary panel -->
    <div class="output-block">
      <div class="output-head">
        <div class="output-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          검색 분석 결과
          <span class="output-badge" :style="{ color: accent.deep, background: accent.soft }">AI 요약</span>
        </div>
        <div class="output-actions">
          <button class="ghost-btn sm" @click="copySummary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            복사
          </button>
          <button class="ghost-btn sm">초기화</button>
        </div>
      </div>
      <textarea class="output-textarea" readonly rows="6" :value="summary"></textarea>
      <div class="output-foot">
        <span class="muted">읽기 전용 · 마지막 업데이트: 방금 전</span>
        <span class="muted output-count">{{ summary.length }} chars</span>
      </div>
    </div>

    <!-- Results -->
    <section class="results">
      <div class="results-head">
        <div class="results-title">
          검색 결과
          <span class="count" :style="{ color: accent.deep, background: accent.soft }">{{ results.length }}건</span>
        </div>
        <div class="results-tools">
          <button class="ghost-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV 내보내기
          </button>
          <div class="sort">
            정렬: <strong>최신순</strong>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      <div v-if="loading" class="empty">
        <div class="spinner" :style="{ borderTopColor: accent.base }"></div>
        <div>검색 중…</div>
      </div>
      <div v-else-if="results.length === 0" class="empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <div class="empty-title">검색 결과가 없습니다</div>
        <div class="empty-sub">다른 키워드를 시도해 보세요</div>
      </div>

      <div v-else class="split">
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th style="width: 150px;">VOC ID</th>
                <th>제목</th>
                <th style="width: 110px;">카테고리</th>
                <th style="width: 90px;">우선순위</th>
                <th style="width: 90px;">상태</th>
                <th style="width: 130px;">등록일</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="v in results"
                :key="v.id"
                :class="{ sel: v.id === selectedId }"
                :style="v.id === selectedId ? { background: accent.soft, boxShadow: `inset 3px 0 0 ${accent.base}` } : {}"
                @click="selectedId = v.id"
              >
                <td :style="{ padding: rowPad }"><span class="mono">{{ v.id }}</span></td>
                <td :style="{ padding: rowPad }">
                  <div class="row-title">{{ v.title }}</div>
                  <div class="row-sub">{{ v.customer }} · {{ v.channel }}</div>
                </td>
                <td :style="{ padding: rowPad }"><span class="cat">{{ v.category }}</span></td>
                <td :style="{ padding: rowPad }">
                  <span class="pill" :style="{ color: priorityStyle(v.priority).fg, background: priorityStyle(v.priority).bg }">{{ v.priority }}</span>
                </td>
                <td :style="{ padding: rowPad }">
                  <span class="status">
                    <span class="status-dot" :style="{ background: statusStyle(v.status).dot }"></span>
                    <span :style="{ color: statusStyle(v.status).fg }">{{ v.status }}</span>
                  </span>
                </td>
                <td :style="{ padding: rowPad, color: '#64748B' }">{{ v.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside class="detail" v-if="selected">
          <div class="detail-head">
            <div class="mono small">{{ selected.id }}</div>
            <div class="detail-actions">
              <button class="ghost-btn sm">원문 보기 ↗</button>
              <button class="ghost-btn sm">담당 변경</button>
            </div>
          </div>
          <h3 class="detail-title">{{ selected.title }}</h3>
          <div class="detail-meta">
            <span class="status">
              <span class="status-dot" :style="{ background: statusStyle(selected.status).dot }"></span>
              <span :style="{ color: statusStyle(selected.status).fg }">{{ selected.status }}</span>
            </span>
            <span class="pill" :style="{ color: priorityStyle(selected.priority).fg, background: priorityStyle(selected.priority).bg }">{{ selected.priority }}</span>
            <span class="cat">{{ selected.category }}</span>
          </div>

          <div class="detail-grid">
            <div><div class="k">고객</div><div class="v">{{ selected.customer }}</div></div>
            <div><div class="k">접수 채널</div><div class="v">{{ selected.channel }}</div></div>
            <div><div class="k">담당자</div><div class="v">{{ selected.assignee }}</div></div>
            <div><div class="k">등록일</div><div class="v">{{ selected.date }}</div></div>
          </div>

          <div class="detail-body">
            <div class="k">고객 의견</div>
            <p>{{ selected.excerpt }}</p>
          </div>

          <div class="detail-foot">
            <button class="btn-primary sm" :style="{ background: accent.base }">VOC 사이트에서 열기</button>
            <button class="ghost-btn sm">댓글 작성</button>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
