import { AuthHero } from './AuthHero'

interface Props {
  name?: string
  onSignOut: () => void
}

export function RejectedView({ name, onSignOut }: Props) {
  return (
    <div className="screen auth">
      <AuthHero
        actionTitle="Acesso negado"
        subtitle={
          (name ? `${name}, s` : 'S') +
          'eu cadastro não foi aprovado. Fale com o administrador se achar que isso foi um engano.'
        }
      />

      <div className="auth__panel">
        <button type="button" className="btn btn--ghost" onClick={onSignOut}>
          Sair
        </button>
      </div>
    </div>
  )
}
