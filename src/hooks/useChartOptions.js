import { useQuery } from '@tanstack/react-query';
import { getChartOptions } from '../api/datasets.js';

export const chartOptionsQueryPrefix = datasetId => ['chart-options', datasetId];
export const chartOptionsQueryKey = (datasetId, chartType) => [
  ...chartOptionsQueryPrefix(datasetId),
  chartType,
];

export default function useChartOptions(datasetId, chartType) {
  return useQuery({
    queryKey: chartOptionsQueryKey(datasetId, chartType),
    queryFn: ({ signal }) => getChartOptions(datasetId, chartType, signal),
    enabled: Boolean(datasetId && chartType),
  });
}
