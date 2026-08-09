export type AtaStatus = 'rascunho' | 'finalizada'

export interface ActionItem {
  id: string
  description: string
  assignee: string
  dueDate: string
  done: boolean
}

export interface Ata {
  id: string
  title: string
  date: string
  time: string
  location: string
  facilitator: string
  participants: string[]
  agenda: string
  discussions: string
  decisions: string[]
  actions: ActionItem[]
  status: AtaStatus
  createdAt: string
  updatedAt: string
}

export type View =
  | { name: 'home' }
  | { name: 'editor'; ataId: string | null }
  | { name: 'detail'; ataId: string }
