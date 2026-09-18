import { cn } from './cn'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)]',
        className
      )}
      {...props}
    />
  )
}
