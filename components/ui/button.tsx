import { cn } from './cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size = 'lg' | 'md' | 'sm'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
  success: 'bg-[var(--color-success)] text-white hover:opacity-90',
  secondary:
    'bg-white text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]',
}

const SIZE_CLASSES: Record<Size, string> = {
  lg: 'h-12 px-6 text-[15px]',
  md: 'h-11 px-5 text-sm',
  sm: 'h-9 px-4 text-[13px]',
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
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
}
