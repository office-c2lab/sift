import { useQuery } from '@tanstack/react-query';
import { getChartOptions } from '../api/datasets.js';

export const chartOptionsQueryKey = (datasetId, chartType) => [
  'chart-options',
  datasetId,
  chartType,
];

export default function useChartOptions(datasetId, chartType) {
  return useQuery({
    queryKey: chartOptionsQueryKey(datasetId, chartType),
    queryFn: ({ signal }) => getChartOptions(datasetId, chartType, signal),
    enabled: Boolean(datasetId && chartType),
  });
}
