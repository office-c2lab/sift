import { useRef, useState } from 'react';
import './App.css';

function UploadIcon() {
  return (
    <svg className="upload-illustration" viewBox="0 0 80 72" fill="none" aria-hidden="true">
      <path d="M22 48h37a14 14 0 0 0 1-28A20 20 0 0 0 22 17a16 16 0 0 0 0 31Z" fill="#BFE5CD" />
      <circle cx="40" cy="45" r="13" fill="#78BB8D" stroke="#E4F3E8" strokeWidth="3" />
      <path d="M40 52V39m0 0-5 5m5-5 5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function readCsvPreview(text) {
  const allRows = [];
  let row = [];
  let cell = '';
  let quoted = false;
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
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) allRows.push(row);
  if (!allRows.length) return null;
  const headers = allRows[0].map((value, index) => value.replace(/^\uFEFF/, '') || `열 ${index + 1}`);
  const rows = allRows.slice(1).map((values) => headers.map((_, index) => values[index] ?? ''));
  return { headers, rows, totalRows: rows.length };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const acceptFile = async (file) => {
    if (!file) return;
    setPreview(null);
    setConfirmed(false);
    if (!/\.csv$/i.test(file.name)) {
      setError('지원하지 않는 파일 형식이에요. CSV 파일을 선택해 주세요.');
      setFileName('');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('파일 크기가 50MB를 초과했어요. 더 작은 CSV 파일을 선택해 주세요.');
      setFileName('');
      return;
    }
    setError('');
    setFileName('');
    setLoading(true);
    try {
      const [text] = await Promise.all([file.text(), new Promise((resolve) => window.setTimeout(resolve, 700))]);
      const result = readCsvPreview(text);
      if (!result || result.headers.length === 0) {
        setError('CSV에서 미리보기 데이터를 찾지 못했어요. 파일 내용을 확인해 주세요.');
        return;
      }
      setFileName(file.name);
      setPreview({ ...result, fileName: file.name, fileSize: file.size });
    } catch {
      setError('파일을 읽지 못했어요. CSV 파일을 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <main className="preview-workspace">
        <aside className="preview-sidebar">
          <div className="preview-file-art"><span className="csv-document"><i>CSV</i></span><span className="file-success"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span></div>
          <strong className="sidebar-file-name" title={preview.fileName}>{preview.fileName}</strong>
          <span className="upload-complete">업로드 완료</span>
          <div className="file-meta-list"><div><span className="meta-symbol">▣</span><span>파일 형식</span><strong>CSV</strong></div><div><span className="meta-symbol">▤</span><span>파일 크기</span><strong>{formatFileSize(preview.fileSize)}</strong></div><div><span className="meta-symbol">▦</span><span>총 행 수</span><strong>{preview.totalRows.toLocaleString()}개 행</strong></div><div><span className="meta-symbol">▦</span><span>총 열 수</span><strong>{preview.headers.length}개 열</strong></div></div>
          <button className="sidebar-change-button" onClick={() => inputRef.current?.click()}><span>⟳</span> 파일 변경</button>
        </aside>
        <section className="preview-main">
          <header className="preview-main-header"><div><h1>데이터 미리보기</h1><p>업로드한 CSV 파일의 일부 데이터를 미리 확인할 수 있습니다.</p></div></header>
          <div className="preview-data-panel"><div className="preview-table-wrap"><table className="preview-table"><thead><tr><th>일련번호</th>{preview.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{preview.rows.map((row, rowIndex) => <tr key={rowIndex}><td>{rowIndex + 1}</td>{preview.headers.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex] || <span className="blank-value">—</span>}</td>)}</tr>)}</tbody></table></div></div>
          <footer className="preview-footer"><p className={confirmed ? 'confirm-message is-confirmed' : 'confirm-message'}><span>{confirmed ? '✓' : 'ⓘ'}</span>{confirmed ? '데이터를 확인했어요.' : '위의 데이터가 올바른지 확인한 후 ‘확인’을 눌러주세요.'}</p><div className="preview-actions">{confirmed ? <button className="confirm-button" onClick={() => { setPreview(null); setFileName(''); setConfirmed(false); }}>새 파일 업로드</button> : <><button className="cancel-button" onClick={() => { setPreview(null); setFileName(''); setError(''); }}>취소</button><button className="confirm-button" onClick={() => setConfirmed(true)}>확인 →</button></>}</div></footer>
        </section>
        <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => acceptFile(event.target.files?.[0])} />
      </main>
    );
  }

  return (
    <main className="upload-page">
      <div className="upload-content">
        <h1 className="page-title">나만의 데이터셋을 업로드하세요</h1>
        <section
        className={`upload-dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}${loading ? ' is-loading' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
      >
        <UploadIcon />
        <h2>{loading ? 'CSV 파일을 확인하고 있어요' : fileName || 'CSV 파일을 드래그해 놓으세요'}</h2>
        <p>{loading ? '파일을 안전하게 읽는 중입니다.' : fileName ? '파일을 선택했어요.' : '또는 아래 버튼을 눌러 파일을 찾아보세요.'}</p>
        <button className="choose-button" onClick={() => inputRef.current?.click()} disabled={loading}>
          {loading ? <span className="loading-spinner" aria-hidden="true" /> : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>}
          {loading ? '불러오는 중' : '파일 선택하기'}
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => acceptFile(event.target.files?.[0])} />
        <div className="file-details">최대 50MB</div>
        {error && <div className="upload-error" role="alert">{error}</div>}
      </section>
      </div>
    </main>
  );
}
