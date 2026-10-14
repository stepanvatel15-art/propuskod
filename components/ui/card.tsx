import { cn } from './cn'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--color-surface-card)] shadow-card',
        className
      )}
      {...props}
    />
  )
}
