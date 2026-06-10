// Kurze Einblendung am unteren Rand, z.B. "Task gelöscht" mit "Rückgängig".
// Bleibt so lange sichtbar, wie `useTasks` das Rückgängig-Fenster offen hält.
export default function Toast({ message, actionLabel, onAction }) {
  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
    >
      <div className="flex max-w-full items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm text-canvas shadow-lg">
        <span className="truncate">{message}</span>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 font-semibold underline-offset-2 hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
