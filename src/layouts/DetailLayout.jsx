import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Funnel,
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
  return <SlidersHorizontal aria-hidden="true" />;
}

const TOOL_SIDEBAR_DURATION = 720;
const ASSISTANT_DURATION = 800;

export default function DetailLayout({
  data,
  activeTab,
  navigate,
  assistantOpen,
  onAssistantOpen,
  onAssistantClose,
  onFileChange,
  sidebarContent,
  outletContext,
}) {
  const sidebarContentByTab = useRef({});
  if (sidebarContent) sidebarContentByTab.current[activeTab] = sidebarContent;
  const hasSidebarContent = Boolean(sidebarContent);
  const [visibleToolTab, setVisibleToolTab] = useState(() =>
    sidebarContent ? activeTab : null
  );
  const visibleToolTabRef = useRef(visibleToolTab);
  const [toolSidebarOpen, setToolSidebarOpen] = useState(Boolean(sidebarContent));
  const [assistantMounted, setAssistantMounted] = useState(assistantOpen);
  const [assistantClosing, setAssistantClosing] = useState(false);

  useEffect(() => {
    let closeTimer;

    if (!hasSidebarContent) {
      setToolSidebarOpen(false);
      closeTimer = window.setTimeout(() => {
        visibleToolTabRef.current = null;
        setVisibleToolTab(null);
      }, TOOL_SIDEBAR_DURATION);
    } else {
      visibleToolTabRef.current = activeTab;
      setVisibleToolTab(activeTab);
      setToolSidebarOpen(true);
    }

    return () => window.clearTimeout(closeTimer);
  }, [activeTab, hasSidebarContent]);

  useEffect(() => {
    let closeTimer;

    if (assistantOpen) {
      setAssistantMounted(true);
      setAssistantClosing(false);
    } else if (assistantMounted) {
      setAssistantClosing(true);
      closeTimer = window.setTimeout(() => {
        setAssistantMounted(false);
        setAssistantClosing(false);
      }, ASSISTANT_DURATION);
    }

    return () => window.clearTimeout(closeTimer);
  }, [assistantOpen, assistantMounted]);

  const visibleSidebarContent = visibleToolTab
    ? sidebarContentByTab.current[visibleToolTab]
    : null;
  const toolTabChevron = tab =>
    activeTab === tab && toolSidebarOpen ? (
      <ChevronLeft className="detail-tab-chevron" aria-hidden="true" />
    ) : (
      <ChevronRight className="detail-tab-chevron" aria-hidden="true" />
    );
  const openOrToggleToolTab = (tab, path) => {
    if (activeTab === tab) {
      if (toolSidebarOpen) {
        setToolSidebarOpen(false);
      } else {
        setToolSidebarOpen(true);
      }
      return;
    }
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
    visualization: {
      title: '시각화',
      description: '컬럼을 선택해 데이터의 분포와 흐름을 살펴보세요.',
    },
  }[activeTab];

  return (
    <main
      className={`preview-workspace detail-workspace${assistantOpen ? ' assistant-visible' : ''}${assistantClosing ? ' assistant-closing' : ''}${toolSidebarOpen ? ' has-tool-sidebar' : ''}${visibleSidebarContent && !toolSidebarOpen ? ' tool-sidebar-closing' : ''}`}
    >
      <header className="detail-page-header">
        <div className="detail-page-header-brand" aria-label="SIFT">
          <span className="detail-brand-symbol">
            <Funnel aria-hidden="true" />
          </span>
          <strong>SIFT</strong>
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
              <small>{assistantOpen ? '대화창이 열려 있어요' : '데이터에 질문하기'}</small>
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
        </nav>
        <div className="sidebar-footer-actions">
          <button type="button" className="sidebar-action-button" onClick={onFileChange}>
            <RefreshCw aria-hidden="true" />
            파일 변경
          </button>
        </div>
      </aside>
      {visibleSidebarContent && (
        <aside
          className={`detail-tool-sidebar${toolSidebarOpen ? '' : ' is-closing'}`}
        >
          {visibleSidebarContent}
        </aside>
      )}
      <div className={`detail-layout${assistantOpen ? ' with-assistant' : ''}`}>
        <section className="preview-main detail-main">
          <Outlet context={outletContext} />
        </section>
      </div>
      {assistantMounted && (
        <AIAssistantPanel data={data} onClose={onAssistantClose} closing={assistantClosing} />
      )}
    </main>
  );
}
