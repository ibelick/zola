"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export function ProviderSettings() {
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")
  const [enableOpenRouter, setEnableOpenRouter] = useState(false)
  const [openaiAPIKey, setOpenaiAPIKey] = useState("")
  const [enableOpenAI, setEnableOpenAI] = useState(false)
  const [anthropicAPIKey, setAnthropicAPIKey] = useState("")
  const [enableAnthropic, setEnableAnthropic] = useState(false)
  const [xaiAPIKey, setXaiAPIKey] = useState("")
  const [enableXai, setEnableXai] = useState(false)
  const [googleAPIKey, setGoogleAPIKey] = useState("")
  const [enableGoogle, setEnableGoogle] = useState(false)
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434")
  const [enableOllama, setEnableOllama] = useState(false)

  const handleSave = () => {
    // Save logic here
    console.log("Saving provider settings...")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Provider Settings</h3>
        <p className="text-muted-foreground text-sm">
          Configure your AI model provider settings and API keys.
        </p>
      </div>

      <Tabs defaultValue="openrouter" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
          <TabsTrigger value="xai">xAI</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="ollama">Ollama</TabsTrigger>
        </TabsList>

        <TabsContent value="openrouter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>OpenRouter</span>
                <Switch
                  checked={enableOpenRouter}
                  onCheckedChange={setEnableOpenRouter}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openrouter-key">API Key</Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="your-openrouter-api-key"
                  value={openRouterAPIKey}
                  onChange={(e) => setOpenRouterAPIKey(e.target.value)}
                  disabled={!enableOpenRouter}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>OpenAI</span>
                <Switch
                  checked={enableOpenAI}
                  onCheckedChange={setEnableOpenAI}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-key">API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={openaiAPIKey}
                  onChange={(e) => setOpenaiAPIKey(e.target.value)}
                  disabled={!enableOpenAI}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anthropic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Anthropic</span>
                <Switch
                  checked={enableAnthropic}
                  onCheckedChange={setEnableAnthropic}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="anthropic-key">API Key</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicAPIKey}
                  onChange={(e) => setAnthropicAPIKey(e.target.value)}
                  disabled={!enableAnthropic}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>xAI</span>
                <Switch checked={enableXai} onCheckedChange={setEnableXai} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="xai-key">API Key</Label>
                <Input
                  id="xai-key"
                  type="password"
                  placeholder="xai-..."
                  value={xaiAPIKey}
                  onChange={(e) => setXaiAPIKey(e.target.value)}
                  disabled={!enableXai}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Google</span>
                <Switch
                  checked={enableGoogle}
                  onCheckedChange={setEnableGoogle}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="google-key">API Key</Label>
                <Input
                  id="google-key"
                  type="password"
                  placeholder="your-google-api-key"
                  value={googleAPIKey}
                  onChange={(e) => setGoogleAPIKey(e.target.value)}
                  disabled={!enableGoogle}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ollama" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ollama</span>
                <Switch
                  checked={enableOllama}
                  onCheckedChange={setEnableOllama}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ollama-endpoint">Endpoint</Label>
                <Input
                  id="ollama-endpoint"
                  type="url"
                  placeholder="http://localhost:11434"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  disabled={!enableOllama}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}
