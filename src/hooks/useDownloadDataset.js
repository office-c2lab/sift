import { useMutation } from '@tanstack/react-query';
import { downloadDataset } from '../api/datasets.js';

export default function useDownloadDataset(datasetId) {
  return useMutation({
    mutationKey: ['download-dataset', datasetId],
    mutationFn: () => downloadDataset(datasetId),
  });
}
