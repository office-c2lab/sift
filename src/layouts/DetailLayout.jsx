import { Outlet } from 'react-router-dom';
import { ChartColumn, RefreshCw, SlidersHorizontal, Sparkles, TableProperties } from 'lucide-react';
import AIAssistantPanel from '../pages/AIAssistantPanel.jsx';
import csvIcon from '../assets/csv.png';
import '../styles/DetailLayout.css';

function TabIcon({ type }) {
  if (type === 'overview') return <TableProperties aria-hidden="true" />;
  if (type === 'visualization') return <ChartColumn aria-hidden="true" />;
  return <SlidersHorizontal aria-hidden="true" />;
}

export default function DetailLayout({
  data,
  activeTab,
  navigate,
  assistantOpen,
  onAssistantOpen,
  onAssistantClose,
  onFileChange,
  outletContext,
}) {
  return (
    <main
      className={`preview-workspace detail-workspace${assistantOpen ? ' assistant-visible' : ''}`}
    >
      <header className="detail-page-header">
        <button
          type="button"
          className="detail-header-ai-button"
          onClick={assistantOpen ? onAssistantClose : onAssistantOpen}
          aria-expanded={assistantOpen}
        >
          <Sparkles aria-hidden="true" />
          AI 어시스턴트 {assistantOpen ? '닫기' : '열기'}
        </button>
      </header>
      <aside className="preview-sidebar">
        <section className="sidebar-dataset-summary" aria-label="업로드한 CSV 정보">
          <div className="sidebar-dataset-file">
            <img className="detail-csv-image" src={csvIcon} alt="" aria-hidden="true" />
            <strong title={data.fileName}>{data.fileName}</strong>
          </div>
        </section>
        <nav className="detail-tabs" aria-label="상세 화면 탭">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => navigate('/details')}
          >
            <TabIcon type="overview" />
            데이터 개요
          </button>
          <button
            className={activeTab === 'processing' ? 'active' : ''}
            onClick={() => navigate('/details/processing')}
          >
            <TabIcon type="processing" />
            데이터 처리
          </button>
          <button
            className={activeTab === 'visualization' ? 'active' : ''}
            onClick={() => navigate('/details/visualization')}
          >
            <TabIcon type="visualization" />
            시각화
          </button>
        </nav>
        <div className="sidebar-footer-actions">
          <button type="button" className="sidebar-action-button" onClick={onFileChange}>
            <RefreshCw aria-hidden="true" />
            파일 변경
          </button>
        </div>
      </aside>
      <div className={`detail-layout${assistantOpen ? ' with-assistant' : ''}`}>
        <section className="preview-main detail-main">
          <Outlet context={outletContext} />
        </section>
      </div>
      {assistantOpen && <AIAssistantPanel data={data} onClose={onAssistantClose} />}
    </main>
  );
}
