import { useState } from 'react'
import { AtaDetail } from './components/AtaDetail'
import { AtaEditor } from './components/AtaEditor'
import { HomeView } from './components/HomeView'
import { useAtas } from './hooks/useAtas'
import type { View } from './types'
import { ataToPlainText, createEmptyAta } from './utils'

export default function App() {
  const { atas, upsert, remove, getById } = useAtas()
  const [view, setView] = useState<View>({ name: 'home' })
  const [toast, setToast] = useState<string | null>(null)

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

  if (view.name === 'editor') {
    const existing = view.ataId ? getById(view.ataId) : null
    const initial = existing ?? createEmptyAta()
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
            upsert(ata)
            showToast('Ata salva')
            setView({ name: 'detail', ataId: ata.id })
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
            <p className="empty__title">Ata não encontrada</p>
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
            upsert({
              ...ata,
              updatedAt: new Date().toISOString(),
              actions: ata.actions.map((action) =>
                action.id === actionId ? { ...action, done: !action.done } : action,
              ),
            })
          }}
          onToggleStatus={() => {
            const nextStatus = ata.status === 'finalizada' ? 'rascunho' : 'finalizada'
            upsert({
              ...ata,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            })
            showToast(nextStatus === 'finalizada' ? 'Ata finalizada' : 'Ata reaberta')
          }}
          onDelete={() => {
            if (window.confirm('Excluir esta ata? Essa ação não pode ser desfeita.')) {
              remove(ata.id)
              showToast('Ata excluída')
              setView({ name: 'home' })
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
        onOpen={(id) => setView({ name: 'detail', ataId: id })}
        onCreate={() => setView({ name: 'editor', ataId: null })}
      />
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
