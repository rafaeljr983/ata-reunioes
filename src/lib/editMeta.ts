import type { Ata, AtaEditEntry } from '../types'

const HISTORY_LIMIT = 50

export function withEditMeta(ata: Ata, editorName: string, summary: string): Ata {
  const by = editorName.trim() || 'Alguém'
  const at = new Date().toISOString()
  const entry: AtaEditEntry = { at, by, summary }
  const previous = Array.isArray(ata.editHistory) ? ata.editHistory : []
  return {
    ...ata,
    updatedAt: at,
    updatedBy: by,
    editHistory: [entry, ...previous].slice(0, HISTORY_LIMIT),
  }
}
