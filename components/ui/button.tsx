import { cn } from './cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'md' | 'sm'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
  secondary:
    'bg-white text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)]',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
}
