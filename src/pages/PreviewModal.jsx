export default function PreviewModal({ data, error, loading, onCancel, onConfirm }) {
  return (
    <div className="preview-modal-backdrop">
      <section className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
        <header className="preview-modal-heading">
          <div><h2 id="preview-modal-title">데이터 미리보기</h2><p>업로드한 CSV 파일의 일부 데이터를 확인해 주세요.</p></div>
        </header>
        <div className="modal-file-name"><span className="modal-csv-mark">CSV</span><strong title={data.fileName}>{data.fileName}</strong></div>
        <div className="modal-table-wrap">
          <table className="preview-table">
            <thead><tr><th>일련번호</th>{data.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead>
            <tbody>{data.rows.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex}><td>{rowIndex + 1}</td>{data.headers.map((_, columnIndex) => <td key={columnIndex}>{row[columnIndex] || <span className="blank-value">—</span>}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {error && <p className="modal-error" role="alert">{error}</p>}
        <footer className="preview-modal-footer">
          <button className="cancel-button" disabled={loading} onClick={onCancel}>취소</button>
          <button className="confirm-button" disabled={loading} onClick={onConfirm}>
            {loading ? <><span className="loading-spinner modal-spinner" aria-hidden="true"/> 전체 데이터 읽는 중</> : '확인하고 상세 보기'}
          </button>
        </footer>
      </section>
    </div>
  );
}
