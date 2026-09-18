import { cn } from './cn'
import type { InputHTMLAttributes } from 'react'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)]',
        'placeholder:text-[var(--color-ink-muted)]',
        'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]',
        className
      )}
      {...props}
    />
  )
}
