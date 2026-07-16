import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's TypeScript test runner requires the explicit extension.
import { getAdPlatformCspSources } from "./csp.ts"

test("getAdPlatformCspSources includes the ad server HTTP origin", () => {
  assert.deepEqual(getAdPlatformCspSources("http://10.1.51.76:8080/api"), [
    "http://10.1.51.76:8080",
  ])
})

test("getAdPlatformCspSources includes local test origins when requested", () => {
  assert.deepEqual(
    getAdPlatformCspSources("http://10.1.51.76:8080", {
      extraOrigins: "http://localhost:8080, https://ads.example.test/path",
    }),
    [
      "http://10.1.51.76:8080",
      "http://localhost:8080",
      "https://ads.example.test",
    ]
  )
})

test("getAdPlatformCspSources ignores invalid and non-HTTP origins", () => {
  assert.deepEqual(
    getAdPlatformCspSources("ws://10.1.51.76:8080", {
      extraOrigins:
        "javascript:alert(1), ws://ads.example.test, not-a-url, http://10.1.51.76:8080/path",
    }),
    ["http://10.1.51.76:8080"]
  )
})

test("getAdPlatformCspSources deduplicates origins", () => {
  assert.deepEqual(
    getAdPlatformCspSources("http://10.1.51.76:8080/api", {
      extraOrigins: "http://10.1.51.76:8080, http://10.1.51.76:8080/imp",
    }),
    ["http://10.1.51.76:8080"]
  )
})
