import { authenticatedFetch } from '#/lib/authenticated-fetch'
import type {
  CompleteQuestRequest,
  CreateStoryRequest,
  QuestResponse,
  RejectQuestRequest,
  StoryResponse,
  StoriesResponse,
  StorySessionResponse,
  UpdateStoryStatusRequest,
} from '#/modules/story-flow/persisted-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useCreateStoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStoryRequest) => {
      const response = await authenticatedFetch('/api/stories', {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to create story'))
      }

      return (await response.json()) as StoryResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-story', data.story.id], data)
      void queryClient.invalidateQueries({ queryKey: ['persisted-stories'] })
    },
  })
}

export function useStoryQuery(storyId: string | undefined) {
  return useQuery({
    enabled: Boolean(storyId),
    queryKey: ['persisted-story', storyId],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/stories/${storyId}`)

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to load story'))
      }

      return (await response.json()) as StoryResponse
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useUpdateStoryStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, ...input }: UpdateStoryStatusRequest & { storyId: string }) => {
      const response = await authenticatedFetch(`/api/stories/${storyId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to update story'))
      }

      return (await response.json()) as StoryResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-story', data.story.id], data)
      void queryClient.invalidateQueries({ queryKey: ['persisted-stories'] })
      void queryClient.invalidateQueries({ queryKey: ['story-session', data.story.id] })
    },
  })
}

export function useDeleteStoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storyId: string) => {
      const response = await authenticatedFetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to delete story'))
      }

      return storyId
    },
    onSuccess: (storyId) => {
      queryClient.removeQueries({ queryKey: ['persisted-story', storyId] })
      queryClient.removeQueries({ queryKey: ['story-session', storyId] })
      void queryClient.invalidateQueries({ queryKey: ['persisted-stories'] })
    },
  })
}

export function useStoriesQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: ['persisted-stories'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/stories')

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to load stories'))
      }

      return (await response.json()) as StoriesResponse
    },
    refetchOnWindowFocus: false,
    retry: false,
  })
}

export function useStorySessionQuery(storyId: string | undefined) {
  return useQuery({
    enabled: Boolean(storyId),
    queryKey: ['story-session', storyId],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/stories/${storyId}/session`)

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to load story session'))
      }

      return (await response.json()) as StorySessionResponse
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useCreateQuestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storyId: string) => {
      const response = await authenticatedFetch(`/api/stories/${storyId}/quests`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to create quest'))
      }

      return (await response.json()) as QuestResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-quest', data.quest.id], data)
      void queryClient.invalidateQueries({ queryKey: ['story-session', data.quest.storyId] })
    },
  })
}

export function useQuestQuery(questId: string | undefined) {
  return useQuery({
    enabled: Boolean(questId),
    queryKey: ['persisted-quest', questId],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/quests/${questId}`)

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to load quest'))
      }

      return (await response.json()) as QuestResponse
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useAcceptQuestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questId: string) => {
      const response = await authenticatedFetch(`/api/quests/${questId}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to accept quest'))
      }

      return (await response.json()) as QuestResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-quest', data.quest.id], data)
      void queryClient.invalidateQueries({ queryKey: ['story-session', data.quest.storyId] })
    },
  })
}

export function useCompleteQuestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ questId, ...input }: CompleteQuestRequest & { questId: string }) => {
      const response = await authenticatedFetch(`/api/quests/${questId}/complete`, {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to complete quest'))
      }

      return (await response.json()) as QuestResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-quest', data.quest.id], data)
      void queryClient.invalidateQueries({ queryKey: ['story-session', data.quest.storyId] })
    },
  })
}

export function useRejectQuestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ questId, ...input }: RejectQuestRequest & { questId: string }) => {
      const response = await authenticatedFetch(`/api/quests/${questId}/reject`, {
        method: 'POST',
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to reject quest'))
      }

      return (await response.json()) as QuestResponse
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persisted-quest', data.quest.id], data)
      void queryClient.invalidateQueries({ queryKey: ['story-session', data.quest.storyId] })
    },
  })
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return typeof body.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}
