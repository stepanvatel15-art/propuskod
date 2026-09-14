import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

const QR_LEAD_MINUTES = 15
const QR_TAIL_MINUTES = 5

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const nowIso = new Date().toISOString()
  const leadCutoff = new Date(Date.now() + QR_LEAD_MINUTES * 60_000).toISOString()

  const { data: due, error: selectError } = await supabase
    .from('passes')
    .select('id, requested_departure_at')
    .eq('status', 'approved')
    .is('qr_token', null)
    .lte('requested_departure_at', leadCutoff)

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), { status: 500 })
  }

  let issued = 0
  for (const pass of due ?? []) {
    const token = crypto.randomUUID()
    const expiresAt = new Date(
      new Date(pass.requested_departure_at).getTime() + QR_TAIL_MINUTES * 60_000
    ).toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('passes')
      .update({
        qr_token: token,
        qr_generated_at: nowIso,
        qr_expires_at: expiresAt,
        status: 'qr_issued',
      })
      .eq('id', pass.id)
      .eq('status', 'approved')
      .select('id')

    if (!updateError && updated && updated.length > 0) issued++
  }

  const { data: expired } = await supabase
    .from('passes')
    .update({ status: 'expired' })
    .eq('status', 'qr_issued')
    .lt('qr_expires_at', nowIso)
    .select('id')

  return new Response(
    JSON.stringify({ issued, expired: expired?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
