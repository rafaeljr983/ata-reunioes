import { useCallback, useEffect, useState } from 'react'
import { ataToRow, rowToAta } from '../lib/mappers'
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
  const [atas, setAtas] = useState<Ata[]>(() => (enabled ? loadCachedAtas() : []))
  const [loading, setLoading] = useState(enabled)
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

    for (const op of queue) {
      if (op.type === 'upsert') {
        const payload = ataToRow(op.ata, op.userId)
        const { error: upsertError } = await supabase.from('atas').upsert(payload)
        if (upsertError) {
          remaining.push(op)
          setError(upsertError.message)
        } else {
          markSynced([op.ata.id])
        }
      } else {
        const { error: deleteError } = await supabase.from('atas').delete().eq('id', op.ataId)
        if (deleteError) {
          remaining.push(op)
          setError(deleteError.message)
        }
      }
    }

    if (remaining.length === 0) clearQueue()
    else saveQueue(remaining)
    setPendingCount(remaining.length)
    setSyncing(false)
    return { ok: remaining.length === 0, flushed: queue.length - remaining.length }
  }, [enabled, userId])

  const reload = useCallback(async () => {
    if (!enabled) {
      setAtas([])
      setLoading(false)
      return
    }

    const cached = loadCachedAtas()
    if (cached.length) {
      setAtas(sortAtas(cached))
      setLoading(false)
    } else {
      setLoading(true)
    }

    if (!isOnline()) {
      setOnline(false)
      setPendingCount(loadQueue().length)
      setLoading(false)
      return
    }

    setOnline(true)
    await flushQueue()

    const { data, error: queryError } = await supabase
      .from('atas')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      if (!cached.length) setAtas([])
      setLoading(false)
      return
    }

    const mapped = (data as AtaRow[]).map(rowToAta)
    markSynced(mapped.map((ata) => ata.id))
    setAndCache(mapped)
    setError(null)
    setPendingCount(loadQueue().length)
    setLoading(false)
  }, [enabled, flushQueue, setAndCache])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      void reload()
    }
    function handleOffline() {
      setOnline(false)
      setPendingCount(loadQueue().length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [reload])

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

    const payload = ataToRow(ata, userId)
    const { data, error: upsertError } = await supabase
      .from('atas')
      .upsert(payload)
      .select('*')
      .single()

    if (upsertError) {
      const queue = enqueueUpsert(ata, userId)
      setPendingCount(queue.length)
      setError(upsertError.message)
      return { ok: true as const, ata, offline: true as const, message: 'Salvo offline; sincroniza depois' }
    }

    const mapped = rowToAta(data as AtaRow)
    markSynced([mapped.id])
    setAndCache(applyLocalUpsert(nextList, mapped))
    setError(null)
    setPendingCount(loadQueue().length)
    return { ok: true as const, ata: mapped }
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
