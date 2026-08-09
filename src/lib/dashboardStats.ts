import type { Ata } from '../types'

export interface DashboardStats {
  totalAtas: number
  rascunhos: number
  finalizadas: number
  totalActions: number
  actionsDone: number
  actionsOpen: number
  actionsPct: number
  atasPctFinalizadas: number
  decisions: number
  participants: number
  atasWithOpenActions: number
  recentTitles: string[]
}

export function computeDashboardStats(atas: Ata[]): DashboardStats {
  let actionsDone = 0
  let actionsOpen = 0
  let decisions = 0
  const people = new Set<string>()
  let atasWithOpenActions = 0

  for (const ata of atas) {
    if (ata.status === 'finalizada') {
      /* counted below */
    }
    decisions += ata.decisions.filter(Boolean).length
    ata.participants.forEach((p) => {
      const name = p.trim()
      if (name) people.add(name.toLowerCase())
    })
    if (ata.facilitator.trim()) people.add(ata.facilitator.trim().toLowerCase())

    let openInAta = 0
    for (const action of ata.actions) {
      if (!action.description.trim()) continue
      if (action.done) actionsDone += 1
      else {
        actionsOpen += 1
        openInAta += 1
      }
    }
    if (openInAta > 0) atasWithOpenActions += 1
  }

  const rascunhos = atas.filter((a) => a.status === 'rascunho').length
  const finalizadas = atas.filter((a) => a.status === 'finalizada').length
  const totalActions = actionsDone + actionsOpen
  const totalAtas = atas.length

  const recentTitles = [...atas]
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 5)
    .map((a) => a.title || 'Sem título')

  return {
    totalAtas,
    rascunhos,
    finalizadas,
    totalActions,
    actionsDone,
    actionsOpen,
    actionsPct: totalActions === 0 ? 0 : Math.round((actionsDone / totalActions) * 100),
    atasPctFinalizadas: totalAtas === 0 ? 0 : Math.round((finalizadas / totalAtas) * 100),
    decisions,
    participants: people.size,
    atasWithOpenActions,
    recentTitles,
  }
}
