import { useMutation } from '@tanstack/react-query';
import { getChartData } from '../api/datasets.js';

export default function useChartData(datasetId) {
  return useMutation({
    mutationKey: ['chart-data', datasetId],
    mutationFn: configuration => getChartData(datasetId, configuration),
  });
}
