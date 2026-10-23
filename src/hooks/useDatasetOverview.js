import { useQuery } from '@tanstack/react-query';
import { getDatasetOverview } from '../api/datasets.js';

export const datasetOverviewQueryKey = datasetId => ['dataset-overview', datasetId];

export default function useDatasetOverview(datasetId) {
  return useQuery({
    queryKey: datasetOverviewQueryKey(datasetId),
    queryFn: () => getDatasetOverview(datasetId),
    enabled: Boolean(datasetId),
  });
}
