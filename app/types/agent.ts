import type { Tables } from "./database.types"

export type Agent = Tables<"agents">

export type AgentSummary = Pick<
  Tables<"agents">,
  | "id"
  | "name"
  | "description"
  | "avatar_url"
  | "example_inputs"
  | "creator_id"
  | "slug"
>

export type AgentsSuggestions = Pick<
  Tables<"agents">,
  "id" | "name" | "description" | "avatar_url" | "slug"
>
