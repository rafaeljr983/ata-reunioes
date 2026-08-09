import type { ActionItem, Ata, AtaRow, Profile, ProfileRow } from '../types'

function asActions(value: ActionItem[] | null | undefined): ActionItem[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => ({
    id: String(item.id ?? ''),
    description: String(item.description ?? ''),
    assignee: String(item.assignee ?? ''),
    dueDate: String(item.dueDate ?? ''),
    done: Boolean(item.done),
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
    updated_at: new Date().toISOString(),
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
