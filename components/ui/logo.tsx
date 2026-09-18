/**
 * Простой знак-монограмма для внутреннего инструмента школы:
 * стилизованный «пропуск» (билет со скруглённым краем и меткой).
 * Не претендует на реальный герб школы — заменить на официальный
 * логотип школы, когда он будет under public/logo.svg.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="28" height="20" rx="4" fill="var(--color-primary)" />
      <circle cx="10" cy="16" r="3.2" fill="white" />
      <rect x="16" y="12" width="10" height="2.4" rx="1.2" fill="white" fillOpacity="0.85" />
      <rect x="16" y="17" width="7" height="2.4" rx="1.2" fill="white" fillOpacity="0.6" />
    </svg>
  )
}
