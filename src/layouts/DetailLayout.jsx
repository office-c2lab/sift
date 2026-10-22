import { ROUTES } from '../routes/paths.js';
import { Outlet } from 'react-router-dom';
import AIAssistantPanel from '../pages/AIAssistantPanel.jsx';
import '../styles/DetailLayout.css';

function TabIcon({ type }) {
  if (type === 'overview') return <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16m6-16v16"/></svg>;
  if (type === 'visualization') return <svg viewBox="0 0 24 24"><path d="M4 20V11h4v9M10 20V5h4v15m2 0v-8h4v8"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>;
}

export default function DetailLayout({ data, activeTab, navigate, assistantOpen, onAssistantOpen, onAssistantClose, onFileChange, outletContext }) {
  return (
    <main className={`preview-workspace detail-workspace${assistantOpen ? ' assistant-visible' : ''}`}>
      <header className="detail-page-header">
        <button type="button" className="detail-header-ai-button" onClick={assistantOpen ? onAssistantClose : onAssistantOpen} aria-expanded={assistantOpen}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>
          AI 어시스턴트 {assistantOpen ? '닫기' : '열기'}
        </button>
      </header>
      <aside className="preview-sidebar">
        <section className="sidebar-dataset-summary" aria-label="업로드한 CSV 정보">
          <div className="sidebar-dataset-file"><span className="header-csv-icon csv-document"><i>CSV</i></span><strong title={data.fileName}>{data.fileName}</strong></div>
        </section>
        <nav className="detail-tabs" aria-label="상세 화면 탭">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => navigate(ROUTES.details)}><TabIcon type="overview"/>데이터 개요</button>
          <button className={activeTab === 'processing' ? 'active' : ''} onClick={() => navigate(ROUTES.processing)}><TabIcon type="processing"/>데이터 처리</button>
          <button className={activeTab === 'visualization' ? 'active' : ''} onClick={() => navigate(ROUTES.visualization)}><TabIcon type="visualization"/>시각화</button>
        </nav>
        <div className="sidebar-footer-actions">
          <button type="button" className="sidebar-action-button" onClick={onFileChange}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/></svg>
            파일 변경
          </button>
        </div>
      </aside>
      <div className={`detail-layout${assistantOpen ? ' with-assistant' : ''}`}>
        <section className="preview-main detail-main"><Outlet context={outletContext} /></section>
      </div>
      {assistantOpen && <AIAssistantPanel data={data} onClose={onAssistantClose} />}
    </main>
  );
}
