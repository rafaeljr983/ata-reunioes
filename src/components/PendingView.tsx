import { AuthHero } from './AuthHero'

interface Props {
  name?: string
  onRefresh: () => void
  onSignOut: () => void
  refreshing?: boolean
}

export function PendingView({ name, onRefresh, onSignOut, refreshing }: Props) {
  return (
    <div className="screen auth">
      <AuthHero
        actionTitle="Aguardando aprovação"
        subtitle={
          (name ? `Olá, ${name}. ` : '') +
          'Seu cadastro foi enviado. Um administrador precisa liberar o acesso para você ver as atas.'
        }
      />

      <div className="auth__panel">
        <p className="empty__text">
          Assim que for aprovado, entre novamente ou toque em Verificar status.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Verificando…' : 'Verificar status'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </div>
  )
}
