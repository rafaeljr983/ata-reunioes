import type { Ata, Profile } from '../types'

const ATAS_KEY = 'ata.capela.atas'
const QUEUE_KEY = 'ata.capela.queue'
const PROFILE_KEY = 'ata.capela.profile'
const SYNCED_KEY = 'ata.capela.syncedIds'

export type PendingOp =
  | { type: 'upsert'; ata: Ata; userId: string }
  | { type: 'delete'; ataId: string }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadCachedAtas(): Ata[] {
  const atas = readJson<Ata[]>(ATAS_KEY, [])
  return Array.isArray(atas) ? atas : []
}

export function saveCachedAtas(atas: Ata[]) {
  writeJson(ATAS_KEY, atas)
}

export function loadQueue(): PendingOp[] {
  const queue = readJson<PendingOp[]>(QUEUE_KEY, [])
  return Array.isArray(queue) ? queue : []
}

export function saveQueue(queue: PendingOp[]) {
  writeJson(QUEUE_KEY, queue)
}

export function loadSyncedIds(): Set<string> {
  const ids = readJson<string[]>(SYNCED_KEY, [])
  return new Set(Array.isArray(ids) ? ids : [])
}

export function saveSyncedIds(ids: Set<string>) {
  writeJson(SYNCED_KEY, [...ids])
}

export function markSynced(ids: string[]) {
  const set = loadSyncedIds()
  ids.forEach((id) => set.add(id))
  saveSyncedIds(set)
}

export function enqueueUpsert(ata: Ata, userId: string) {
  const queue = loadQueue().filter(
    (op) => !(op.type === 'upsert' && op.ata.id === ata.id) && !(op.type === 'delete' && op.ataId === ata.id),
  )
  queue.push({ type: 'upsert', ata, userId })
  saveQueue(queue)
  return queue
}

export function enqueueDelete(ataId: string) {
  const queue = loadQueue()
  const hadPendingUpsert = queue.some((op) => op.type === 'upsert' && op.ata.id === ataId)
  const wasSynced = loadSyncedIds().has(ataId)
  const next = queue.filter(
    (op) => !(op.type === 'upsert' && op.ata.id === ataId) && !(op.type === 'delete' && op.ataId === ataId),
  )

  // Se já existia no servidor, precisa deletar lá.
  // Se era só rascunho offline (upsert pendente, nunca sincronizado), basta tirar da fila.
  if (wasSynced || !hadPendingUpsert) {
    next.push({ type: 'delete', ataId })
  }

  saveQueue(next)
  const synced = loadSyncedIds()
  synced.delete(ataId)
  saveSyncedIds(synced)
  return next
}

export function clearQueue() {
  saveQueue([])
}

export function loadCachedProfile(): Profile | null {
  return readJson<Profile | null>(PROFILE_KEY, null)
}

export function saveCachedProfile(profile: Profile | null) {
  if (!profile) {
    localStorage.removeItem(PROFILE_KEY)
    return
  }
  writeJson(PROFILE_KEY, profile)
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
