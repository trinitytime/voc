export type VocContentBlockType = 'inquiry' | 'reply' | 'receipt'

export interface VocContentBlock {
  type: VocContentBlockType
  text: string
}

export interface VocArticle {
  id: string
  title: string
  content: VocContentBlock[]
  category?: string
  status?: string
  priority?: string
  channel?: string
  customer?: string
  assignee?: string
  createdAt: string
  updatedAt: string
}

export interface VocListItem {
  id: string
  updatedAt: string
}

export interface VocListResult {
  items: VocListItem[]
}

export interface VocSearchHit extends VocArticle {
  score: number
}

export interface VocSearchResponse {
  query: string
  hits: VocSearchHit[]
  summary: string
}
