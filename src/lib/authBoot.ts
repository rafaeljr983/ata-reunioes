import type { Session } from '@supabase/supabase-js'
import { loadCachedProfile } from './offlineStore'
import type { Profile } from '../types'

const AUTH_KEY = 'ata.capela.auth'

/** Lê a sessão já salva no aparelho, sem esperar rede. */
export function readLocalSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session & { currentSession?: Session }
    if (parsed?.access_token && parsed?.user) return parsed
    if (parsed?.currentSession?.access_token && parsed.currentSession.user) {
      return parsed.currentSession
    }
    return null
  } catch {
    return null
  }
}

export function getBootState(): {
  session: Session | null
  profile: Profile | null
  ready: boolean
} {
  const session = readLocalSession()
  const profile = loadCachedProfile()
  const ready = Boolean(
    session?.user?.id &&
      profile?.id === session.user.id &&
      profile.status === 'approved',
  )
  return { session, profile, ready }
}
