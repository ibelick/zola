"use server"

import { toast } from "@/components/ui/toast"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signOut() {
  if (!isSupabaseEnabled) {
    toast({
      title: "Sign out is not supported in this deployment",
      status: "info",
    })
    return
  }

  const supabase = await createClient()

  if (!supabase) {
    toast({
      title: "Sign out is not supported in this deployment",
      status: "info",
    })
    return
  }

  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth/login")
}
