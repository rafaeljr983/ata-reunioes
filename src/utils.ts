import type { ActionItem, Ata } from './types'

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateLong(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function createEmptyAta(createdBy?: string | null): Ata {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '',
    date: todayISO(),
    time: nowTime(),
    location: '',
    facilitator: '',
    participants: [],
    agenda: '',
    discussions: '',
    decisions: [],
    actions: [],
    status: 'rascunho',
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy ?? null,
  }
}

export function createAction(): ActionItem {
  return {
    id: uid('acao'),
    description: '',
    assignee: '',
    dueDate: '',
    done: false,
  }
}

export function ataToPlainText(ata: Ata): string {
  const lines = [
    `ATA DE REUNIÃO`,
    ata.title || 'Sem título',
    ``,
    `Data: ${formatDateLong(ata.date)}${ata.time ? ` às ${ata.time}` : ''}`,
    ata.location ? `Local: ${ata.location}` : null,
    ata.facilitator ? `Facilitador(a): ${ata.facilitator}` : null,
    `Status: ${ata.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}`,
    ``,
    `PARTICIPANTES`,
    ata.participants.length ? ata.participants.map((p) => `• ${p}`).join('\n') : '—',
    ``,
    `PAUTA`,
    ata.agenda || '—',
    ``,
    `DISCUSSÕES`,
    ata.discussions || '—',
    ``,
    `DECISÕES`,
    ata.decisions.filter(Boolean).length
      ? ata.decisions.filter(Boolean).map((d, i) => `${i + 1}. ${d}`).join('\n')
      : '—',
    ``,
    `AÇÕES`,
    ata.actions.filter((a) => a.description).length
      ? ata.actions
          .filter((a) => a.description)
          .map((a) => {
            const due = a.dueDate ? ` | prazo ${formatDate(a.dueDate)}` : ''
            const who = a.assignee ? ` (${a.assignee})` : ''
            const done = a.done ? ' [concluída]' : ''
            return `• ${a.description}${who}${due}${done}`
          })
          .join('\n')
      : '—',
  ]

  return lines.filter((l) => l !== null).join('\n')
}

export function openActionsCount(ata: Ata): number {
  return ata.actions.filter((a) => a.description && !a.done).length
}
