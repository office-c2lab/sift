import { formatFileSize } from '../utils/csv.js';

export default function DetailPage({ data, onChangeFile }) {
  return (
    <main className="preview-workspace">
      <aside className="preview-sidebar">
        <div className="preview-file-art"><span className="csv-document"><i>CSV</i></span><span className="file-success"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span></div>
        <strong className="sidebar-file-name" title={data.fileName}>{data.fileName}</strong>
        <span className="upload-complete">업로드 완료</span>
        <div className="file-meta-list">
          <div><span className="meta-symbol">▣</span><span>파일 형식</span><strong>CSV</strong></div>
          <div><span className="meta-symbol">▤</span><span>파일 크기</span><strong>{formatFileSize(data.fileSize)}</strong></div>
          <div><span className="meta-symbol">▦</span><span>총 행 수</span><strong>{data.totalRows.toLocaleString()}개 행</strong></div>
          <div><span className="meta-symbol">▦</span><span>총 열 수</span><strong>{data.headers.length}개 열</strong></div>
        </div>
        <button className="sidebar-change-button" onClick={onChangeFile}><span>⟳</span> 파일 변경</button>
      </aside>
      <section className="preview-main">
        <header className="preview-main-header">
          <div><h1>데이터 상세</h1><p>업로드한 CSV 파일의 전체 데이터를 확인할 수 있습니다.</p></div>
        </header>
        <div className="preview-data-panel">
          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead><tr><th>일련번호</th>{data.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead>
              <tbody>{data.rows.map((row, rowIndex) => <tr key={rowIndex}><td>{rowIndex + 1}</td>{data.headers.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex] || <span className="blank-value">—</span>}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
