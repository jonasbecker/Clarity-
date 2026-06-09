import { Plus } from 'lucide-react'

// Schwebender "+ Task"-Button zum schnellen Erfassen.
// Der Button selbst weiß nicht, was passiert — er ruft nur `onClick` auf,
// das er als Prop bekommt. So bleibt er wiederverwendbar.
export default function AddTaskButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Neue Task erfassen"
      className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 font-medium text-canvas shadow-lg transition-transform active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      <Plus size={20} strokeWidth={2.5} />
      <span className="hidden sm:inline">Task</span>
    </button>
  )
}
