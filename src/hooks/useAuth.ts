import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { cpfToAuthEmail, isValidCpf, onlyDigits } from '../lib/cpf'
import { rowToProfile } from '../lib/mappers'
import { loadCachedProfile, saveCachedProfile } from '../lib/offlineStore'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileRow, UserStatus } from '../types'

function authMessage(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return 'CPF ou senha inválidos'
  if (lower.includes('already registered')) return 'Este CPF já está cadastrado'
  if (lower.includes('email not confirmed')) {
    return 'Conta ainda não confirmada. Desative "Confirm email" no Supabase (dev).'
  }
  return message
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    const cached = loadCachedProfile()
    if (cached?.id === userId) {
      setProfile(cached)
    }

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (queryError) {
      // Offline / rede: mantém perfil em cache para continuar usando o app
      if (cached?.id === userId) {
        setError(null)
        return cached
      }
      setError(queryError.message)
      setProfile(null)
      return null
    }

    if (!data) {
      if (cached?.id === userId) return cached
      setProfile(null)
      saveCachedProfile(null)
      return null
    }

    const mapped = rowToProfile(data as ProfileRow)
    setProfile(mapped)
    saveCachedProfile(mapped)
    setError(null)
    return mapped
  }, [])

  useEffect(() => {
    let active = true

    async function applySession(nextSession: Session | null, withLoading = false) {
      if (!active) return
      if (withLoading) setLoading(true)
      setSession(nextSession)
      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
      if (active) setLoading(false)
    }

    async function init() {
      const { data } = await supabase.auth.getSession()
      await applySession(data.session, true)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    // Ao voltar para o app (aba/PWA), recupera e renova a sessão salva
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      void supabase.auth.getSession().then(({ data }) => {
        void applySession(data.session)
      })
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      active = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [fetchProfile])

  async function signIn(cpf: string, password: string) {
    setError(null)
    if (!isValidCpf(cpf)) {
      const message = 'Informe um CPF válido'
      setError(message)
      return { ok: false as const, message }
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: cpfToAuthEmail(cpf),
      password,
    })
    if (authError) {
      const message = authMessage(authError.message)
      setError(message)
      return { ok: false as const, message }
    }
    return { ok: true as const }
  }

  async function signUp(name: string, cpf: string, password: string) {
    setError(null)
    if (!isValidCpf(cpf)) {
      const message = 'Informe um CPF válido'
      setError(message)
      return { ok: false as const, message }
    }

    const digits = onlyDigits(cpf)
    const { data, error: authError } = await supabase.auth.signUp({
      email: cpfToAuthEmail(digits),
      password,
      options: {
        data: {
          name: name.trim(),
          cpf: digits,
        },
      },
    })
    if (authError) {
      const message = authMessage(authError.message)
      setError(message)
      return { ok: false as const, message }
    }
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    return { ok: true as const }
  }

  async function signOut() {
    setError(null)
    const { error: authError } = await supabase.auth.signOut()
    if (authError) {
      setError(authError.message)
      return
    }
    setProfile(null)
    setSession(null)
    saveCachedProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null
    return fetchProfile(session.user.id)
  }, [fetchProfile, session?.user])

  const listProfiles = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      return { ok: false as const, message: queryError.message, profiles: [] as Profile[] }
    }

    return {
      ok: true as const,
      profiles: (data as ProfileRow[]).map(rowToProfile),
    }
  }, [])

  const setUserStatus = useCallback(async (userId: string, status: UserStatus) => {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)

    if (updateError) {
      return { ok: false as const, message: updateError.message }
    }
    return { ok: true as const }
  }, [])

  const isAdmin = profile?.role === 'admin' && profile.status === 'approved'
  const hasAccess =
    !!profile && profile.status === 'approved' && (profile.role === 'admin' || profile.role === 'user')

  return {
    session,
    profile,
    loading,
    error,
    isAdmin,
    hasAccess,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    listProfiles,
    setUserStatus,
  }
}
