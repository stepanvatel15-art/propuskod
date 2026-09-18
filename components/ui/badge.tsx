import { cn } from './cn'
import type { HTMLAttributes } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'primary'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-[var(--color-surface)] text-[var(--color-ink-muted)]',
  accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  danger: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
}
