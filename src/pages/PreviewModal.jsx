import CustomDropdown from '../components/CustomDropdown.jsx';
import OverflowTableContainer from '../components/OverflowTableContainer.jsx';
import PreviewCell from '../components/PreviewCell.jsx';

const ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'cp949', label: 'CP949 / EUC-KR' },
];

export default function PreviewModal({
  data,
  error,
  loading,
  encoding,
  encodingLoading,
  onEncodingChange,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="preview-modal-backdrop">
      <section
        className="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        <header className="preview-modal-heading">
          <div>
            <h2 id="preview-modal-title">데이터 미리보기</h2>
            <p>업로드한 CSV 파일의 일부 데이터를 확인해 주세요.</p>
          </div>
        </header>
        <div className="modal-file-toolbar">
          <div className="modal-file-name">
            <span className="modal-csv-mark">CSV</span>
            <strong title={data.fileName}>{data.fileName}</strong>
          </div>
          <div className="modal-encoding-select">
            <span>인코딩</span>
            {encodingLoading && <small className="encoding-loading-label">읽는 중…</small>}
            <CustomDropdown
              className="modal-encoding-dropdown"
              value={encoding}
              onChange={onEncodingChange}
              options={ENCODINGS}
              disabled={encodingLoading || loading}
            />
          </div>
        </div>
        <OverflowTableContainer className="modal-table-wrap">
          <table className="preview-table">
            <thead>
              <tr>
                <th>일련번호</th>
                {data.headers.map((header, index) => (
                  <th key={`${header}-${index}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  {data.headers.map((_, columnIndex) => (
                    <td key={columnIndex}>
                      <PreviewCell value={row[columnIndex]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </OverflowTableContainer>
        {error && (
          <p className="modal-error" role="alert">
            {error}
          </p>
        )}
        <footer className="preview-modal-footer">
          <button className="cancel-button" disabled={loading} onClick={onCancel}>
            취소
          </button>
          <button className="confirm-button" disabled={loading} onClick={onConfirm}>
            {loading ? (
              <>
                <span className="loading-spinner modal-spinner" aria-hidden="true" /> 데이터셋 생성 중
              </>
            ) : (
              '확인하고 상세 보기'
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
