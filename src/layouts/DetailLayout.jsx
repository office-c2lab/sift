import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Download,
  Merge,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
} from 'lucide-react';
import AIAssistantPanel from '../pages/AIAssistantPanel.jsx';
import csvIcon from '../assets/csv.png';
import '../styles/DetailLayout.css';

function TabIcon({ type }) {
  if (type === 'overview') return <TableProperties aria-hidden="true" />;
  if (type === 'visualization') return <ChartColumn aria-hidden="true" />;
  if (type === 'merge') return <Merge aria-hidden="true" />;
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
  onDownloadCsv,
  downloadPending,
  sidebarContent,
  outletContext,
}) {
  const hasSidebarContent = Boolean(sidebarContent);
  const [closedToolTab, setClosedToolTab] = useState(null);
  const toolSidebarOpen = hasSidebarContent && closedToolTab !== activeTab;
  const toolTabChevron = tab =>
    activeTab === tab && toolSidebarOpen ? (
      <ChevronLeft className="detail-tab-chevron" aria-hidden="true" />
    ) : (
      <ChevronRight className="detail-tab-chevron" aria-hidden="true" />
    );
  const openOrToggleToolTab = (tab, path) => {
    if (activeTab === tab) {
      setClosedToolTab(current => (current === tab ? null : tab));
      return;
    }
    setClosedToolTab(null);
    navigate(path);
  };
  const pageHeader = {
    overview: {
      title: '데이터 개요',
      description: '업로드한 데이터의 구조와 품질을 확인하세요.',
    },
    processing: {
      title: '데이터 처리',
      description: '필요한 방식으로 데이터를 정리하고 내려받으세요.',
    },
    merge: {
      title: '데이터 병합',
      description: '다른 CSV를 기준 키로 결합하거나 행 단위로 이어 붙이세요.',
    },
    visualization: {
      title: '시각화',
      description: '컬럼을 선택해 데이터의 분포와 흐름을 살펴보세요.',
    },
  }[activeTab];

  return (
    <main
      className={`preview-workspace detail-workspace${assistantOpen ? ' assistant-visible' : ''}${toolSidebarOpen ? ' has-tool-sidebar' : ''}`}
    >
      <header className="detail-page-header">
        <div className="detail-page-header-brand" aria-label="DataBOM">
          <span className="detail-brand-logo">
            <img src="/logo.png" alt="" aria-hidden="true" />
          </span>
        </div>
        <div className="detail-page-header-context">
          <span className="detail-page-header-icon">
            <TabIcon type={activeTab} />
          </span>
          <div className="detail-page-header-copy">
            <h1>{pageHeader.title}</h1>
            <p>{pageHeader.description}</p>
          </div>
        </div>
        <div className="detail-page-header-actions">
          <button
            type="button"
            className="detail-header-ai-toggle"
            onClick={assistantOpen ? onAssistantClose : onAssistantOpen}
            aria-expanded={assistantOpen}
            aria-label={assistantOpen ? 'AI 어시스턴트 닫기' : 'AI 어시스턴트 열기'}
          >
            <span className="detail-header-ai-icon">
              <Sparkles aria-hidden="true" />
            </span>
            <span className="detail-header-ai-copy">
              <strong>AI 어시스턴트</strong>
              <small>{assistantOpen ? '대화창이 열려 있어요' : '데이터에 대해 질문하기'}</small>
            </span>
            <span className="detail-header-ai-action">
              {assistantOpen ? (
                <ChevronRight aria-hidden="true" />
              ) : (
                <ChevronLeft aria-hidden="true" />
              )}
            </span>
          </button>
        </div>
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
            className={activeTab === 'visualization' ? 'active' : ''}
            onClick={() => openOrToggleToolTab('visualization', '/details/visualization')}
            aria-expanded={activeTab === 'visualization' && toolSidebarOpen}
          >
            <TabIcon type="visualization" />
            시각화
            {toolTabChevron('visualization')}
          </button>
          <button
            className={activeTab === 'processing' ? 'active' : ''}
            onClick={() => openOrToggleToolTab('processing', '/details/processing')}
            aria-expanded={activeTab === 'processing' && toolSidebarOpen}
          >
            <TabIcon type="processing" />
            데이터 처리
            {toolTabChevron('processing')}
          </button>
          {/* 데이터 병합 주석
           <button
            className={activeTab === 'merge' ? 'active' : ''}
            onClick={() => openOrToggleToolTab('merge', '/details/merge')}
            aria-expanded={activeTab === 'merge' && toolSidebarOpen}
          >
            <TabIcon type="merge" />
            데이터 병합
            {toolTabChevron('merge')}
          </button> */}
        </nav>
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="download-csv-button"
            onClick={onDownloadCsv}
            disabled={downloadPending}
          >
            <Download aria-hidden="true" />
            {downloadPending ? '다운로드 중...' : 'CSV 다운로드'}
          </button>
          <button type="button" className="sidebar-action-button" onClick={onFileChange}>
            <RefreshCw aria-hidden="true" />
            파일 변경
          </button>
        </div>
      </aside>
      {toolSidebarOpen && <aside className="detail-tool-sidebar">{sidebarContent}</aside>}
      <div className={`detail-layout${assistantOpen ? ' with-assistant' : ''}`}>
        <section className="preview-main detail-main">
          <Outlet context={outletContext} />
        </section>
      </div>
      {assistantOpen && (
        <AIAssistantPanel datasetId={data.datasetId} onClose={onAssistantClose} />
      )}
    </main>
  );
}
