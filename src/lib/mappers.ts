import type { ActionItem, Ata, AtaEditEntry, AtaRow, Profile, ProfileRow } from '../types'

function asActions(value: ActionItem[] | null | undefined): ActionItem[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => ({
    id: String(item.id ?? ''),
    description: String(item.description ?? ''),
    assignee: String(item.assignee ?? ''),
    dueDate: String(item.dueDate ?? ''),
    done: Boolean(item.done),
    completedBy: item.completedBy ? String(item.completedBy) : null,
    completedAt: item.completedAt ? String(item.completedAt) : null,
  }))
}

function asEditHistory(value: AtaEditEntry[] | null | undefined): AtaEditEntry[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => ({
    at: String(item.at ?? ''),
    by: String(item.by ?? ''),
    summary: String(item.summary ?? ''),
  }))
}

export function rowToAta(row: AtaRow): Ata {
  return {
    id: row.id,
    title: row.title ?? '',
    date: row.date,
    time: row.time ?? '',
    location: row.location ?? '',
    facilitator: row.facilitator ?? '',
    participants: row.participants ?? [],
    agenda: row.agenda ?? '',
    discussions: row.discussions ?? '',
    decisions: row.decisions ?? [],
    actions: asActions(row.actions),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    editHistory: asEditHistory(row.edit_history),
  }
}

export function ataToRow(ata: Ata, userId: string) {
  return {
    id: ata.id,
    title: ata.title,
    date: ata.date,
    time: ata.time,
    location: ata.location,
    facilitator: ata.facilitator,
    participants: ata.participants,
    agenda: ata.agenda,
    discussions: ata.discussions,
    decisions: ata.decisions,
    actions: ata.actions,
    status: ata.status,
    created_by: ata.createdBy ?? userId,
    updated_at: ata.updatedAt || new Date().toISOString(),
    updated_by: ata.updatedBy ?? null,
    edit_history: ata.editHistory ?? [],
  }
}

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    cpf: row.cpf ?? '',
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
