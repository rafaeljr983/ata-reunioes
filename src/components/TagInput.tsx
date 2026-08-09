import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface Props {
  label: string
  values: string[]
  placeholder?: string
  onChange: (values: string[]) => void
}

export function TagInput({ label, values, placeholder, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function add(value: string) {
    const cleaned = value.trim()
    if (!cleaned) return
    if (values.some((v) => v.toLowerCase() === cleaned.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...values, cleaned])
    setDraft('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    add(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add(draft)
    }
    if (e.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="tag-input">
        <div className="tag-input__list">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              className="tag"
              onClick={() => onChange(values.filter((v) => v !== value))}
              aria-label={`Remover ${value}`}
            >
              {value}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => add(draft)}
            placeholder={placeholder}
            enterKeyHint="done"
          />
        </form>
      </div>
    </label>
  )
}
