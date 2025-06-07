export interface ProviderSettings {
  id: string
  name: string
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  type: 'openai' | 'anthropic' | 'google' | 'mistral' | 'xai' | 'deepseek' | 'ollama' | 'openai-compatible'
}

export interface OpenAICompatibleProvider extends ProviderSettings {
  type: 'openai-compatible'
  baseUrl: string
  name: string
  models?: string[]
}

export interface SettingsState {
  providers: ProviderSettings[]
  customProviders: OpenAICompatibleProvider[]
}

export interface SettingsActions {
  updateProvider: (id: string, settings: Partial<ProviderSettings>) => void
  addCustomProvider: (provider: OpenAICompatibleProvider) => void
  removeCustomProvider: (id: string) => void
  resetSettings: () => void
} 