import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthHero } from './AuthHero'

interface Props {
  onSubmit: (name: string, password: string) => Promise<{ ok: boolean; message?: string }>
  onGoLogin: () => void
}

export function SignUpView({ onSubmit, onGoLogin }: Props) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await onSubmit(name, password)
    if (!result.ok) {
      setError(result.message ?? 'Não foi possível cadastrar')
    }
    setBusy(false)
  }

  return (
    <div className="screen auth">
      <AuthHero
        actionTitle="Solicitar acesso"
        subtitle="O administrador precisa aprovar seu cadastro (exceto o primeiro acesso)."
      />

      <form className="auth__form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field">
          <span className="field__label">Nome</span>
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
          />
        </label>

        <label className="field">
          <span className="field__label">Senha</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </label>

        {error ? <p className="auth__error">{error}</p> : null}

        <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
          {busy ? 'Enviando…' : 'Criar conta'}
        </button>
      </form>

      <p className="auth__switch">
        Já tem conta?{' '}
        <button type="button" className="text-btn" onClick={onGoLogin}>
          Entrar
        </button>
      </p>
    </div>
  )
}
