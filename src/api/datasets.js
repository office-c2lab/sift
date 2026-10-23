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

export async function downloadDataset(datasetId) {
  const response = await api.get(`/datasets/${encodeURIComponent(datasetId)}/download`, {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] ?? '';
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = plainFilename;

  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      filename = encodedFilename;
    }
  }

  return {
    blob: response.data,
    filename: filename?.replace(/[\\/]/g, '_'),
  };
}

export async function getChartOptions(datasetId, chartType, signal) {
  const { data } = await api.get(
    `/datasets/${encodeURIComponent(datasetId)}/charts/options`,
    {
      params: { chart_type: chartType },
      signal,
    }
  );
  return data;
}

export async function getChartData(datasetId, configuration) {
  const { data } = await api.post(
    `/datasets/${encodeURIComponent(datasetId)}/charts/data`,
    configuration
  );
  return data;
}

export async function getProcessingOptions(datasetId, signal) {
  const { data } = await api.get(
    `/datasets/${encodeURIComponent(datasetId)}/processing/options`,
    { signal }
  );
  return data;
}

export async function applyProcessing(datasetId, request) {
  const { data } = await api.post(
    `/datasets/${encodeURIComponent(datasetId)}/processing`,
    request
  );
  return data;
}

export async function getAiSuggestions(datasetId, signal) {
  const { data } = await api.get(
    `/datasets/${encodeURIComponent(datasetId)}/ai/suggestions`,
    { signal }
  );
  return data;
}

export async function sendAiMessage(datasetId, request) {
  const { data } = await api.post(
    `/datasets/${encodeURIComponent(datasetId)}/ai/chat`,
    request
  );
  return data;
}

export async function resetAiConversation(datasetId, request) {
  const { data } = await api.post(
    `/datasets/${encodeURIComponent(datasetId)}/ai/reset`,
    request
  );
  return data;
}
