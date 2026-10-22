import { useMutation } from '@tanstack/react-query';
import { previewCsv } from '../api/csv.js';

export function useCsvPreview() {
  return useMutation({
    mutationFn: previewCsv,
  });
}
