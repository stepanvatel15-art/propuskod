type AuthClient = { auth: { getClaims: () => Promise<{ data: { claims: { sub?: string } } | null; error: unknown }> } }

/**
 * ID вошедшего пользователя из проверенного токена.
 *
 * getClaims() проверяет подпись токена. С современными (асимметричными)
 * ключами Supabase это делается прямо на нашем сервере — без запроса к базе,
 * что экономит целое обращение через интернет на каждой странице.
 * Со старыми ключами работает как getUser() — так же надёжно, просто медленнее.
 */
export async function getUserId(supabase: AuthClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  return data.claims.sub
}
