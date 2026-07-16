import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { selectTrinityModelIds } from "./models.ts"

test("selectTrinityModelIds keeps the configured flagship and previous-generation models", () => {
  const selected = selectTrinityModelIds([
    "gpt-4.1",
    "gpt-5.4",
    "gpt-5.5",
    "gpt-5.6-terra",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
    "gemini-3.5-flash",
    "glm-5.1",
    "glm-5.2",
    "deepseek-v3.2",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
  ])

  assert.deepEqual(selected, [
    "deepseek-v4-pro",
    "deepseek-v3.2",
    "gemini-3.1-pro-preview",
    "gemini-2.5-pro",
    "glm-5.2",
    "glm-5.1",
    "gpt-5.5",
    "gpt-5.4",
  ])
})
