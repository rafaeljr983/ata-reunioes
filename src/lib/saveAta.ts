import { ataToRow, rowToAta } from './mappers'
import { supabase } from './supabase'
import type { Ata, AtaRow } from '../types'

/**
 * Salva ata sem usar upsert.
 * O upsert do PostgREST passa pela policy de INSERT mesmo em linha existente,
 * e falha quando created_by é de outro usuário (atas compartilhadas).
 */
export async function saveAtaToSupabase(ata: Ata, userId: string) {
  const payload = ataToRow(ata, userId)
  const { created_by: _createdBy, id, ...updateFields } = payload

  const { data: updated, error: updateError } = await supabase
    .from('atas')
    .update(updateFields)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (updateError) {
    return { ata: null as Ata | null, error: updateError.message }
  }

  if (updated) {
    return { ata: rowToAta(updated as AtaRow), error: null as string | null }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('atas')
    .insert({ ...payload, created_by: userId })
    .select('*')
    .single()

  if (insertError) {
    return { ata: null as Ata | null, error: insertError.message }
  }

  return { ata: rowToAta(inserted as AtaRow), error: null as string | null }
}
