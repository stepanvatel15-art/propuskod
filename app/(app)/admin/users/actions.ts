'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginToEmail } from '@/lib/auth/login-mapping'

type Role = 'teacher' | 'security' | 'admin'
type ActionResult = { ok: true } | { error: string }

async function assertCallerIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Недостаточно прав' } as const
  return { ok: true as const, supabase, adminId: user.id }
}

export async function createUserAction(input: {
  login: string
  password: string
  fullName: string
  role: Role
}): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: loginToEmail(input.login),
    password: input.password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    return { error: createError?.message ?? 'Не удалось создать пользователя' }
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    login: input.login,
    full_name: input.fullName,
    role: input.role,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/users')
  return { ok: true }
}

export async function updateUserRoleAction(userId: string, role: Role): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const { error } = await auth.supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function setUserActiveAction(userId: string, isActive: boolean): Promise<ActionResult> {
  const auth = await assertCallerIsAdmin()
  if ('error' in auth) return auth

  const admin = createAdminClient()

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : '87600h',
  })
  if (authError) return { error: authError.message }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/users')
  return { ok: true }
}
