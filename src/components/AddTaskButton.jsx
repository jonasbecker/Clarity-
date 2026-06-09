import { Plus } from 'lucide-react'

// Schwebender "+ Task"-Button zum schnellen Erfassen.
// Phase 1: nur UI. `onClick` ist noch ohne echte Funktion.
export default function AddTaskButton() {
  return (
    <button
      type="button"
      onClick={() => {
        // Platzhalter: hier öffnet später das Schnell-Erfassen-Formular.
      }}
      aria-label="Neue Task erfassen"
      className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 font-medium text-white shadow-lg transition-transform active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      <Plus size={20} strokeWidth={2.5} />
      <span className="hidden sm:inline">Task</span>
    </button>
  )
}
