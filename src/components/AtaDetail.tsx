import type { Ata } from '../types'
import { ataToPlainText, formatDateLong, openActionsCount } from '../utils'

interface Props {
  ata: Ata
  onBack: () => void
  onEdit: () => void
  onToggleAction: (actionId: string) => void
  onToggleStatus: () => void
  onDelete: () => void
  onShare: () => void
}

export function AtaDetail({
  ata,
  onBack,
  onEdit,
  onToggleAction,
  onToggleStatus,
  onDelete,
  onShare,
}: Props) {
  const pending = openActionsCount(ata)

  return (
    <div className="screen detail">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <p className="brand brand--sm">Ata</p>
        <button type="button" className="text-btn" onClick={onEdit}>
          Editar
        </button>
      </header>

      <article className="detail__body">
        <div className="detail__intro">
          <span className={`status status--${ata.status}`}>
            {ata.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
          </span>
          <h1>{ata.title || 'Sem título'}</h1>
          <p className="detail__when">
            {formatDateLong(ata.date)}
            {ata.time ? ` · ${ata.time}` : ''}
          </p>
          {(ata.location || ata.facilitator) && (
            <p className="detail__where">
              {[ata.location, ata.facilitator ? `Facilitação: ${ata.facilitator}` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>

        <section className="block">
          <h2>Participantes</h2>
          {ata.participants.length ? (
            <ul className="people">
              {ata.participants.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nenhum participante listado.</p>
          )}
        </section>

        <section className="block">
          <h2>Pauta</h2>
          <p className="prose">{ata.agenda || '—'}</p>
        </section>

        <section className="block">
          <h2>Discussões</h2>
          <p className="prose">{ata.discussions || '—'}</p>
        </section>

        <section className="block">
          <h2>Decisões</h2>
          {ata.decisions.filter(Boolean).length ? (
            <ol className="decisions">
              {ata.decisions.filter(Boolean).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ol>
          ) : (
            <p className="muted">Nenhuma decisão registrada.</p>
          )}
        </section>

        <section className="block">
          <h2>
            Ações
            {pending > 0 ? <small>{pending} aberta(s)</small> : null}
          </h2>
          {ata.actions.filter((a) => a.description).length ? (
            <ul className="actions">
              {ata.actions
                .filter((a) => a.description)
                .map((action) => (
                  <li key={action.id}>
                    <label className={`action${action.done ? ' is-done' : ''}`}>
                      <input
                        type="checkbox"
                        checked={action.done}
                        onChange={() => onToggleAction(action.id)}
                      />
                      <span>
                        <strong>{action.description}</strong>
                        <em>
                          {[action.assignee, action.dueDate ? `prazo ${action.dueDate}` : '']
                            .filter(Boolean)
                            .join(' · ') || 'Sem responsável'}
                        </em>
                      </span>
                    </label>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="muted">Nenhuma ação definida.</p>
          )}
        </section>
      </article>

      <footer className="detail__actions">
        <button type="button" className="btn btn--ghost" onClick={onShare}>
          Compartilhar
        </button>
        <button type="button" className="btn btn--secondary" onClick={onToggleStatus}>
          {ata.status === 'finalizada' ? 'Reabrir' : 'Finalizar'}
        </button>
        <button type="button" className="btn btn--danger" onClick={onDelete}>
          Excluir
        </button>
      </footer>

      <pre className="sr-only" id="ata-plain">
        {ataToPlainText(ata)}
      </pre>
    </div>
  )
}
