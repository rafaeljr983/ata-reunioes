import { useEffect, useState } from 'react'
import { loadAtas, saveAtas } from '../storage'
import type { Ata } from '../types'

export function useAtas() {
  const [atas, setAtas] = useState<Ata[]>(() => loadAtas())

  useEffect(() => {
    saveAtas(atas)
  }, [atas])

  function upsert(ata: Ata) {
    setAtas((prev) => {
      const idx = prev.findIndex((a) => a.id === ata.id)
      if (idx === -1) return [ata, ...prev]
      const next = [...prev]
      next[idx] = ata
      return next
    })
  }

  function remove(id: string) {
    setAtas((prev) => prev.filter((a) => a.id !== id))
  }

  function getById(id: string) {
    return atas.find((a) => a.id === id)
  }

  return { atas, upsert, remove, getById }
}
