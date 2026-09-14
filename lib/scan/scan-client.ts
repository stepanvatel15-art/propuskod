import { createClient } from '@/lib/supabase/client'

export type ScanResult =
  | { ok: true; shortName: string; className: string }
  | { ok: false; reason: string }

export async function scanToken(token: string): Promise<ScanResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { ok: false, reason: 'unauthorized' }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scan`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token }),
    }
  )

  try {
    return await res.json()
  } catch {
    return { ok: false, reason: 'server_error' }
  }
}

const REASON_LABELS: Record<string, string> = {
  not_found: 'QR не найден',
  already_used: 'QR уже использован',
  expired: 'Срок действия QR истёк',
  not_ready: 'Пропуск ещё не активен',
  invalid_qr: 'Некорректный QR-код',
  unauthorized: 'Сессия истекла, войдите заново',
  forbidden: 'Нет прав на сканирование',
  server_error: 'Ошибка сервера, попробуйте ещё раз',
}

export function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? 'Неизвестная ошибка'
}
