export const ROLE_HOME: Record<string, string> = {
  teacher: '/teacher',
  security: '/duty',
  admin: '/admin',
}

const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: '/teacher', roles: ['teacher', 'admin'] },
  { prefix: '/duty', roles: ['security', 'admin'] },
  { prefix: '/admin', roles: ['admin'] },
]

/** Куда отправить пользователя, если у его роли нет доступа к этому адресу (null — доступ есть). */
export function redirectForRole(path: string, role: string | undefined): string | null {
  const matched = ROUTE_ROLES.find((r) => path.startsWith(r.prefix))
  if (!matched) return null
  if (role && matched.roles.includes(role)) return null
  return role ? ROLE_HOME[role] ?? '/login' : '/login'
}
