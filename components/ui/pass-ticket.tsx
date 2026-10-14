import { cn } from './cn'
import type { ReactNode } from 'react'

type Tone = 'primary' | 'accent' | 'success' | 'neutral'

const STUB: Record<Tone, string> = {
  primary: 'bg-[#eef3fe] text-[var(--color-primary)]',
  accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  neutral: 'bg-[#eef1f6] text-[#344054]',
}

/**
 * Заявка в виде «билета»: слева крупное время, справа — ученик и кнопки.
 * На телефоне корешок сужается, кнопки уходят под текст.
 */
export function PassTicket({
  time,
  caption,
  tone = 'primary',
  children,
  actions,
  className,
}: {
  time: string
  caption?: string | null
  tone?: Tone
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex overflow-hidden rounded-2xl bg-white shadow-card', className)}>
      <div
        className={cn(
          'flex w-[92px] shrink-0 flex-col justify-center border-r-2 border-dashed border-[#dfe5f0] px-3 py-3 sm:w-[140px] sm:px-5',
          STUB[tone]
        )}
      >
        <span className="tabular text-2xl font-extrabold leading-tight tracking-tight sm:text-[32px]">{time}</span>
        {caption && <span className="text-[11px] font-bold leading-tight sm:text-xs">{caption}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-3.5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-5 sm:py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[220px]">{children}</div>
        {actions && <div className="flex flex-col-reverse gap-1 sm:flex-row sm:items-center sm:gap-2">{actions}</div>}
      </div>
    </div>
  )
}
