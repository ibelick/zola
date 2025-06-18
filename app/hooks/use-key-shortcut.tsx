import { useEffect } from "react"

export function useKeyShortcut(
  keyCombo: (e: KeyboardEvent) => boolean,
  action: () => void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (keyCombo(e)) {
        e.preventDefault()
        action()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [keyCombo, action])
}
