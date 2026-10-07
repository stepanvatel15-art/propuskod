import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/roles'

export default async function Home() {
  const { profile } = await getSession()
  redirect(profile ? ROLE_HOME[profile.role] ?? '/login' : '/login')
}
