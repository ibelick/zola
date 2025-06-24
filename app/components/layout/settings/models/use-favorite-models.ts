import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { debounce } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef } from "react"

type FavoriteModelsResponse = {
  favorite_models: string[]
}

export function useFavoriteModels() {
  const queryClient = useQueryClient()
  const { favoriteModels: initialFavoriteModels, refreshFavoriteModelsSilent } =
    useModel()
  const { refreshUser } = useUser()

  // Ensure we always have an array
  const safeInitialData = Array.isArray(initialFavoriteModels)
    ? initialFavoriteModels
    : []

  // Query to fetch favorite models
  const {
    data: favoriteModels = safeInitialData,
    isLoading,
    error,
  } = useQuery<string[]>({
    queryKey: ["favorite-models"],
    queryFn: async () => {
      const response = await fetchClient(
        "/api/user-preferences/favorite-models"
      )

      if (!response.ok) {
        throw new Error("Failed to fetch favorite models")
      }

      const data: FavoriteModelsResponse = await response.json()
      return data.favorite_models || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    initialData: safeInitialData,
  })

  // Mutation to update favorite models
  const updateFavoriteModelsMutation = useMutation({
    mutationFn: async (favoriteModels: string[]) => {
      const response = await fetchClient(
        "/api/user-preferences/favorite-models",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            favorite_models: favoriteModels,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }))
        throw new Error(
          errorData.error ||
            `Failed to save favorite models: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result
    },
    onMutate: async (newFavoriteModels) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["favorite-models"] })

      // Snapshot the previous value
      const previousFavoriteModels = queryClient.getQueryData<string[]>([
        "favorite-models",
      ])

      // Optimistically update to the new value
      queryClient.setQueryData(["favorite-models"], newFavoriteModels)

      // Return a context object with the snapshotted value
      return { previousFavoriteModels }
    },
    onError: (error, _newFavoriteModels, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (
        context &&
        "previousFavoriteModels" in context &&
        context.previousFavoriteModels
      ) {
        queryClient.setQueryData(
          ["favorite-models"],
          context.previousFavoriteModels
        )
      }

      console.error("❌ Error saving favorite models:", error)

      toast({
        title: "Failed to save favorite models",
        description: error.message || "Please try again.",
      })

      // Also refresh ModelProvider and UserProvider on error to sync back with server state
      refreshFavoriteModelsSilent()
      refreshUser()
    },
    onSuccess: () => {
      // Invalidate the cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["favorite-models"] })

      // Also refresh the ModelProvider's favorite models (silently)
      refreshFavoriteModelsSilent()

      // Also refresh the UserProvider to update user.favorite_models
      refreshUser()
    },
  })

  // Debounced version of the mutation for reordering
  const debouncedUpdateFavoriteModels = useRef(
    debounce((favoriteModels: string[]) => {
      updateFavoriteModelsMutation.mutate(favoriteModels)
    }, 500)
  ).current

  // Wrapper function that decides whether to debounce or not
  const updateFavoriteModels = useCallback(
    (favoriteModels: string[], shouldDebounce = false) => {
      // Always update the cache immediately for optimistic updates
      queryClient.setQueryData(["favorite-models"], favoriteModels)

      if (shouldDebounce) {
        debouncedUpdateFavoriteModels(favoriteModels)
      } else {
        updateFavoriteModelsMutation.mutate(favoriteModels)
      }
    },
    [updateFavoriteModelsMutation, debouncedUpdateFavoriteModels, queryClient]
  )

  return {
    favoriteModels,
    isLoading,
    error,
    updateFavoriteModels,
    updateFavoriteModelsDebounced: (favoriteModels: string[]) =>
      updateFavoriteModels(favoriteModels, true),
    isUpdating: updateFavoriteModelsMutation.isPending,
    updateError: updateFavoriteModelsMutation.error,
  }
}
