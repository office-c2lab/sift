import { useQuery } from '@tanstack/react-query';
import { getProcessingOptions } from '../api/datasets.js';

export const processingOptionsQueryKey = datasetId => ['processing-options', datasetId];

export default function useProcessingOptions(datasetId) {
  return useQuery({
    queryKey: processingOptionsQueryKey(datasetId),
    queryFn: ({ signal }) => getProcessingOptions(datasetId, signal),
    enabled: Boolean(datasetId),
  });
}
