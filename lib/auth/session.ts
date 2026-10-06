import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type SessionProfile = {
  role: string
  full_name: string
  active_building_id: string | null
}

/**
 * Пользователь и его профиль — один раз на запрос.
 *
 * Layout и страница вызывают эту функцию независимо, но благодаря cache()
 * запросы к Supabase (проверка входа + профиль) уходят только один раз,
 * а не дважды. Сервер Supabase далеко, каждый лишний запрос — заметная задержка.
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, profile: null }

  const { data } = await supabase
    .from('profiles')
    .select('role, full_name, active_building_id')
    .eq('id', user.id)
    .single()

  return { supabase, user, profile: data as SessionProfile | null }
})
