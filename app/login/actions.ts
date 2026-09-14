'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginToEmail } from '@/lib/auth/login-mapping'

export async function loginAction(formData: FormData) {
  const login = String(formData.get('login') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!login || !password) {
    return { error: 'Введите логин и пароль' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: loginToEmail(login),
    password,
  })

  if (error) {
    return { error: 'Неверный логин или пароль' }
  }

  redirect('/') // middleware перекинет на нужный роут по роли
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
