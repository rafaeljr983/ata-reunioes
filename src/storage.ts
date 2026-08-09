import type { Ata } from './types'
import { seedAtas } from './seed'

const KEY = 'ata.reunioes.v1'

export function loadAtas(): Ata[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seed = seedAtas()
      localStorage.setItem(KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as Ata[]
    return Array.isArray(parsed) ? parsed : seedAtas()
  } catch {
    return seedAtas()
  }
}

export function saveAtas(atas: Ata[]): void {
  localStorage.setItem(KEY, JSON.stringify(atas))
}
