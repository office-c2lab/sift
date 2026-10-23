export default function DetailLoadingPage() {
  return (
    <main className="detail-loading" role="status" aria-live="polite">
      <div className="detail-loading-logo" aria-label="DataBOM">
        <img src="/logo.png" alt="" aria-hidden="true" />
      </div>
      <span className="detail-loading-spinner" />
      <h1>데이터셋을 생성하고 있어요</h1>
      <p>CSV 파일을 업로드하고 상세 데이터를 준비하고 있습니다.</p>
    </main>
  );
}
