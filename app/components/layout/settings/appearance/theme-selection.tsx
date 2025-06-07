"use client"

import { useTheme } from "next-themes"
import { useState } from "react"

export function ThemeSelection() {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(theme || "system")

  const themes = [
    { id: "system", name: "System", colors: ["#ffffff", "#1a1a1a"] },
    { id: "light", name: "Light", colors: ["#ffffff"] },
    { id: "dark", name: "Dark", colors: ["#1a1a1a"] },
  ]

  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">Theme</h4>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => {
              setSelectedTheme(theme.id)
              setTheme(theme.id)
            }}
            className={`rounded-lg border p-3 ${
              selectedTheme === theme.id
                ? "border-primary ring-primary/30 ring-2"
                : "border-border"
            }`}
          >
            <div className="mb-2 flex space-x-1">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="border-border h-4 w-4 rounded-full border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-left text-sm font-medium">{theme.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
