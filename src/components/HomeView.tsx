import { useMemo, useState } from 'react'
import type { Ata, AtaStatus } from '../types'
import { formatDate, openActionsCount } from '../utils'

interface Props {
  atas: Ata[]
  onOpen: (id: string) => void
  onCreate: () => void
}

type Filter = 'todas' | AtaStatus

export function HomeView({ atas, onOpen, onCreate }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todas')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...atas]
      .filter((ata) => (filter === 'todas' ? true : ata.status === filter))
      .filter((ata) => {
        if (!q) return true
        const hay = [
          ata.title,
          ata.location,
          ata.facilitator,
          ...ata.participants,
          ...ata.decisions,
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
  }, [atas, filter, query])

  const openActions = atas.reduce((sum, ata) => sum + openActionsCount(ata), 0)

  return (
    <div className="screen home">
      <header className="home__hero">
        <div className="home__atmosphere" aria-hidden="true" />
        <p className="brand">Ata</p>
        <h1 className="home__headline">Reuniões com registro claro</h1>
        <p className="home__sub">
          Crie, finalize e acompanhe ações das suas atas — pensado para o celular.
        </p>
        <button type="button" className="btn btn--primary" onClick={onCreate}>
          Nova ata
        </button>
        <div className="home__meta" aria-live="polite">
          <span>
            {atas.length} ata{atas.length === 1 ? '' : 's'}
          </span>
          <span>{openActions} ação(ões) aberta(s)</span>
        </div>
      </header>

      <section className="home__list-section" aria-label="Lista de atas">
        <div className="toolbar">
          <label className="search">
            <span className="sr-only">Buscar atas</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, pessoa…"
              type="search"
              enterKeyHint="search"
            />
          </label>
          <div className="filters" role="tablist" aria-label="Filtrar por status">
            {(
              [
                ['todas', 'Todas'],
                ['rascunho', 'Rascunhos'],
                ['finalizada', 'Finalizadas'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={`filter${filter === value ? ' is-active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Nenhuma ata por aqui</p>
            <p className="empty__text">
              {query || filter !== 'todas'
                ? 'Ajuste a busca ou o filtro para ver outros registros.'
                : 'Toque em Nova ata e registre a próxima reunião.'}
            </p>
          </div>
        ) : (
          <ul className="ata-list">
            {filtered.map((ata, index) => {
              const pending = openActionsCount(ata)
              return (
                <li key={ata.id} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
                  <button type="button" className="ata-row" onClick={() => onOpen(ata.id)}>
                    <div className="ata-row__top">
                      <time dateTime={ata.date}>{formatDate(ata.date)}</time>
                      <span className={`status status--${ata.status}`}>
                        {ata.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
                      </span>
                    </div>
                    <h2>{ata.title || 'Sem título'}</h2>
                    <p className="ata-row__meta">
                      {ata.participants.length
                        ? `${ata.participants.length} participante${ata.participants.length > 1 ? 's' : ''}`
                        : 'Sem participantes'}
                      {pending > 0 ? ` · ${pending} ação(ões)` : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        className="fab"
        onClick={onCreate}
        aria-label="Criar nova ata"
      >
        +
      </button>
    </div>
  )
}
