'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Держит список на экране свежим.
 *
 * 1. Живое обновление (Supabase Realtime) — сразу при изменении в таблице.
 *    Перед подпиской передаём токен входа: без него Realtime считает
 *    пользователя анонимным, и правила доступа (RLS) не пропускают события.
 * 2. Страховка: страница перезапрашивается каждые `pollMs` миллисекунд,
 *    а также при возвращении на вкладку и восстановлении интернета —
 *    планшет дежурного засыпает, и живое соединение рвётся молча.
 */
export function useLiveRefresh({
  channel,
  table,
  filter,
  pollMs,
}: {
  channel: string
  table: string
  filter: string
  pollMs: number
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let ch: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const token = data.session?.access_token
      if (token) supabase.realtime.setAuth(token)
      ch = supabase
        .channel(channel)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => router.refresh())
        .subscribe()
    })

    // токен входа обновляется примерно раз в час — передаём новый в Realtime
    const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)
    })

    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const timer = setInterval(refresh, pollMs)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('focus', refresh)

    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('focus', refresh)
      authSub.subscription.unsubscribe()
      if (ch) supabase.removeChannel(ch)
    }
  }, [channel, table, filter, pollMs, router])
}
