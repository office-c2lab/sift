import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import uploadIcon from '../assets/upload.png';

function UploadIcon() {
  return <img className="upload-illustration" src={uploadIcon} alt="" aria-hidden="true" />;
}

export default function UploadPage({ onChooseFile, loading, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const choose = file => {
    onChooseFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <main className="upload-page">
      <div className="upload-content">
        <h1 className="page-title">나만의 데이터셋을 업로드하세요</h1>
        <section
          className={`upload-dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}${loading ? ' is-loading' : ''}`}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files?.[0]);
          }}
        >
          <UploadIcon />
          <h2>{loading ? 'CSV 파일을 확인하고 있어요' : 'CSV 파일을 드래그해 놓으세요'}</h2>
          <p>
            {loading
              ? '파일을 안전하게 읽는 중입니다.'
              : '또는 아래 버튼을 눌러 파일을 찾아보세요.'}
          </p>
          <button
            className="choose-button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? (
              <span className="loading-spinner" aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {loading ? '불러오는 중' : '파일 선택하기'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={event => choose(event.target.files?.[0])}
          />
          <div className="file-details">최대 50MB</div>
          {error && (
            <div className="upload-error" role="alert">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
