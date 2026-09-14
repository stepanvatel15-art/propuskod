'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'

type ActivePass = {
  id: string
  requested_departure_at: string
  status: string
  qr_token: string | null
  qr_expires_at: string | null
  students: { full_name: string } | null
}

export default function ActiveList({ passes: initial }: { passes: ActivePass[] }) {
  const [passes, setPasses] = useState(initial)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('teacher-passes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'passes' }, (payload) => {
        setPasses((prev) => prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (passes.length === 0) return <p className="text-sm text-gray-500">Нет активных пропусков</p>

  return (
    <ul className="space-y-3">
      {passes.map((p) => (
        <li key={p.id} className="flex items-center justify-between rounded border p-3 text-sm">
          <div>
            <p className="font-medium">{p.students?.full_name}</p>
            <p className="text-gray-500">
              Выход: {new Date(p.requested_departure_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-gray-400">
              {p.status === 'approved' && 'QR появится за 15 минут до выхода'}
              {p.status === 'qr_issued' && p.qr_expires_at &&
                `Действует до ${new Date(p.qr_expires_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
          {p.status === 'qr_issued' && p.qr_token && <QRCodeSVG value={p.qr_token} size={96} />}
        </li>
      ))}
    </ul>
  )
}
