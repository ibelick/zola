# Zola API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Core API Functions](#core-api-functions)
3. [Chat API](#chat-api)
4. [Model Management](#model-management)
5. [File Handling](#file-handling)
6. [Authentication & User Management](#authentication--user-management)
7. [Store Providers](#store-providers)
8. [UI Components](#ui-components)
9. [Utility Functions](#utility-functions)
10. [Configuration](#configuration)

## Overview

Zola is an open-source chat interface that supports multiple AI models including OpenAI, Mistral, Claude, Gemini, and Ollama. This documentation covers all public APIs, functions, and components available for developers.

## Core API Functions

### `lib/api.ts`

#### `createGuestUser(guestId: string)`
Creates a guest user record on the server.

**Parameters:**
- `guestId` (string): The unique identifier for the guest user

**Returns:** Promise with the created user data

**Example:**
```typescript
import { createGuestUser } from '@/lib/api'

const userData = await createGuestUser('guest-123')
```

#### `checkRateLimits(userId: string, isAuthenticated: boolean)`
Checks the user's daily usage and increments both overall and daily counters.

**Parameters:**
- `userId` (string): The user's unique identifier
- `isAuthenticated` (boolean): Whether the user is authenticated

**Returns:** Promise with rate limit information

**Example:**
```typescript
import { checkRateLimits } from '@/lib/api'

const rateLimitInfo = await checkRateLimits('user-123', true)
```

#### `updateChatModel(chatId: string, model: string)`
Updates the model for an existing chat.

**Parameters:**
- `chatId` (string): The chat's unique identifier
- `model` (string): The new model identifier

**Returns:** Promise with the updated chat data

**Example:**
```typescript
import { updateChatModel } from '@/lib/api'

await updateChatModel('chat-123', 'gpt-4')
```

#### `signInWithGoogle(supabase: SupabaseClient)`
Signs in user with Google OAuth via Supabase.

**Parameters:**
- `supabase` (SupabaseClient): The Supabase client instance

**Returns:** Promise with OAuth data

**Example:**
```typescript
import { signInWithGoogle } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const oauthData = await signInWithGoogle(supabase)
```

#### `getOrCreateGuestUserId(user: UserProfile | null)`
Gets or creates a guest user ID for anonymous users.

**Parameters:**
- `user` (UserProfile | null): The current user profile

**Returns:** Promise<string | null> - The guest user ID

**Example:**
```typescript
import { getOrCreateGuestUserId } from '@/lib/api'

const guestId = await getOrCreateGuestUserId(null)
```

### Error Classes

#### `UsageLimitError`
Custom error class for usage limit violations.

**Properties:**
- `code` (string): Always set to "DAILY_LIMIT_REACHED"
- `message` (string): Error message

**Example:**
```typescript
import { UsageLimitError } from '@/lib/api'

throw new UsageLimitError('Daily message limit reached')
```

## Chat API

### `app/api/chat/route.ts`

#### `POST` Endpoint
Handles chat message processing and streaming responses.

**Request Body:**
```typescript
type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  enableSearch: boolean
  message_group_id?: string
}
```

**Response:** Streaming text response with reasoning and sources

**Example:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    chatId: 'chat-123',
    userId: 'user-123',
    model: 'gpt-4',
    isAuthenticated: true,
    systemPrompt: 'You are a helpful assistant',
    enableSearch: false
  })
})
```

### Chat Store API

#### `lib/chat-store/chats/api.ts`

##### `createNewChat(userId: string, title?: string, model?: string, isAuthenticated?: boolean, systemPrompt?: string, projectId?: string)`
Creates a new chat session.

**Parameters:**
- `userId` (string): User identifier
- `title` (string, optional): Chat title
- `model` (string, optional): Model to use
- `isAuthenticated` (boolean, optional): Authentication status
- `systemPrompt` (string, optional): Custom system prompt
- `projectId` (string, optional): Associated project ID

**Returns:** Promise<Chats | undefined>

**Example:**
```typescript
import { createNewChat } from '@/lib/chat-store/chats/api'

const chat = await createNewChat('user-123', 'New Chat', 'gpt-4', true)
```

##### `fetchAndCacheChats(userId: string)`
Fetches and caches user's chat history.

**Parameters:**
- `userId` (string): User identifier

**Returns:** Promise<Chats[]>

**Example:**
```typescript
import { fetchAndCacheChats } from '@/lib/chat-store/chats/api'

const chats = await fetchAndCacheChats('user-123')
```

##### `updateChatTitle(id: string, title: string)`
Updates a chat's title.

**Parameters:**
- `id` (string): Chat identifier
- `title` (string): New title

**Returns:** Promise<void>

**Example:**
```typescript
import { updateChatTitle } from '@/lib/chat-store/chats/api'

await updateChatTitle('chat-123', 'Updated Title')
```

##### `deleteChat(id: string, currentChatId?: string)`
Deletes a chat session.

**Parameters:**
- `id` (string): Chat identifier to delete
- `currentChatId` (string, optional): Currently active chat ID

**Returns:** Promise<void>

**Example:**
```typescript
import { deleteChat } from '@/lib/chat-store/chats/api'

await deleteChat('chat-123', 'current-chat-456')
```

## Model Management

### `lib/models/index.ts`

#### `getAllModels()`
Retrieves all available models including dynamically detected ones.

**Returns:** Promise<ModelConfig[]>

**Example:**
```typescript
import { getAllModels } from '@/lib/models'

const models = await getAllModels()
```

#### `getModelsWithAccessFlags()`
Gets models with accessibility flags for free vs pro users.

**Returns:** Promise<ModelConfig[]>

**Example:**
```typescript
import { getModelsWithAccessFlags } from '@/lib/models'

const modelsWithFlags = await getModelsWithAccessFlags()
```

#### `getModelsForProvider(provider: string)`
Gets models for a specific provider.

**Parameters:**
- `provider` (string): Provider identifier

**Returns:** Promise<ModelConfig[]>

**Example:**
```typescript
import { getModelsForProvider } from '@/lib/models'

const openaiModels = await getModelsForProvider('openai')
```

#### `getModelsForUserProviders(providers: string[])`
Gets models based on user's available providers.

**Parameters:**
- `providers` (string[]): Array of provider identifiers

**Returns:** Promise<ModelConfig[]>

**Example:**
```typescript
import { getModelsForUserProviders } from '@/lib/models'

const userModels = await getModelsForUserProviders(['openai', 'anthropic'])
```

#### `getModelInfo(modelId: string)`
Gets information about a specific model.

**Parameters:**
- `modelId` (string): Model identifier

**Returns:** ModelConfig | undefined

**Example:**
```typescript
import { getModelInfo } from '@/lib/models'

const modelInfo = getModelInfo('gpt-4')
```

#### `refreshModelsCache()`
Refreshes the models cache.

**Returns:** void

**Example:**
```typescript
import { refreshModelsCache } from '@/lib/models'

refreshModelsCache()
```

### Model Types

#### `ModelConfig`
```typescript
interface ModelConfig {
  id: string
  name: string
  providerId: string
  icon: string
  apiSdk: (apiKey?: string, options?: any) => any
  accessible: boolean
  contextLength?: number
  maxTokens?: number
  pricing?: {
    input: number
    output: number
  }
}
```

## File Handling

### `lib/file-handling.ts`

#### `validateFile(file: File)`
Validates a file for upload.

**Parameters:**
- `file` (File): File to validate

**Returns:** Promise<{ isValid: boolean; error?: string }>

**Example:**
```typescript
import { validateFile } from '@/lib/file-handling'

const validation = await validateFile(file)
if (validation.isValid) {
  // Proceed with upload
} else {
  console.error(validation.error)
}
```

#### `uploadFile(supabase: SupabaseClient, file: File)`
Uploads a file to Supabase storage.

**Parameters:**
- `supabase` (SupabaseClient): Supabase client instance
- `file` (File): File to upload

**Returns:** Promise<string> - Public URL of uploaded file

**Example:**
```typescript
import { uploadFile } from '@/lib/file-handling'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const publicUrl = await uploadFile(supabase, file)
```

#### `createAttachment(file: File, url: string)`
Creates an attachment object from a file and URL.

**Parameters:**
- `file` (File): The file
- `url` (string): Public URL of the file

**Returns:** Attachment

**Example:**
```typescript
import { createAttachment } from '@/lib/file-handling'

const attachment = createAttachment(file, 'https://example.com/file.pdf')
```

#### `processFiles(files: File[], chatId: string, userId: string)`
Processes multiple files for upload.

**Parameters:**
- `files` (File[]): Array of files to process
- `chatId` (string): Chat identifier
- `userId` (string): User identifier

**Returns:** Promise<Attachment[]>

**Example:**
```typescript
import { processFiles } from '@/lib/file-handling'

const attachments = await processFiles(files, 'chat-123', 'user-123')
```

#### `checkFileUploadLimit(userId: string)`
Checks if user has reached file upload limit.

**Parameters:**
- `userId` (string): User identifier

**Returns:** Promise<void>

**Throws:** FileUploadLimitError if limit exceeded

**Example:**
```typescript
import { checkFileUploadLimit } from '@/lib/file-handling'

try {
  await checkFileUploadLimit('user-123')
  // Proceed with upload
} catch (error) {
  if (error instanceof FileUploadLimitError) {
    console.error('Upload limit reached')
  }
}
```

### File Types

#### `Attachment`
```typescript
interface Attachment {
  name: string
  contentType: string
  url: string
}
```

#### `FileUploadLimitError`
Custom error for file upload limit violations.

**Properties:**
- `code` (string): Error code
- `message` (string): Error message

## Authentication & User Management

### User Store

#### `lib/user-store/provider.tsx`

##### `useUser()`
React hook for accessing user state.

**Returns:** UserContextType

**Example:**
```typescript
import { useUser } from '@/lib/user-store/provider'

function MyComponent() {
  const { user, isLoading, signOut } = useUser()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {user ? `Welcome, ${user.email}` : 'Please sign in'}
      {user && <button onClick={signOut}>Sign Out</button>}
    </div>
  )
}
```

### User Keys Management

#### `lib/user-keys.ts`

##### `getEffectiveApiKey(userId: string, provider: ProviderWithoutOllama)`
Gets the effective API key for a user and provider.

**Parameters:**
- `userId` (string): User identifier
- `provider` (ProviderWithoutOllama): Provider type

**Returns:** Promise<string | null>

**Example:**
```typescript
import { getEffectiveApiKey } from '@/lib/user-keys'

const apiKey = await getEffectiveApiKey('user-123', 'openai')
```

## Store Providers

### Chat Store

#### `lib/chat-store/chats/provider.tsx`

##### `useChats()`
React hook for managing chat state.

**Returns:** ChatsContextType

**Methods:**
- `refresh()`: Refresh chat list
- `updateTitle(id, title)`: Update chat title
- `deleteChat(id, currentChatId?, redirect?)`: Delete a chat
- `createNewChat(userId, title?, model?, isAuthenticated?, systemPrompt?, projectId?)`: Create new chat
- `resetChats()`: Reset chat state
- `getChatById(id)`: Get chat by ID
- `updateChatModel(id, model)`: Update chat model
- `bumpChat(id)`: Bump chat to top

**Example:**
```typescript
import { useChats } from '@/lib/chat-store/chats/provider'

function ChatList() {
  const { chats, createNewChat, deleteChat } = useChats()
  
  return (
    <div>
      {chats.map(chat => (
        <div key={chat.id}>
          {chat.title}
          <button onClick={() => deleteChat(chat.id)}>Delete</button>
        </div>
      ))}
      <button onClick={() => createNewChat('user-123')}>New Chat</button>
    </div>
  )
}
```

### Model Store

#### `lib/model-store/provider.tsx`

##### `useModel()`
React hook for managing model state.

**Returns:** ModelContextType

**Properties:**
- `models`: Array of available models
- `isLoading`: Loading state
- `favoriteModels`: User's favorite models
- `toggleFavorite`: Toggle model favorite status

**Example:**
```typescript
import { useModel } from '@/lib/model-store/provider'

function ModelSelector() {
  const { models, favoriteModels, toggleFavorite } = useModel()
  
  return (
    <div>
      {models.map(model => (
        <div key={model.id}>
          {model.name}
          <button onClick={() => toggleFavorite(model.id)}>
            {favoriteModels.includes(model.id) ? '★' : '☆'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

### User Preference Store

#### `lib/user-preference-store/provider.tsx`

##### `useUserPreferences()`
React hook for managing user preferences.

**Returns:** UserPreferencesContextType

**Methods:**
- `isModelHidden(modelId)`: Check if model is hidden
- `toggleModelVisibility(modelId)`: Toggle model visibility
- `getHiddenModels()`: Get hidden models
- `clearHiddenModels()`: Clear all hidden models

**Example:**
```typescript
import { useUserPreferences } from '@/lib/user-preference-store/provider'

function ModelSettings() {
  const { isModelHidden, toggleModelVisibility } = useUserPreferences()
  
  return (
    <div>
      {models.map(model => (
        <div key={model.id}>
          {model.name}
          <input
            type="checkbox"
            checked={!isModelHidden(model.id)}
            onChange={() => toggleModelVisibility(model.id)}
          />
        </div>
      ))}
    </div>
  )
}
```

## UI Components

### Model Selector

#### `components/common/model-selector/base.tsx`

##### `ModelSelector`
Component for selecting AI models.

**Props:**
- `selectedModelId` (string): Currently selected model ID
- `setSelectedModelId` (function): Function to update selected model
- `className` (string, optional): Additional CSS classes
- `isUserAuthenticated` (boolean, optional): User authentication status

**Example:**
```typescript
import { ModelSelector } from '@/components/common/model-selector/base'

function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  
  return (
    <ModelSelector
      selectedModelId={selectedModel}
      setSelectedModelId={setSelectedModel}
      isUserAuthenticated={true}
    />
  )
}
```

### Button Copy

#### `components/common/button-copy.tsx`

##### `ButtonCopy`
Component for copying text to clipboard.

**Props:**
- `text` (string): Text to copy
- `className` (string, optional): Additional CSS classes
- `children` (ReactNode): Button content

**Example:**
```typescript
import { ButtonCopy } from '@/components/common/button-copy'

function CodeBlock({ code }) {
  return (
    <div>
      <pre>{code}</pre>
      <ButtonCopy text={code}>Copy Code</ButtonCopy>
    </div>
  )
}
```

### Feedback Form

#### `components/common/feedback-form.tsx`

##### `FeedbackForm`
Component for collecting user feedback.

**Props:**
- `chatId` (string): Chat identifier
- `messageId` (string): Message identifier
- `className` (string, optional): Additional CSS classes

**Example:**
```typescript
import { FeedbackForm } from '@/components/common/feedback-form'

function Message({ message }) {
  return (
    <div>
      <p>{message.content}</p>
      <FeedbackForm chatId={message.chatId} messageId={message.id} />
    </div>
  )
}
```

### Motion Primitives

#### `components/motion-primitives/useClickOutside.tsx`

##### `useClickOutside`
React hook for detecting clicks outside an element.

**Parameters:**
- `ref` (RefObject): Reference to the element
- `handler` (function): Callback function

**Example:**
```typescript
import { useClickOutside } from '@/components/motion-primitives/useClickOutside'
import { useRef } from 'react'

function Dropdown() {
  const ref = useRef(null)
  
  useClickOutside(ref, () => {
    // Close dropdown
  })
  
  return <div ref={ref}>Dropdown content</div>
}
```

## Utility Functions

### `lib/utils.ts`

#### `cn(...inputs: ClassValue[])`
Combines class names using clsx and tailwind-merge.

**Parameters:**
- `inputs` (ClassValue[]): Class names to combine

**Returns:** string

**Example:**
```typescript
import { cn } from '@/lib/utils'

const className = cn('base-class', condition && 'conditional-class', 'another-class')
```

#### `formatNumber(n: number)`
Formats a number with commas for thousands.

**Parameters:**
- `n` (number): Number to format

**Returns:** string

**Example:**
```typescript
import { formatNumber } from '@/lib/utils'

const formatted = formatNumber(1234567) // "1,234,567"
```

#### `debounce<T extends (...args: any[]) => any>(func: T, wait: number)`
Creates a debounced function.

**Parameters:**
- `func` (T): Function to debounce
- `wait` (number): Wait time in milliseconds

**Returns:** Debounced function

**Example:**
```typescript
import { debounce } from '@/lib/utils'

const debouncedSearch = debounce((query) => {
  // Perform search
}, 300)

// Use in input onChange
<input onChange={(e) => debouncedSearch(e.target.value)} />
```

### Encryption

#### `lib/encryption.ts`

##### `encrypt(text: string, key: string)`
Encrypts text using AES encryption.

**Parameters:**
- `text` (string): Text to encrypt
- `key` (string): Encryption key

**Returns:** string

**Example:**
```typescript
import { encrypt } from '@/lib/encryption'

const encrypted = encrypt('sensitive data', 'secret-key')
```

##### `decrypt(encryptedText: string, key: string)`
Decrypts text using AES encryption.

**Parameters:**
- `encryptedText` (string): Text to decrypt
- `key` (string): Decryption key

**Returns:** string

**Example:**
```typescript
import { decrypt } from '@/lib/encryption'

const decrypted = decrypt(encrypted, 'secret-key')
```

### Sanitization

#### `lib/sanitize.ts`

##### `sanitizeHtml(html: string)`
Sanitizes HTML content to prevent XSS attacks.

**Parameters:**
- `html` (string): HTML content to sanitize

**Returns:** string

**Example:**
```typescript
import { sanitizeHtml } from '@/lib/sanitize'

const safeHtml = sanitizeHtml(userInput)
```

## Configuration

### `lib/config.ts`

#### Constants

```typescript
// Rate limits
export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5
export const AUTH_DAILY_MESSAGE_LIMIT = 1000
export const DAILY_FILE_UPLOAD_LIMIT = 5
export const DAILY_LIMIT_PRO_MODELS = 500

// Free models
export const FREE_MODELS_IDS = [
  "openrouter:deepseek/deepseek-r1:free",
  "openrouter:meta-llama/llama-3.3-8b-instruct:free",
  "pixtral-large-latest",
  "mistral-large-latest",
  "gpt-4.1-nano",
]

// Default model
export const MODEL_DEFAULT = "gpt-4.1-nano"

// App settings
export const APP_NAME = "Zola"
export const APP_DOMAIN = "https://zola.chat"

// Message limits
export const MESSAGE_MAX_LENGTH = 10000
```

#### Suggestions

The `SUGGESTIONS` array contains predefined prompt suggestions organized by category:

- **Summary**: Summarization prompts
- **Code**: Programming help prompts
- **Design**: Design-related prompts
- **Research**: Research prompts
- **Get inspired**: Creative inspiration prompts
- **Think deeply**: Reflection prompts
- **Learn gently**: Educational prompts

#### System Prompt

```typescript
export const SYSTEM_PROMPT_DEFAULT = `You are Zola, a thoughtful and clear assistant...`
```

### Routes

#### `lib/routes.ts`

```typescript
export const API_ROUTE_CREATE_GUEST = "/api/create-guest"
export const API_ROUTE_UPDATE_CHAT_MODEL = "/api/update-chat-model"
```

## Error Handling

### Common Error Types

1. **UsageLimitError**: Thrown when daily usage limits are exceeded
2. **FileUploadLimitError**: Thrown when file upload limits are exceeded
3. **Network Errors**: Standard fetch/network errors
4. **Validation Errors**: Input validation failures

### Error Handling Best Practices

```typescript
try {
  const result = await someApiCall()
  // Handle success
} catch (error) {
  if (error instanceof UsageLimitError) {
    // Handle usage limit error
    console.error('Usage limit reached:', error.message)
  } else if (error instanceof FileUploadLimitError) {
    // Handle file upload limit error
    console.error('File upload limit reached:', error.message)
  } else {
    // Handle other errors
    console.error('Unexpected error:', error)
  }
}
```

## TypeScript Types

### Core Types

```typescript
// User types
interface UserProfile {
  id: string
  email?: string
  is_anonymous?: boolean
}

// Chat types
interface Chats {
  id: string
  title: string
  model: string
  user_id: string
  created_at: string
  updated_at: string
  system_prompt?: string
  project_id?: string
}

// Message types
interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  chat_id: string
  created_at: string
  attachments?: Attachment[]
}

// Model types
interface ModelConfig {
  id: string
  name: string
  providerId: string
  icon: string
  apiSdk: (apiKey?: string, options?: any) => any
  accessible: boolean
  contextLength?: number
  maxTokens?: number
  pricing?: {
    input: number
    output: number
  }
}
```

## Best Practices

### API Usage

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Rate Limiting**: Respect rate limits and handle UsageLimitError gracefully
3. **Authentication**: Check user authentication status before making authenticated calls
4. **File Validation**: Always validate files before upload
5. **Caching**: Use provided caching mechanisms for better performance

### Component Usage

1. **Store Providers**: Wrap components with appropriate store providers
2. **Hooks**: Use provided hooks for state management
3. **Error Boundaries**: Implement error boundaries for better UX
4. **Loading States**: Handle loading states appropriately
5. **Accessibility**: Ensure components are accessible

### Security

1. **API Keys**: Never expose API keys in client-side code
2. **Input Validation**: Always validate user inputs
3. **File Uploads**: Validate file types and sizes
4. **XSS Prevention**: Use sanitization functions for user content
5. **Authentication**: Implement proper authentication flows

## Migration Guide

### Breaking Changes

When updating Zola, check for:
- API endpoint changes
- Type definition updates
- Store provider interface changes
- Component prop changes

### Version Compatibility

- Check package.json for dependency versions
- Review changelog for breaking changes
- Test thoroughly after updates

## Support

For issues and questions:
- Check the [GitHub repository](https://github.com/ibelick/zola)
- Review the [INSTALL.md](./INSTALL.md) for setup instructions
- Open an issue for bugs or feature requests

---

*This documentation covers the current version of Zola. For the latest updates, refer to the source code and release notes.*