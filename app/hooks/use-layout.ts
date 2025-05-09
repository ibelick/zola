import { useEffect, useState } from "react"

export type LayoutType = "sidebar" | "fullscreen"

const STORAGE_KEY = "preferred-layout"

export function useLayout() {
  const [layout, setLayout] = useState<LayoutType>("sidebar")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LayoutType
    if (stored) setLayout(stored)
  }, [])

  const updateLayout = (value: LayoutType) => {
    setLayout(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  return { layout, setLayout: updateLayout }
}
