"use client"

import { ModelSelector } from "@/components/common/model-selector/base"
import { MODEL_DEFAULT } from "@/lib/config"
import { useUser } from "@/lib/user-store/provider"
import { useEffect, useState } from "react"
import { SystemPromptSection } from "./system-prompt"

export function ModelPreferences() {
  const { user, updateUser } = useUser()
  const [selectedModelId, setSelectedModelId] = useState<string>(
    user?.preferred_model || MODEL_DEFAULT
  )

  useEffect(() => {
    if (user?.preferred_model) {
      setSelectedModelId(user.preferred_model)
    }
  }, [user?.preferred_model])

  const handleModelSelection = async (value: string) => {
    setSelectedModelId(value)
    await updateUser({ preferred_model: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Preferred model</h3>
        <div className="relative">
          <ModelSelector
            selectedModelId={selectedModelId}
            setSelectedModelId={handleModelSelection}
            className="w-full"
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          This model will be used by default for new conversations.
        </p>
      </div>

      <SystemPromptSection />
    </div>
  )
}
