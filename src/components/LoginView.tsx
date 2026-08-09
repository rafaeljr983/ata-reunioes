import { useState } from 'react'
import type { FormEvent } from 'react'
import { formatCpf } from '../lib/cpf'
import { AuthHero } from './AuthHero'

interface Props {
  onSubmit: (cpf: string, password: string) => Promise<{ ok: boolean; message?: string }>
  onGoSignUp: () => void
}

export function LoginView({ onSubmit, onGoSignUp }: Props) {
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await onSubmit(cpf, password)
    if (!result.ok) {
      setError(result.message ?? 'Não foi possível entrar')
    }
    setBusy(false)
  }

  return (
    <div className="screen auth">
      <AuthHero
        actionTitle="Entrar no sistema"
        subtitle="Acesse as atas compartilhadas da comunidade com seu CPF."
      />

      <form className="auth__form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field">
          <span className="field__label">CPF</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="username"
            required
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </label>

        <label className="field">
          <span className="field__label">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="auth__error">{error}</p> : null}

        <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="auth__switch">
        Ainda não tem acesso?{' '}
        <button type="button" className="text-btn" onClick={onGoSignUp}>
          Solicitar cadastro
        </button>
      </p>
    </div>
  )
}
