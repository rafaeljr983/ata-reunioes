import { useCallback, useEffect, useState } from 'react'
import { formatCpf } from '../lib/cpf'
import type { Profile, UserStatus } from '../types'
import { formatDate } from '../utils'

interface Props {
  listProfiles: () => Promise<{ ok: boolean; message?: string; profiles: Profile[] }>
  setUserStatus: (
    userId: string,
    status: UserStatus,
  ) => Promise<{ ok: boolean; message?: string }>
  currentUserId: string
  onBack: () => void
}

export function AdminUsersView({
  listProfiles,
  setUserStatus,
  currentUserId,
  onBack,
}: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await listProfiles()
    if (!result.ok) {
      setError(result.message ?? 'Erro ao carregar usuários')
      setProfiles([])
    } else {
      setProfiles(result.profiles)
    }
    setLoading(false)
  }, [listProfiles])

  useEffect(() => {
    void load()
  }, [load])

  async function updateStatus(userId: string, status: UserStatus) {
    setBusyId(userId)
    const result = await setUserStatus(userId, status)
    if (!result.ok) {
      setError(result.message ?? 'Não foi possível atualizar')
    } else {
      setProfiles((prev) =>
        prev.map((profile) => (profile.id === userId ? { ...profile, status } : profile)),
      )
    }
    setBusyId(null)
  }

  const pending = profiles.filter((p) => p.status === 'pending')
  const others = profiles.filter((p) => p.status !== 'pending')

  return (
    <div className="screen admin">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <p className="brand brand--sm">Usuários</p>
        <button type="button" className="text-btn" onClick={() => void load()}>
          Atualizar
        </button>
      </header>

      <div className="admin__body">
        {error ? <p className="auth__error">{error}</p> : null}

        {loading ? (
          <div className="empty">
            <p className="empty__title">Carregando…</p>
          </div>
        ) : (
          <>
            <section className="admin__section" aria-label="Pendentes">
              <h2 className="admin__heading">Aguardando aprovação</h2>
              {pending.length === 0 ? (
                <p className="empty__text">Nenhum pedido pendente.</p>
              ) : (
                <ul className="admin__list">
                  {pending.map((profile) => (
                    <li key={profile.id} className="admin__card">
                      <div>
                        <p className="admin__name">{profile.name || 'Sem nome'}</p>
                        <p className="admin__meta">
                          CPF {profile.cpf ? formatCpf(profile.cpf) : '—'}
                        </p>
                        <p className="admin__meta">Desde {formatDate(profile.createdAt.slice(0, 10))}</p>
                      </div>
                      <div className="admin__actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--compact"
                          disabled={busyId === profile.id}
                          onClick={() => void updateStatus(profile.id, 'approved')}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--compact"
                          disabled={busyId === profile.id}
                          onClick={() => void updateStatus(profile.id, 'rejected')}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="admin__section" aria-label="Demais usuários">
              <h2 className="admin__heading">Todos os usuários</h2>
              {others.length === 0 ? (
                <p className="empty__text">Nenhum usuário aprovado ou rejeitado ainda.</p>
              ) : (
                <ul className="admin__list">
                  {others.map((profile) => (
                    <li key={profile.id} className="admin__card">
                      <div>
                        <p className="admin__name">
                          {profile.name || 'Sem nome'}
                          {profile.id === currentUserId ? ' (você)' : ''}
                          {profile.role === 'admin' ? ' · Admin' : ''}
                        </p>
                        <p className="admin__meta">
                          CPF {profile.cpf ? formatCpf(profile.cpf) : '—'}
                        </p>
                        <span className={`status status--${profile.status}`}>
                          {statusLabel(profile.status)}
                        </span>
                      </div>
                      {profile.role !== 'admin' && profile.id !== currentUserId ? (
                        <div className="admin__actions">
                          {profile.status !== 'approved' ? (
                            <button
                              type="button"
                              className="btn btn--primary btn--compact"
                              disabled={busyId === profile.id}
                              onClick={() => void updateStatus(profile.id, 'approved')}
                            >
                              Aprovar
                            </button>
                          ) : null}
                          {profile.status !== 'rejected' ? (
                            <button
                              type="button"
                              className="btn btn--danger btn--compact"
                              disabled={busyId === profile.id}
                              onClick={() => void updateStatus(profile.id, 'rejected')}
                            >
                              Rejeitar
                            </button>
                          ) : null}
                          {profile.status === 'rejected' ? (
                            <button
                              type="button"
                              className="btn btn--ghost btn--compact"
                              disabled={busyId === profile.id}
                              onClick={() => void updateStatus(profile.id, 'pending')}
                            >
                              Pendente
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function statusLabel(status: UserStatus): string {
  if (status === 'approved') return 'Aprovado'
  if (status === 'rejected') return 'Rejeitado'
  return 'Pendente'
}
