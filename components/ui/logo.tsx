/* eslint-disable @next/next/no-img-element */

/** Официальный логотип школы 1353 (public/logo-1353.png, прозрачный фон). */
export function Logo({ height = 56 }: { height?: number }) {
  return (
    <img
      src="/logo-1353.png"
      alt="Школа 1353"
      height={height}
      width={Math.round((height * 188) / 240)}
      style={{ height, width: 'auto' }}
      className="shrink-0"
    />
  )
}
