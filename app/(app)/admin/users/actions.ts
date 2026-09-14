'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginToEmail } from '@/lib/auth/login-mapping'

type Role = 'teacher' | 'security' | 'admin'

async function assertCallerIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Не авторизован')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Недостаточно прав')
  return { supabase, adminId: user.id }
}

export async function createUserAction(input: {
  login: string
  password: string
  fullName: string
  role: Role
}) {
  await assertCallerIsAdmin()
  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: loginToEmail(input.login),
    password: input.password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    throw new Error(createError?.message ?? 'Не удалось создать пользователя')
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    login: input.login,
    full_name: input.fullName,
    role: input.role,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id)
    throw new Error(profileError.message)
  }

  revalidatePath('/admin/users')
}

export async function updateUserRoleAction(userId: string, role: Role) {
  const { supabase } = await assertCallerIsAdmin()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function setUserActiveAction(userId: string, isActive: boolean) {
  await assertCallerIsAdmin()
  const admin = createAdminClient()

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : '87600h',
  })
  if (authError) throw new Error(authError.message)

  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
  if (profileError) throw new Error(profileError.message)

  revalidatePath('/admin/users')
}
