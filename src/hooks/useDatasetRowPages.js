import { useQueries } from '@tanstack/react-query';
import { getDatasetRows } from '../api/datasets.js';

export const datasetRowsQueryPrefix = datasetId => ['dataset-rows', datasetId];
export const datasetRowsPageQueryKey = (datasetId, offset, limit) => [
  ...datasetRowsQueryPrefix(datasetId),
  { offset, limit },
];

export default function useDatasetRowPages(datasetId, offsets, limit = 100) {
  return useQueries({
    queries: offsets.map(offset => ({
      queryKey: datasetRowsPageQueryKey(datasetId, offset, limit),
      queryFn: ({ signal }) => getDatasetRows(datasetId, { offset, limit, signal }),
      enabled: Boolean(datasetId),
      staleTime: Infinity,
      gcTime: 60 * 1000,
    })),
  });
}
