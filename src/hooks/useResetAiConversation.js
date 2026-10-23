import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resetAiConversation } from '../api/datasets.js';
import { aiSuggestionsQueryKey } from './useAiSuggestions.js';

export default function useResetAiConversation(datasetId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['ai-reset', datasetId],
    mutationFn: request => resetAiConversation(datasetId, request),
    onSuccess: response => {
      queryClient.setQueryData(aiSuggestionsQueryKey(datasetId), current => ({
        ...current,
        conversation_id: response.conversation_id,
        messages: response.messages ?? [],
      }));
    },
  });
}
