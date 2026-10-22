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

export default function App() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const acceptFile = (file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setError('지원하지 않는 파일 형식이에요. CSV 파일을 선택해 주세요.');
      setFileName('');
      return;
    }
    setFileName(file.name);
    setError('');
  };

  return (
    <main className="upload-page">
      <div className="upload-content">
        <h1 className="page-title">나만의 데이터셋을 업로드하세요</h1>
        <section
        className={`upload-dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
      >
        <UploadIcon />
        <h2>{fileName || 'CSV 파일을 드래그해 놓으세요'}</h2>
        <p>{fileName ? '파일을 선택했어요.' : '또는 아래 버튼을 눌러 파일을 찾아보세요.'}</p>
        <button className="choose-button" onClick={() => inputRef.current?.click()}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
          파일 선택하기
        </button>
        <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => acceptFile(event.target.files?.[0])} />
        <div className="file-details">최대 50MB</div>
        {error && <div className="upload-error" role="alert">{error}</div>}
      </section>
      </div>
    </main>
  );
}
