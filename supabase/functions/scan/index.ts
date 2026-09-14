import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) return json({ ok: false, reason: 'unauthorized' }, 401)

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: userError } = await callerClient.auth.getUser()
  if (userError || !user) return json({ ok: false, reason: 'unauthorized' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !callerProfile || !['security', 'admin'].includes(callerProfile.role)) {
    return json({ ok: false, reason: 'forbidden' }, 403)
  }

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, reason: 'bad_request' }, 400)
  }

  const token = body.token?.trim()
  const isUuid = token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
  if (!isUuid) return json({ ok: false, reason: 'invalid_qr' }, 400)

  const nowIso = new Date().toISOString()

  const { data: pass, error: findError } = await admin
    .from('passes')
    .select('id, status, qr_expires_at, student_id, class_id')
    .eq('qr_token', token)
    .maybeSingle()

  if (findError) return json({ ok: false, reason: 'server_error' }, 500)

  if (!pass) return json({ ok: false, reason: 'not_found' })

  if (pass.status === 'used') return json({ ok: false, reason: 'already_used' })

  if (pass.status === 'expired' || (pass.qr_expires_at && pass.qr_expires_at < nowIso)) {
    if (pass.status !== 'expired') {
      await admin.from('passes').update({ status: 'expired' }).eq('id', pass.id).eq('status', 'qr_issued')
    }
    return json({ ok: false, reason: 'expired' })
  }

  if (pass.status !== 'qr_issued') {
    return json({ ok: false, reason: 'not_ready' })
  }

  const { data: updated, error: updateError } = await admin
    .from('passes')
    .update({ status: 'used', used_at: nowIso, used_by: user.id })
    .eq('id', pass.id)
    .eq('status', 'qr_issued')
    .select('id, student_id, class_id')
    .maybeSingle()

  if (updateError) return json({ ok: false, reason: 'server_error' }, 500)

  if (!updated) {
    return json({ ok: false, reason: 'already_used' })
  }

  const { data: student } = await admin
    .from('students')
    .select('full_name')
    .eq('id', updated.student_id)
    .single()

  const { data: klass } = await admin
    .from('classes')
    .select('name')
    .eq('id', updated.class_id)
    .single()

  const shortName = student?.full_name
    ? shortenName(student.full_name)
    : 'Ученик'

  return json({ ok: true, shortName, className: klass?.name ?? '' })
})

function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const [last, first, middle] = parts
  if (!first) return last
  const initials = [first, middle].filter(Boolean).map((p) => p[0].toUpperCase() + '.').join(' ')
  return `${last} ${initials}`
}
