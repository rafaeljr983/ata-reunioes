import { useMemo } from 'react'
import { computeDashboardStats } from '../lib/dashboardStats'
import type { Ata } from '../types'
import { PieChart } from './PieChart'

interface Props {
  atas: Ata[]
  userName?: string
  onBack: () => void
}

export function DashboardView({ atas, userName, onBack }: Props) {
  const stats = useMemo(() => computeDashboardStats(atas), [atas])

  const summary =
    stats.totalAtas === 0
      ? 'Ainda não há atas registradas. Crie a primeira reunião para ver o panorama da comunidade.'
      : stats.actionsPct >= 70
        ? `${userName ? `${userName}, o` : 'O'} andamento das ações está bom: ${stats.actionsPct}% concluídas.`
        : stats.actionsPct >= 40
          ? `${userName ? `${userName}, há` : 'Há'} progresso nas ações (${stats.actionsPct}% concluídas), mas ainda restam ${stats.actionsOpen} pendentes.`
          : `${userName ? `${userName}, a` : 'A'} maior parte das ações ainda está aberta (${stats.actionsOpen} de ${stats.totalActions}).`

  return (
    <div className="screen dashboard">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <p className="brand brand--sm">Dashboard</p>
        <span className="topbar__spacer" />
      </header>

      <div className="dashboard__body">
        <section className="dashboard__summary" aria-label="Resumo">
          <h1>Resumo da comunidade</h1>
          <p>{summary}</p>
        </section>

        <section className="dashboard__stats" aria-label="Números gerais">
          <article className="stat">
            <strong>{stats.totalAtas}</strong>
            <span>Atas</span>
          </article>
          <article className="stat">
            <strong>{stats.finalizadas}</strong>
            <span>Finalizadas</span>
          </article>
          <article className="stat">
            <strong>{stats.rascunhos}</strong>
            <span>Rascunhos</span>
          </article>
          <article className="stat">
            <strong>{stats.actionsPct}%</strong>
            <span>Ações feitas</span>
          </article>
        </section>

        <section className="dashboard__block" aria-label="Status das atas">
          <h2>Atas por status</h2>
          <PieChart
            centerLabel="finalizadas"
            centerValue={`${stats.atasPctFinalizadas}%`}
            slices={[
              { label: 'Finalizadas', value: stats.finalizadas, color: '#1f7a5c' },
              { label: 'Rascunhos', value: stats.rascunhos, color: '#f0b429' },
            ]}
          />
        </section>

        <section className="dashboard__block" aria-label="Ações">
          <h2>Ações concluídas</h2>
          <PieChart
            centerLabel="feitas"
            centerValue={`${stats.actionsPct}%`}
            slices={[
              { label: 'Concluídas', value: stats.actionsDone, color: '#1f7a5c' },
              { label: 'Em aberto', value: stats.actionsOpen, color: '#b33b3b' },
            ]}
          />
          <div className="progress" aria-label="Percentual de ações concluídas">
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${stats.actionsPct}%` }} />
            </div>
            <p className="progress__text">
              {stats.actionsDone} de {stats.totalActions} ações concluídas
            </p>
          </div>
        </section>

        <section className="dashboard__block" aria-label="Outros indicadores">
          <h2>Outras informações</h2>
          <ul className="dashboard__facts">
            <li>
              <span>Decisões registradas</span>
              <strong>{stats.decisions}</strong>
            </li>
            <li>
              <span>Pessoas envolvidas</span>
              <strong>{stats.participants}</strong>
            </li>
            <li>
              <span>Atas com ações abertas</span>
              <strong>{stats.atasWithOpenActions}</strong>
            </li>
          </ul>
        </section>

        {stats.recentTitles.length > 0 ? (
          <section className="dashboard__block" aria-label="Últimas atas">
            <h2>Últimas atas</h2>
            <ol className="dashboard__recent">
              {stats.recentTitles.map((title, index) => (
                <li key={`${title}-${index}`}>{title}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  )
}
