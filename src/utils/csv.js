export function parseCsv(text, maxDataRows = Infinity) {
  const allRows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let reachedLimit = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) allRows.push(row);
      row = [];
      cell = '';
      if (allRows.length >= maxDataRows + 1) {
        reachedLimit = true;
        break;
      }
    } else {
      cell += char;
    }
  }

  if (!reachedLimit) {
    row.push(cell.trim());
    if (row.some(Boolean)) allRows.push(row);
  }
  if (!allRows.length) return null;

  const headers = allRows[0].map(
    (value, index) => value.replace(/^\uFEFF/, '') || `열 ${index + 1}`
  );
  const rows = allRows.slice(1).map(values => headers.map((_, index) => values[index] ?? ''));
  return { headers, rows, totalRows: rows.length };
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
