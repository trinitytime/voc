import { searchSimilar } from '../db/voc'
import { embedOne, chat } from '../llm/openai'
import type { VocSearchHit, VocSearchResponse } from '../types'

function formatHitForPrompt(hit: VocSearchHit, idx: number): string {
  const blocks = (hit.content ?? [])
    .map((b) => `  - [${b.type}] ${b.text}`)
    .join('\n')
  const meta = [
    hit.category && `카테고리=${hit.category}`,
    hit.status && `상태=${hit.status}`,
    hit.priority && `우선순위=${hit.priority}`,
    hit.channel && `채널=${hit.channel}`,
  ]
    .filter(Boolean)
    .join(', ')
  return `#${idx + 1} ${hit.id} (유사도 ${hit.score.toFixed(3)})\n제목: ${hit.title}\n메타: ${meta}\n내용:\n${blocks}`
}

export async function searchVoc(query: string, k = 5): Promise<VocSearchResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { query: '', hits: [], summary: '질문을 입력해 주세요.' }
  }

  const vector = await embedOne(trimmed)
  const hits = searchSimilar(vector, k)

  if (hits.length === 0) {
    return { query: trimmed, hits: [], summary: '저장된 VOC 중 유사한 항목을 찾지 못했습니다.' }
  }

  const context = hits.map(formatHitForPrompt).join('\n\n')
  const messages = [
    {
      role: 'system' as const,
      content:
        '당신은 고객 응대 전문가입니다. 사용자의 질문과 가장 유사한 과거 VOC 사례 목록이 주어집니다. 사례를 종합하여 한국어로 간결한 답변과 권장 조치를 제공합니다. 사례에 없는 사실은 추측하지 마세요.',
    },
    {
      role: 'user' as const,
      content: `[사용자 질문]\n${trimmed}\n\n[유사 VOC 사례 ${hits.length}건]\n${context}\n\n위 사례를 바탕으로:\n1) 핵심 답변 (2-4문장)\n2) 권장 조치 (불릿 2-4개)\n순서로 한국어로 작성하세요.`,
    },
  ]

  let summary = ''
  try {
    summary = await chat(messages)
  } catch (err) {
    summary = `요약 생성 중 오류가 발생했습니다: ${(err as Error).message}`
  }

  return { query: trimmed, hits, summary }
}
