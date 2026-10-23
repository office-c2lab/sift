import { useQuery } from '@tanstack/react-query';
import { getAiSuggestions } from '../api/datasets.js';

export const aiSuggestionsQueryKey = datasetId => ['ai-suggestions', datasetId];

export default function useAiSuggestions(datasetId) {
  return useQuery({
    queryKey: aiSuggestionsQueryKey(datasetId),
    queryFn: ({ signal }) => getAiSuggestions(datasetId, signal),
    enabled: Boolean(datasetId),
  });
}
