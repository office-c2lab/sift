import api from './instance.js';

export async function previewCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/csv/preview', formData);
  return data;
}
