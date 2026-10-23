import api from './instance.js';

export async function createDataset(file, encoding) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('encoding', encoding);

  const { data } = await api.post('/datasets', formData);
  return data;
}

export async function getDatasetOverview(datasetId) {
  const { data } = await api.get(`/datasets/${encodeURIComponent(datasetId)}/overview`);
  return data;
}

export async function getDatasetRows(datasetId, { offset = 0, limit = 100, signal } = {}) {
  const { data } = await api.get(`/datasets/${encodeURIComponent(datasetId)}/rows`, {
    params: { offset, limit },
    signal,
  });
  return data;
}
