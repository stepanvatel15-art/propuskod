// Показывается сразу при переходе между вкладками, пока сервер готовит страницу.
// Боковое меню остаётся на месте — меняется только содержимое справа.
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6" aria-busy="true" aria-label="Загрузка">
      <div className="h-7 w-48 rounded-lg bg-black/10" />
      <div className="h-32 rounded-xl bg-black/5" />
      <div className="h-48 rounded-xl bg-black/5" />
    </div>
  )
}
