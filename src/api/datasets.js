import api from './instance.js';

export async function createDataset(file, encoding) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('encoding', encoding);

  const { data } = await api.post('/datasets', formData);
  return data;
}
