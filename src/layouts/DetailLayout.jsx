import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  ChartColumn,
  ChevronLeft,
  ChevronRight,
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
const TOOL_SIDEBAR_SWAP_DURATION = 260;

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
  const [fastToolTransition, setFastToolTransition] = useState(false);

  useEffect(() => {
    let swapTimer;
    let openTimer;
    let resetTimer;

    if (!hasSidebarContent) {
      setFastToolTransition(false);
      setToolSidebarOpen(false);
      swapTimer = window.setTimeout(() => {
        visibleToolTabRef.current = null;
        setVisibleToolTab(null);
      }, TOOL_SIDEBAR_DURATION);
    } else if (visibleToolTabRef.current === activeTab) {
      setFastToolTransition(false);
      setToolSidebarOpen(true);
    } else {
      const isToolTabSwap = Boolean(visibleToolTabRef.current);
      setFastToolTransition(isToolTabSwap);
      setToolSidebarOpen(false);
      const closeDelay = isToolTabSwap ? TOOL_SIDEBAR_SWAP_DURATION : 0;
      swapTimer = window.setTimeout(() => {
        visibleToolTabRef.current = activeTab;
        setVisibleToolTab(activeTab);
        openTimer = window.setTimeout(() => setToolSidebarOpen(true), 30);
        if (isToolTabSwap) {
          resetTimer = window.setTimeout(
            () => setFastToolTransition(false),
            TOOL_SIDEBAR_SWAP_DURATION + 30
          );
        }
      }, closeDelay);
    }

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(resetTimer);
    };
  }, [activeTab, hasSidebarContent]);

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
      setToolSidebarOpen(current => !current);
      return;
    }
    navigate(path);
  };

  return (
    <main
      className={`preview-workspace detail-workspace${assistantOpen ? ' assistant-visible' : ''}${toolSidebarOpen ? ' has-tool-sidebar' : ''}${fastToolTransition ? ' is-tool-switching' : ''}`}
    >
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
            onClick={() => openOrToggleToolTab('processing', '/details/processing')}
            aria-expanded={activeTab === 'processing' && toolSidebarOpen}
          >
            <TabIcon type="processing" />
            데이터 처리
            {toolTabChevron('processing')}
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
        </nav>
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="sidebar-action-button sidebar-ai-toggle"
            onClick={assistantOpen ? onAssistantClose : onAssistantOpen}
            aria-expanded={assistantOpen}
          >
            <Sparkles aria-hidden="true" />
            AI 어시스턴트 {assistantOpen ? '닫기' : '열기'}
          </button>
          <button type="button" className="sidebar-action-button" onClick={onFileChange}>
            <RefreshCw aria-hidden="true" />
            파일 변경
          </button>
        </div>
      </aside>
      {visibleSidebarContent && (
        <aside
          className={`detail-tool-sidebar${toolSidebarOpen ? '' : ' is-closing'}${fastToolTransition ? ' is-switching' : ''}`}
          key={visibleToolTab}
        >
          {visibleSidebarContent}
        </aside>
      )}
      <div className={`detail-layout${assistantOpen ? ' with-assistant' : ''}`}>
        <section className="preview-main detail-main">
          <Outlet context={outletContext} />
        </section>
      </div>
      {assistantOpen && <AIAssistantPanel data={data} onClose={onAssistantClose} />}
    </main>
  );
}
