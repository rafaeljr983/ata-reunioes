import { useCallback, useEffect, useState } from 'react'
import { rowToAta } from '../lib/mappers'
import {
  clearQueue,
  enqueueDelete,
  enqueueUpsert,
  isOnline,
  loadCachedAtas,
  loadQueue,
  markSynced,
  saveCachedAtas,
  saveQueue,
  type PendingOp,
} from '../lib/offlineStore'
import { saveAtaToSupabase } from '../lib/saveAta'
import { supabase } from '../lib/supabase'
import type { Ata, AtaRow } from '../types'

function sortAtas(list: Ata[]) {
  return [...list].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}

function applyLocalUpsert(list: Ata[], ata: Ata) {
  const idx = list.findIndex((item) => item.id === ata.id)
  if (idx === -1) return sortAtas([ata, ...list])
  const next = [...list]
  next[idx] = ata
  return sortAtas(next)
}

export function useAtas(enabled: boolean, userId: string | null) {
  const [atas, setAtas] = useState<Ata[]>(() => loadCachedAtas())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(() => loadQueue().length)
  const [online, setOnline] = useState(() => isOnline())
  const [syncing, setSyncing] = useState(false)

  const setAndCache = useCallback((list: Ata[]) => {
    const sorted = sortAtas(list)
    setAtas(sorted)
    saveCachedAtas(sorted)
  }, [])

  const flushQueue = useCallback(async () => {
    if (!enabled || !userId || !isOnline()) return { ok: true as const, flushed: 0 }

    const queue = loadQueue()
    if (queue.length === 0) return { ok: true as const, flushed: 0 }

    setSyncing(true)
    const remaining: PendingOp[] = []
    let lastError: string | null = null

    for (const op of queue) {
      if (op.type === 'upsert') {
        // Usa o usuário da sessão atual (não o userId antigo da fila)
        const { error: saveError } = await saveAtaToSupabase(op.ata, userId)
        if (saveError) {
          remaining.push(op)
          lastError = saveError
        } else {
          markSynced([op.ata.id])
        }
      } else {
        const { error: deleteError } = await supabase.from('atas').delete().eq('id', op.ataId)
        if (deleteError) {
          remaining.push(op)
          lastError = deleteError.message
        }
      }
    }

    if (remaining.length === 0) clearQueue()
    else saveQueue(remaining)
    setPendingCount(remaining.length)
    setSyncing(false)
    if (lastError) setError(lastError)
    else if (remaining.length === 0) setError(null)
    return { ok: remaining.length === 0, flushed: queue.length - remaining.length, error: lastError }
  }, [enabled, userId])

  const reload = useCallback(async () => {
    if (!enabled) {
      return
    }

    const cached = loadCachedAtas()
    setAtas(sortAtas(cached))
    setPendingCount(loadQueue().length)

    if (!isOnline()) {
      setOnline(false)
      setLoading(false)
      return
    }

    setOnline(true)
    if (!cached.length) setLoading(true)

    const flushResult = await flushQueue()

    const { data, error: queryError } = await supabase
      .from('atas')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    const mapped = (data as AtaRow[]).map(rowToAta)
    markSynced(mapped.map((ata) => ata.id))

    const pendingUpserts = loadQueue()
      .filter((op): op is Extract<PendingOp, { type: 'upsert' }> => op.type === 'upsert')
      .map((op) => op.ata)
    const byId = new Map(mapped.map((ata) => [ata.id, ata]))
    for (const ata of pendingUpserts) {
      if (!byId.has(ata.id)) byId.set(ata.id, ata)
    }

    setAndCache([...byId.values()])
    if (flushResult.ok) setError(null)
    setPendingCount(loadQueue().length)
    setLoading(false)
  }, [enabled, flushQueue, setAndCache])

  useEffect(() => {
    if (!enabled) return
    void reload()
  }, [enabled, reload])

  useEffect(() => {
    if (!enabled || !isOnline()) return

    const channel = supabase
      .channel('atas-shared')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atas' },
        () => {
          void reload()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, reload])

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      if (enabled) void reload()
    }
    function handleOffline() {
      setOnline(false)
      setPendingCount(loadQueue().length)
      setLoading(false)
    }
    function handleVisible() {
      if (document.visibilityState !== 'visible') return
      if (!enabled || !isOnline()) return
      void reload()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', handleVisible)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', handleVisible)
    }
  }, [enabled, reload])

  async function upsert(ata: Ata) {
    if (!userId) {
      return { ok: false as const, message: 'Usuário não autenticado' }
    }

    const nextList = applyLocalUpsert(atas, ata)
    setAndCache(nextList)

    if (!isOnline()) {
      const queue = enqueueUpsert(ata, userId)
      setPendingCount(queue.length)
      setOnline(false)
      return { ok: true as const, ata, offline: true as const }
    }

    const { ata: saved, error: saveError } = await saveAtaToSupabase(ata, userId)

    if (saveError || !saved) {
      const queue = enqueueUpsert(ata, userId)
      setPendingCount(queue.length)
      setError(saveError ?? 'Falha ao salvar')
      return {
        ok: true as const,
        ata,
        offline: true as const,
        message: 'Salvo no aparelho · falhou o envio ao servidor',
      }
    }

    markSynced([saved.id])
    setAndCache(applyLocalUpsert(nextList, saved))
    setError(null)
    setPendingCount(loadQueue().length)
    return { ok: true as const, ata: saved }
  }

  async function remove(id: string) {
    const nextList = atas.filter((ata) => ata.id !== id)
    setAndCache(nextList)

    if (!isOnline()) {
      const queue = enqueueDelete(id)
      setPendingCount(queue.length)
      setOnline(false)
      return { ok: true as const, offline: true as const }
    }

    const { error: deleteError } = await supabase.from('atas').delete().eq('id', id)
    if (deleteError) {
      const queue = enqueueDelete(id)
      setPendingCount(queue.length)
      setError(deleteError.message)
      return { ok: true as const, offline: true as const, message: 'Exclusão fica pendente até sincronizar' }
    }

    setError(null)
    setPendingCount(loadQueue().length)
    return { ok: true as const }
  }

  function getById(id: string) {
    return atas.find((ata) => ata.id === id)
  }

  return {
    atas,
    loading,
    error,
    upsert,
    remove,
    getById,
    reload,
    pendingCount,
    online,
    syncing,
  }
}
