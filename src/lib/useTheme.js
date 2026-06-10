import { useEffect, useState } from 'react'

// Verwaltet Hell/Dunkel. Merkt sich die Wahl in localStorage und kippt die
// Klasse `dark` auf <html>. Beim ersten Besuch richtet es sich nach der
// System-Einstellung des Geräts.
const KEY = 'clarity-theme'

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  // Bei jeder Änderung die Klasse setzen, merken und die theme-color-Meta
  // anpassen, damit die Browser-/Status-Leiste mitzieht.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0f0f10' : '#fafaf9')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // localStorage kann blockiert sein — dann eben nur für diese Sitzung.
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}
