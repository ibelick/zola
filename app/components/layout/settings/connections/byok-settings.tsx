"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PROVIDERS } from "@/lib/providers"
import { Pencil, Save } from "lucide-react"
import { useEffect, useState } from "react"

// Mock function to simulate loading saved keys
const loadSavedKeys = (): Record<string, string> => {
  // In a real app, this would load from localStorage, database, etc.
  return {
    openrouter: "saved-key-1",
    OPENAI_API_KEY: "saved-key-2",
  }
}

export function ByokSettings() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({})
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  // Load saved keys on component mount
  useEffect(() => {
    const keys = loadSavedKeys()
    setSavedKeys(keys)
    setApiKeys(keys)
  }, [])

  // Check for changes
  useEffect(() => {
    let changed = false

    // Compare current keys with saved keys
    Object.keys({ ...apiKeys, ...savedKeys }).forEach((key) => {
      if (apiKeys[key] !== savedKeys[key]) {
        changed = true
      }
    })

    setHasChanges(changed)
  }, [apiKeys, savedKeys])

  const handleKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [providerId]: value,
    }))
  }

  const toggleEditing = (providerId: string) => {
    const newEditing = new Set(editingKeys)
    if (newEditing.has(providerId)) {
      newEditing.delete(providerId)
    } else {
      newEditing.add(providerId)
    }
    setEditingKeys(newEditing)
  }

  const saveChanges = () => {
    // In a real app, this would save to localStorage, database, etc.
    setSavedKeys({ ...apiKeys })
    setEditingKeys(new Set())
    setHasChanges(false)
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">API Keys</h3>
        <p className="text-muted-foreground text-sm">
          Configure API keys for your AI model providers.
        </p>
      </div>
      {PROVIDERS.map((provider) => (
        <div key={provider.id} className="space-y-3">
          <div className="space-y-2">
            <div>
              <label
                htmlFor={`${provider.id}-key`}
                className="mb-1 block text-sm font-medium"
              >
                {provider.name} Key
              </label>

              {savedKeys[provider.id] && !editingKeys.has(provider.id) ? (
                <div className="flex items-center">
                  <div className="bg-muted flex-1 rounded-md border px-3 py-2">
                    ••••••••••
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEditing(provider.id)}
                    className="ml-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  id={`${provider.id}-key`}
                  type="password"
                  placeholder="your-api-key-here"
                  value={apiKeys[provider.id] || ""}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {hasChanges && (
        <div className="mt-6 flex justify-end">
          <Button onClick={saveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </div>
      )}
    </div>
  )
}
