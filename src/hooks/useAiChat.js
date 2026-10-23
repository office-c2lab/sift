import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAiMessage } from '../api/datasets.js';
import { aiSuggestionsQueryKey } from './useAiSuggestions.js';

export default function useAiChat(datasetId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['ai-chat', datasetId],
    mutationFn: request => sendAiMessage(datasetId, request),
    onSuccess: response => {
      queryClient.setQueryData(aiSuggestionsQueryKey(datasetId), current => ({
        ...current,
        conversation_id: response.conversation_id,
        data_version: response.data_version,
        messages: [
          ...(current?.messages ?? []),
          response.user_message,
          response.assistant_message,
        ],
      }));
    },
  });
}
