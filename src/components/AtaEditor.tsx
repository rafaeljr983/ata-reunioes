import { useState } from 'react'
import type { Ata } from '../types'
import { createAction } from '../utils'
import { TagInput } from './TagInput'

interface Props {
  initial: Ata
  isNew: boolean
  onCancel: () => void
  onSave: (ata: Ata) => void
}

export function AtaEditor({ initial, isNew, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<Ata>(initial)
  const [decisionDraft, setDecisionDraft] = useState('')

  function update<K extends keyof Ata>(key: K, value: Ata[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function addDecision() {
    const value = decisionDraft.trim()
    if (!value) return
    update('decisions', [...draft.decisions, value])
    setDecisionDraft('')
  }

  function save() {
    const title = draft.title.trim() || 'Reunião sem título'
    onSave({
      ...draft,
      title,
      updatedAt: new Date().toISOString(),
      decisions: draft.decisions.filter(Boolean),
      actions: draft.actions.filter((a) => a.description.trim()),
    })
  }

  return (
    <div className="screen editor">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cancelar">
          ←
        </button>
        <p className="brand brand--sm">Ata</p>
        <button type="button" className="text-btn" onClick={save}>
          Salvar
        </button>
      </header>

      <div className="editor__body">
        <p className="editor__eyebrow">{isNew ? 'Nova ata' : 'Editar ata'}</p>

        <label className="field">
          <span className="field__label">Título</span>
          <input
            value={draft.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Ex.: Alinhamento de sprint"
            autoFocus={isNew}
          />
        </label>

        <div className="field-row field-row--datetime">
          <label className="field">
            <span className="field__label">Data</span>
            <span className="field__control">
              <input
                type="date"
                value={draft.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </span>
          </label>
          <label className="field">
            <span className="field__label">Horário</span>
            <span className="field__control">
              <input
                type="time"
                value={draft.time}
                onChange={(e) => update('time', e.target.value)}
              />
            </span>
          </label>
        </div>

        <label className="field">
          <span className="field__label">Local</span>
          <input
            value={draft.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Sala, Meet, Teams…"
          />
        </label>

        <label className="field">
          <span className="field__label">Facilitador(a)</span>
          <input
            value={draft.facilitator}
            onChange={(e) => update('facilitator', e.target.value)}
            placeholder="Quem conduziu a reunião"
          />
        </label>

        <TagInput
          label="Participantes"
          values={draft.participants}
          placeholder="Nome e Enter"
          onChange={(participants) => update('participants', participants)}
        />

        <label className="field">
          <span className="field__label">Pauta</span>
          <textarea
            rows={4}
            value={draft.agenda}
            onChange={(e) => update('agenda', e.target.value)}
            placeholder="Itens discutidos…"
          />
        </label>

        <label className="field">
          <span className="field__label">Discussões</span>
          <textarea
            rows={5}
            value={draft.discussions}
            onChange={(e) => update('discussions', e.target.value)}
            placeholder="Resumo do que foi falado…"
          />
        </label>

        <div className="field">
          <span className="field__label">Decisões</span>
          <ul className="editor-list">
            {draft.decisions.map((decision, index) => (
              <li key={`${decision}-${index}`}>
                <input
                  value={decision}
                  onChange={(e) => {
                    const next = [...draft.decisions]
                    next[index] = e.target.value
                    update('decisions', next)
                  }}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn--tiny"
                  onClick={() =>
                    update(
                      'decisions',
                      draft.decisions.filter((_, i) => i !== index),
                    )
                  }
                  aria-label="Remover decisão"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="inline-add">
            <input
              value={decisionDraft}
              onChange={(e) => setDecisionDraft(e.target.value)}
              placeholder="Nova decisão"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDecision()
                }
              }}
            />
            <button type="button" className="btn btn--secondary btn--compact" onClick={addDecision}>
              Adicionar
            </button>
          </div>
        </div>

        <div className="field">
          <div className="field__label-row">
            <span className="field__label">Ações</span>
            <button
              type="button"
              className="text-btn"
              onClick={() => update('actions', [...draft.actions, createAction()])}
            >
              + ação
            </button>
          </div>
          <ul className="action-editor">
            {draft.actions.map((action, index) => (
              <li key={action.id} className="action-editor__item">
                <input
                  value={action.description}
                  onChange={(e) => {
                    const next = [...draft.actions]
                    next[index] = { ...action, description: e.target.value }
                    update('actions', next)
                  }}
                  placeholder="O que precisa ser feito"
                />
                <div className="field-row">
                  <input
                    value={action.assignee}
                    onChange={(e) => {
                      const next = [...draft.actions]
                      next[index] = { ...action, assignee: e.target.value }
                      update('actions', next)
                    }}
                    placeholder="Responsável"
                  />
                  <span className="field__control">
                    <input
                      type="date"
                      value={action.dueDate}
                      onChange={(e) => {
                        const next = [...draft.actions]
                        next[index] = { ...action, dueDate: e.target.value }
                        update('actions', next)
                      }}
                    />
                  </span>
                </div>
                <button
                  type="button"
                  className="text-btn text-btn--danger"
                  onClick={() =>
                    update(
                      'actions',
                      draft.actions.filter((a) => a.id !== action.id),
                    )
                  }
                >
                  Remover ação
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="editor__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn--primary" onClick={save}>
          Salvar ata
        </button>
      </footer>
    </div>
  )
}
