import type { Tables } from "@/app/types/database.types"
import type { UserPreferences } from "../user-preference-store/utils"

export type UserProfile = {
  profile_image: string
  display_name: string
  preferences?: UserPreferences
} & Tables<"users">
