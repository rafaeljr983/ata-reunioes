export type AtaStatus = 'rascunho' | 'finalizada'

export type UserRole = 'admin' | 'user'
export type UserStatus = 'pending' | 'approved' | 'rejected'

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
  createdBy?: string | null
}

export interface Profile {
  id: string
  email: string
  cpf: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type View =
  | { name: 'home' }
  | { name: 'editor'; ataId: string | null }
  | { name: 'detail'; ataId: string }
  | { name: 'admin' }
  | { name: 'dashboard' }

export interface AtaRow {
  id: string
  title: string
  date: string
  time: string
  location: string
  facilitator: string
  participants: string[] | null
  agenda: string
  discussions: string
  decisions: string[] | null
  actions: ActionItem[] | null
  status: AtaStatus
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ProfileRow {
  id: string
  email: string
  cpf: string | null
  name: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}
