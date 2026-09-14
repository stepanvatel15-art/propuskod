const LOGIN_DOMAIN = 'school.internal'

export function loginToEmail(login: string): string {
  return `${login.trim().toLowerCase()}@${LOGIN_DOMAIN}`
}
