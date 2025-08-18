import type { Chats } from "@/lib/chat-store/types"

type TimeGroup = {
  name: string
  chats: Chats[]
}

// Group chats by time periods
export function groupChatsByDate(
  chats: Chats[],
  searchQuery: string
): TimeGroup[] | null {
  if (searchQuery) return null // Don't group when searching

  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const weekAgo = today - 7 * 24 * 60 * 60 * 1000
  const monthAgo = today - 30 * 24 * 60 * 60 * 1000
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime()

  const todayChats: Chats[] = []
  const last7DaysChats: Chats[] = []
  const last30DaysChats: Chats[] = []
  const thisYearChats: Chats[] = []
  const olderChats: Record<number, Chats[]> = {}

  chats.forEach((chat) => {
    if (chat.project_id) return
    if (chat.pinned) return

    if (!chat.updated_at) {
      todayChats.push(chat)
      return
    }

    const chatTimestamp = new Date(chat.updated_at).getTime()

    if (chatTimestamp >= today) {
      todayChats.push(chat)
    } else if (chatTimestamp >= weekAgo) {
      last7DaysChats.push(chat)
    } else if (chatTimestamp >= monthAgo) {
      last30DaysChats.push(chat)
    } else if (chatTimestamp >= yearStart) {
      thisYearChats.push(chat)
    } else {
      const year = new Date(chat.updated_at).getFullYear()
      if (!olderChats[year]) {
        olderChats[year] = []
      }
      olderChats[year].push(chat)
    }
  })

  const result: TimeGroup[] = []

  if (todayChats.length > 0) {
    result.push({ name: "Today", chats: todayChats })
  }

  if (last7DaysChats.length > 0) {
    result.push({ name: "Last 7 days", chats: last7DaysChats })
  }

  if (last30DaysChats.length > 0) {
    result.push({ name: "Last 30 days", chats: last30DaysChats })
  }

  if (thisYearChats.length > 0) {
    result.push({ name: "This year", chats: thisYearChats })
  }

  Object.entries(olderChats)
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .forEach(([year, yearChats]) => {
      result.push({ name: year, chats: yearChats })
    })

  return result
}

// Format date in a human-readable way
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "No date"

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Less than 1 hour: show minutes
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return "Just now"
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`
  }

  // Less than 24 hours: show hours
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
  }

  // Less than 7 days: show days
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
  }

  // Same year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  }

  // Different year: show month, day and year
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
