import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { cpfToAuthEmail, isValidCpf, onlyDigits } from '../lib/cpf'
import { rowToProfile } from '../lib/mappers'
import { isOnline, loadCachedProfile, saveCachedProfile } from '../lib/offlineStore'
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
  const [profile, setProfile] = useState<Profile | null>(() => loadCachedProfile())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string, allowNetwork = true) => {
    const cached = loadCachedProfile()
    if (cached?.id === userId) {
      setProfile(cached)
    }

    // Offline: não espera rede falhar — usa cache na hora
    if (!allowNetwork || !isOnline()) {
      if (cached?.id === userId) {
        setError(null)
        return cached
      }
      return null
    }

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (queryError) {
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

    async function applySession(nextSession: Session | null, options?: { showLoading?: boolean }) {
      if (!active) return
      const offline = !isOnline()
      if (options?.showLoading && !offline) setLoading(true)

      setSession(nextSession)
      if (nextSession?.user) {
        await fetchProfile(nextSession.user.id, !offline)
      } else {
        setProfile(null)
      }
      if (active) setLoading(false)
    }

    async function init() {
      const offline = !isOnline()
      const cached = loadCachedProfile()

      // Offline rápido: sessão local + perfil em cache (sem esperar rede)
      if (offline) {
        if (cached) setProfile(cached)
        const { data } = await supabase.auth.getSession()
        if (!active) return
        setSession(data.session)
        if (data.session?.user) {
          await fetchProfile(data.session.user.id, false)
        }
        if (active) setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      await applySession(data.session, { showLoading: true })
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    function onVisible() {
      if (document.visibilityState !== 'visible') return
      if (!isOnline()) return
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
      await fetchProfile(data.user.id, true)
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
    return fetchProfile(session.user.id, true)
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
