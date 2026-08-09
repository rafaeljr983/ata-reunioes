import { ChapelIllustration } from './ChapelIllustration'

interface Props {
  actionTitle: string
  subtitle: string
}

export function AuthHero({ actionTitle, subtitle }: Props) {
  return (
    <header className="auth__hero">
      <div className="home__atmosphere" aria-hidden="true" />
      <p className="brand brand--chapel">Ata de reuniões</p>
      <h1 className="home__headline">Capela São João Batista</h1>
      <p className="auth__action">{actionTitle}</p>
      <p className="auth__sub">{subtitle}</p>
      <div className="hero-chapel" aria-hidden="true">
        <ChapelIllustration />
      </div>
    </header>
  )
}
