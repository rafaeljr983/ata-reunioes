import { useCallback, useEffect, useState } from 'react'
import { ataToRow, rowToAta } from '../lib/mappers'
import { supabase } from '../lib/supabase'
import type { Ata, AtaRow } from '../types'

export function useAtas(enabled: boolean, userId: string | null) {
  const [atas, setAtas] = useState<Ata[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) {
      setAtas([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: queryError } = await supabase
      .from('atas')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setAtas([])
      setLoading(false)
      return
    }

    setAtas((data as AtaRow[]).map(rowToAta))
    setError(null)
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    void reload()
  }, [reload])

  async function upsert(ata: Ata) {
    if (!userId) {
      return { ok: false as const, message: 'Usuário não autenticado' }
    }

    const payload = ataToRow(ata, userId)
    const { data, error: upsertError } = await supabase
      .from('atas')
      .upsert(payload)
      .select('*')
      .single()

    if (upsertError) {
      setError(upsertError.message)
      return { ok: false as const, message: upsertError.message }
    }

    const mapped = rowToAta(data as AtaRow)
    setAtas((prev) => {
      const idx = prev.findIndex((item) => item.id === mapped.id)
      if (idx === -1) return [mapped, ...prev]
      const next = [...prev]
      next[idx] = mapped
      return next
    })
    setError(null)
    return { ok: true as const, ata: mapped }
  }

  async function remove(id: string) {
    const { error: deleteError } = await supabase.from('atas').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return { ok: false as const, message: deleteError.message }
    }
    setAtas((prev) => prev.filter((ata) => ata.id !== id))
    setError(null)
    return { ok: true as const }
  }

  function getById(id: string) {
    return atas.find((ata) => ata.id === id)
  }

  return { atas, loading, error, upsert, remove, getById, reload }
}
