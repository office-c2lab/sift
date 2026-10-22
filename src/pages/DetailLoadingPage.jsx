export default function DetailLoadingPage() {
  return (
    <main className="detail-loading" role="status" aria-live="polite">
      <span className="detail-loading-spinner" />
      <h1>상세 데이터를 불러오고 있어요</h1>
      <p>CSV 전체 내용을 읽고 있습니다. 잠시만 기다려 주세요.</p>
    </main>
  );
}
