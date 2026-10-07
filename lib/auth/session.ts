import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from './user-id'

export type SessionProfile = {
  role: string
  full_name: string
  active_building_id: string | null
}

/**
 * Пользователь и его профиль — один раз на запрос.
 *
 * Layout и страница вызывают эту функцию независимо, но благодаря cache()
 * профиль запрашивается из базы только один раз.
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  if (!userId) return { supabase, user: null, profile: null }

  const { data } = await supabase
    .from('profiles')
    .select('role, full_name, active_building_id')
    .eq('id', userId)
    .single()

  return { supabase, user: { id: userId }, profile: data as SessionProfile | null }
})
