import { useMutation } from '@tanstack/react-query';
import { createDataset } from '../api/datasets.js';

export default function useCreateDataset() {
  return useMutation({
    mutationKey: ['create-dataset'],
    mutationFn: ({ file, encoding }) => createDataset(file, encoding),
  });
}
