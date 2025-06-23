import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type FavoriteModelsResponse = {
  favorite_models: string[]
}

export function useFavoriteModels() {
  const queryClient = useQueryClient()

  // Query to fetch favorite models
  const {
    data: favoriteModels = [],
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
  })

  // Mutation to update favorite models
  const updateFavoriteModelsMutation = useMutation({
    mutationFn: async (favoriteModels: string[]) => {
      console.log("🔄 Saving favorite models order:", favoriteModels)

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
      console.log("✅ Successfully saved favorite models:", result)
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
      if (context?.previousFavoriteModels) {
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
    },
    onSettled: () => {
      // Always refetch after error or success:
      // This will refetch from the server and update the cache
      queryClient.invalidateQueries({ queryKey: ["favorite-models"] })
    },
  })

  return {
    favoriteModels,
    isLoading,
    error,
    updateFavoriteModels: updateFavoriteModelsMutation.mutate,
    isUpdating: updateFavoriteModelsMutation.isPending,
    updateError: updateFavoriteModelsMutation.error,
  }
}
