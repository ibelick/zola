"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSettingsStore } from "@/lib/settings-store/store"
import { OpenAICompatibleProvider } from "@/lib/settings-store/types"
import { Gear, Plus, Trash } from "@phosphor-icons/react"
import { useState } from "react"

interface SettingsDialogProps {
  children?: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const {
    providers,
    customProviders,
    updateProvider,
    addCustomProvider,
    removeCustomProvider,
  } = useSettingsStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newProvider, setNewProvider] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
  })

  const handleAddCustomProvider = () => {
    if (!newProvider.name || !newProvider.baseUrl) return

    const provider: OpenAICompatibleProvider = {
      id: `custom-${Date.now()}`,
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      apiKey: newProvider.apiKey,
      enabled: true,
      type: "openai-compatible",
    }

    addCustomProvider(provider)
    setNewProvider({ name: "", baseUrl: "", apiKey: "" })
  }

  const trigger = children || (
    <Button variant="ghost" size="sm">
      <Gear className="size-4" />
      Settings
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure model providers and API settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="custom">Custom Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Model Providers</h3>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {provider.type === "ollama"
                        ? "Local AI models"
                        : `${provider.name} API`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {provider.type === "ollama" && (
                      <div className="space-y-2">
                        <Label
                          htmlFor={`${provider.id}-url`}
                          className="text-sm"
                        >
                          Base URL
                        </Label>
                        <Input
                          id={`${provider.id}-url`}
                          value={provider.baseUrl || ""}
                          onChange={(e) =>
                            updateProvider(provider.id, {
                              baseUrl: e.target.value,
                            })
                          }
                          placeholder="http://localhost:11434"
                          className="w-48"
                        />
                      </div>
                    )}
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(enabled) =>
                        updateProvider(provider.id, { enabled })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Custom OpenAI-Compatible Providers
              </h3>

              {/* Add new provider form */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Add New Provider</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-name">Provider Name</Label>
                    <Input
                      id="provider-name"
                      value={newProvider.name}
                      onChange={(e) =>
                        setNewProvider({ ...newProvider, name: e.target.value })
                      }
                      placeholder="My Custom Provider"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-url">Base URL</Label>
                    <Input
                      id="provider-url"
                      value={newProvider.baseUrl}
                      onChange={(e) =>
                        setNewProvider({
                          ...newProvider,
                          baseUrl: e.target.value,
                        })
                      }
                      placeholder="https://api.example.com/v1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-key">API Key (Optional)</Label>
                  <Input
                    id="provider-key"
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) =>
                      setNewProvider({ ...newProvider, apiKey: e.target.value })
                    }
                    placeholder="sk-..."
                  />
                </div>
                <Button
                  onClick={handleAddCustomProvider}
                  disabled={!newProvider.name || !newProvider.baseUrl}
                >
                  <Plus className="mr-2 size-4" />
                  Add Provider
                </Button>
              </div>

              {/* Existing custom providers */}
              {customProviders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Custom Providers</h4>
                  {customProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {provider.baseUrl}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(enabled) =>
                            updateProvider(provider.id, { enabled })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomProvider(provider.id)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {customProviders.length === 0 && (
                <div className="text-muted-foreground py-8 text-center">
                  No custom providers configured yet.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
