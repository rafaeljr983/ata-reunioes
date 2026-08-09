import { useEffect, useState } from 'react'
import { AdminUsersView } from './components/AdminUsersView'
import { AtaDetail } from './components/AtaDetail'
import { AtaEditor } from './components/AtaEditor'
import { HomeView } from './components/HomeView'
import { LoginView } from './components/LoginView'
import { PendingView } from './components/PendingView'
import { RejectedView } from './components/RejectedView'
import { SignUpView } from './components/SignUpView'
import { useAtas } from './hooks/useAtas'
import { useAuth } from './hooks/useAuth'
import type { View } from './types'
import { ataToPlainText, createEmptyAta } from './utils'

type AuthScreen = 'login' | 'signup'

export default function App() {
  const auth = useAuth()
  const userId = auth.session?.user.id ?? null
  const { atas, loading: atasLoading, upsert, remove, getById } = useAtas(auth.hasAccess, userId)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [view, setView] = useState<View>({ name: 'home' })
  const [toast, setToast] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!auth.session) {
      setView({ name: 'home' })
    }
  }, [auth.session])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2200)
  }

  async function shareAta(id: string) {
    const ata = getById(id)
    if (!ata) return
    const text = ataToPlainText(ata)
    try {
      if (navigator.share) {
        await navigator.share({ title: ata.title, text })
        return
      }
      await navigator.clipboard.writeText(text)
      showToast('Ata copiada')
    } catch {
      try {
        await navigator.clipboard.writeText(text)
        showToast('Ata copiada')
      } catch {
        showToast('Não foi possível compartilhar')
      }
    }
  }

  if (auth.loading) {
    return (
      <div className="app-shell">
        <div className="empty empty--full">
          <p className="empty__title">Carregando…</p>
        </div>
      </div>
    )
  }

  if (!auth.session) {
    return (
      <div className="app-shell">
        {authScreen === 'signup' ? (
          <SignUpView
            onGoLogin={() => setAuthScreen('login')}
            onSubmit={async (name, cpf, password) => auth.signUp(name, cpf, password)}
          />
        ) : (
          <LoginView
            onGoSignUp={() => setAuthScreen('signup')}
            onSubmit={async (cpf, password) => auth.signIn(cpf, password)}
          />
        )}
      </div>
    )
  }

  if (!auth.profile || auth.profile.status === 'pending') {
    return (
      <div className="app-shell">
        <PendingView
          name={auth.profile?.name}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            void auth.refreshProfile().finally(() => setRefreshing(false))
          }}
          onSignOut={() => void auth.signOut()}
        />
      </div>
    )
  }

  if (auth.profile.status === 'rejected') {
    return (
      <div className="app-shell">
        <RejectedView name={auth.profile.name} onSignOut={() => void auth.signOut()} />
      </div>
    )
  }

  if (!auth.hasAccess) {
    return (
      <div className="app-shell">
        <div className="empty empty--full">
          <p className="empty__title">Sem acesso</p>
          <button type="button" className="btn btn--ghost" onClick={() => void auth.signOut()}>
            Sair
          </button>
        </div>
      </div>
    )
  }

  if (view.name === 'admin' && auth.isAdmin) {
    return (
      <div className="app-shell">
        <AdminUsersView
          currentUserId={userId ?? ''}
          listProfiles={auth.listProfiles}
          setUserStatus={auth.setUserStatus}
          onBack={() => setView({ name: 'home' })}
        />
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    )
  }

  if (view.name === 'editor') {
    const existing = view.ataId ? getById(view.ataId) : null
    const initial = existing ?? createEmptyAta(userId)
    return (
      <div className="app-shell">
        <AtaEditor
          key={initial.id}
          initial={initial}
          isNew={!existing}
          onCancel={() =>
            setView(existing ? { name: 'detail', ataId: existing.id } : { name: 'home' })
          }
          onSave={(ata) => {
            void upsert({ ...ata, createdBy: ata.createdBy ?? userId }).then((result) => {
              if (!result.ok) {
                showToast(result.message)
                return
              }
              showToast('Ata salva')
              setView({ name: 'detail', ataId: ata.id })
            })
          }}
        />
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    )
  }

  if (view.name === 'detail') {
    const ata = getById(view.ataId)
    if (!ata) {
      return (
        <div className="app-shell">
          <div className="empty empty--full">
            <p className="empty__title">{atasLoading ? 'Carregando…' : 'Ata não encontrada'}</p>
            <button type="button" className="btn btn--primary" onClick={() => setView({ name: 'home' })}>
              Voltar ao início
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="app-shell">
        <AtaDetail
          ata={ata}
          onBack={() => setView({ name: 'home' })}
          onEdit={() => setView({ name: 'editor', ataId: ata.id })}
          onToggleAction={(actionId) => {
            void upsert({
              ...ata,
              updatedAt: new Date().toISOString(),
              actions: ata.actions.map((action) =>
                action.id === actionId ? { ...action, done: !action.done } : action,
              ),
            })
          }}
          onToggleStatus={() => {
            const nextStatus = ata.status === 'finalizada' ? 'rascunho' : 'finalizada'
            void upsert({
              ...ata,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }).then((result) => {
              if (!result.ok) {
                showToast(result.message)
                return
              }
              showToast(nextStatus === 'finalizada' ? 'Ata finalizada' : 'Ata reaberta')
            })
          }}
          onDelete={() => {
            if (window.confirm('Excluir esta ata? Essa ação não pode ser desfeita.')) {
              void remove(ata.id).then((result) => {
                if (!result.ok) {
                  showToast(result.message)
                  return
                }
                showToast('Ata excluída')
                setView({ name: 'home' })
              })
            }
          }}
          onShare={() => void shareAta(ata.id)}
        />
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <HomeView
        atas={atas}
        loading={atasLoading}
        userName={auth.profile.name}
        isAdmin={auth.isAdmin}
        onOpen={(id) => setView({ name: 'detail', ataId: id })}
        onCreate={() => setView({ name: 'editor', ataId: null })}
        onAdmin={() => setView({ name: 'admin' })}
        onSignOut={() => void auth.signOut()}
      />
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
