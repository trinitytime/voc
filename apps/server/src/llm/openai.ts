import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { getLlmConfig } from '../db/settings'
import type { VocArticle } from '../types'

interface ResolvedConfig {
  apiKey: string
  baseURL: string
  model: string
  embeddingModel: string
  temperature?: number
}

function resolveConfig(raw: Record<string, any>): ResolvedConfig {
  const apiKey: string | undefined =
    raw.apiKey ?? raw.openAIApiKey ?? raw.api_key ?? raw.OPENAI_API_KEY
  if (!apiKey) throw new Error('LLM config missing apiKey')

  const baseURL: string =
    raw.baseURL ??
    raw.base_url ??
    raw.configuration?.baseURL ??
    raw.configuration?.base_url ??
    'https://api.openai.com/v1'

  const model: string = raw.model ?? raw.modelName ?? 'gpt-4o-mini'
  const embeddingModel: string =
    raw.embeddingModel ?? raw.embedding_model ?? 'text-embedding-3-small'
  const temperature: number | undefined = raw.temperature

  return { apiKey, baseURL: baseURL.replace(/\/$/, ''), model, embeddingModel, temperature }
}

async function loadConfig(): Promise<ResolvedConfig> {
  const raw = await getLlmConfig()
  if (!raw) throw new Error('LLM 설정이 저장되지 않았습니다. 설정 화면에서 먼저 저장해 주세요.')
  return resolveConfig(raw as Record<string, any>)
}

function makeChatModel(cfg: ResolvedConfig): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: cfg.apiKey,
    model: cfg.model,
    temperature: cfg.temperature ?? 0.3,
    configuration: { baseURL: cfg.baseURL },
  })
}

function makeEmbeddingModel(cfg: ResolvedConfig): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    apiKey: cfg.apiKey,
    model: cfg.embeddingModel,
    configuration: { baseURL: cfg.baseURL },
  })
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const cfg = await loadConfig()
  const embeddings = makeEmbeddingModel(cfg)
  return embeddings.embedDocuments(texts)
}

export async function embedOne(text: string): Promise<number[]> {
  const cfg = await loadConfig()
  const embeddings = makeEmbeddingModel(cfg)
  return embeddings.embedQuery(text)
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function toLangChainMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (m.role === 'system') return new SystemMessage(m.content)
    if (m.role === 'assistant') return new AIMessage(m.content)
    return new HumanMessage(m.content)
  })
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const cfg = await loadConfig()
  const llm = makeChatModel(cfg)
  const result = await llm.invoke(toLangChainMessages(messages))
  return typeof result.content === 'string' ? result.content : ''
}

export async function summarizeArticle(article: VocArticle): Promise<string> {
  const inquiries = article.content
    .filter((b) => b.type === 'inquiry')
    .map((b) => b.text)
    .join('\n')
  const replies = article.content
    .filter((b) => b.type === 'reply')
    .map((b) => b.text)
    .join('\n')

  const meta = [
    article.category && `카테고리: ${article.category}`,
    article.status && `상태: ${article.status}`,
    article.priority && `우선순위: ${article.priority}`,
    article.channel && `채널: ${article.channel}`,
  ]
    .filter(Boolean)
    .join('\n')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '당신은 고객 VOC(Voice of Customer) 분석 전문가입니다. 주어진 고객 문의와 답변을 분석하여 간결하고 명확한 한국어 보고서를 작성합니다.',
    },
    {
      role: 'user',
      content: `다음 고객 VOC를 분석하여 보고서를 작성해 주세요.

제목: ${article.title}
${meta}

[고객 문의]
${inquiries || '(없음)'}

[답변]
${replies || '(없음)'}

다음 형식으로 보고서를 작성해 주세요:
## 문의 요약
(고객이 무엇을 요청/문의했는지 2-3문장으로 요약)

## 핵심 이슈
(문의의 핵심 문제점이나 요청 사항)

## 처리 결과
(어떻게 처리되었는지)

## 개선 제안
(향후 유사 문의 예방이나 서비스 개선을 위한 제안)`,
    },
  ]

  return chat(messages)
}
