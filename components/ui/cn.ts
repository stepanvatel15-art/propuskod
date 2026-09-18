/** Простой merge classNames без внешних зависимостей (clsx/tailwind-merge не устанавливаем). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
