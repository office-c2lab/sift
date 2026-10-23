import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyProcessing } from '../api/datasets.js';
import { chartOptionsQueryPrefix } from './useChartOptions.js';
import { datasetOverviewQueryKey } from './useDatasetOverview.js';
import { datasetRowsQueryPrefix } from './useDatasetRowPages.js';
import { processingOptionsQueryKey } from './useProcessingOptions.js';
import { aiSuggestionsQueryKey } from './useAiSuggestions.js';

export default function useApplyProcessing(datasetId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['apply-processing', datasetId],
    mutationFn: request => applyProcessing(datasetId, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: datasetOverviewQueryKey(datasetId) }),
        queryClient.invalidateQueries({ queryKey: datasetRowsQueryPrefix(datasetId) }),
        queryClient.invalidateQueries({ queryKey: processingOptionsQueryKey(datasetId) }),
        queryClient.invalidateQueries({ queryKey: aiSuggestionsQueryKey(datasetId) }),
        queryClient.invalidateQueries({
          queryKey: chartOptionsQueryPrefix(datasetId),
        }),
      ]);
    },
  });
}
