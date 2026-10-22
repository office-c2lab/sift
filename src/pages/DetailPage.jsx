import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatFileSize } from '../utils/csv.js';
import { ROUTES } from '../routes/paths.js';

function TabIcon({ type }) {
  if (type === 'overview') return <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16m6-16v16"/></svg>;
  if (type === 'visualization') return <svg viewBox="0 0 24 24"><path d="M4 20V11h4v9M10 20V5h4v15m2 0v-8h4v8"/></svg>;
  return <svg viewBox="0 0 24 24"><path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>;
}

function DataTable({ headers, rows, indices = headers.map((_, index) => index) }) {
  return (
    <div className="preview-table-wrap detail-table-wrap">
      <table className="preview-table">
        <thead><tr><th>일련번호</th>{indices.map((index) => <th key={index}>{headers[index]}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}><td>{rowIndex + 1}</td>{indices.map((columnIndex) => <td key={columnIndex}>{row[columnIndex] || <span className="blank-value">—</span>}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function DetailPage({ data, onChangeFile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const activeTab = location.pathname === ROUTES.visualization ? 'visualization' : location.pathname === ROUTES.processing ? 'processing' : 'overview';
  const numericColumns = useMemo(() => data.headers.map((header, index) => ({ header, index })).filter(({ index }) => {
    const filled = data.rows.slice(0, 100).map((row) => String(row[index] ?? '').trim()).filter(Boolean);
    return filled.length > 0 && filled.filter((value) => Number.isFinite(Number(value.replace(/[,$₩\s]/g, '')))).length / filled.length >= 0.7;
  }), [data]);
  const metric = numericColumns.find(({ header }) => /매출|revenue|sales|amount|수량|count|price|금액/i.test(header)) || numericColumns[0];
  const chartData = useMemo(() => {
    if (!metric) return [];
    const categoryIndex = data.headers.findIndex((_, index) => !numericColumns.some((column) => column.index === index));
    const grouped = new Map();
    data.rows.forEach((row, rowIndex) => {
      const label = categoryIndex >= 0 ? row[categoryIndex] || '미지정' : `행 ${rowIndex + 1}`;
      const value = Number(String(row[metric.index] ?? '').replace(/[,$₩\s]/g, '')) || 0;
      grouped.set(label, (grouped.get(label) || 0) + value);
    });
    return [...grouped.entries()].slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [data, metric, numericColumns]);
  const visibleRows = useMemo(() => data.rows.filter((row) => !search || row.some((value) => String(value).toLowerCase().includes(search.toLowerCase()))), [data, search]);
  const visibleColumns = data.headers.map((_, index) => index).filter((index) => !hiddenColumns.includes(index));
  const totalValue = metric ? data.rows.reduce((sum, row) => sum + (Number(String(row[metric.index] ?? '').replace(/[,$₩\s]/g, '')) || 0), 0) : 0;
  const maxChartValue = Math.max(1, ...chartData.map(({ value }) => value));

  return (
    <main className="preview-workspace">
      <aside className="preview-sidebar">
        <div className="preview-file-art"><span className="csv-document"><i>CSV</i></span><span className="file-success"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span></div>
        <strong className="sidebar-file-name" title={data.fileName}>{data.fileName}</strong>
        <span className="upload-complete">업로드 완료</span>
        <div className="file-meta-list">
          <div><span className="meta-symbol">▣</span><span>파일 형식</span><strong>CSV</strong></div>
          <div><span className="meta-symbol">▤</span><span>파일 크기</span><strong>{formatFileSize(data.fileSize)}</strong></div>
          <div><span className="meta-symbol">▦</span><span>총 행 수</span><strong>{data.totalRows.toLocaleString()}개 행</strong></div>
          <div><span className="meta-symbol">▦</span><span>총 열 수</span><strong>{data.headers.length}개 열</strong></div>
        </div>
        <button className="sidebar-change-button" onClick={onChangeFile}><span>⟳</span> 파일 변경</button>
      </aside>
      <section className="preview-main detail-main">
        <header className="preview-main-header"><div><h1>데이터 상세</h1><p>업로드한 데이터의 구조와 내용을 확인하고 필요한 작업을 진행하세요.</p></div></header>
        <nav className="detail-tabs" aria-label="상세 화면 탭">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => navigate(ROUTES.details)}><TabIcon type="overview"/>데이터 개요</button>
          <button className={activeTab === 'visualization' ? 'active' : ''} onClick={() => navigate(ROUTES.visualization)}><TabIcon type="visualization"/>시각화</button>
          <button className={activeTab === 'processing' ? 'active' : ''} onClick={() => navigate(ROUTES.processing)}><TabIcon type="processing"/>데이터 처리</button>
        </nav>

        {activeTab === 'overview' && <section className="detail-view overview-view"><div className="view-caption"><strong>전체 데이터</strong><span>{data.totalRows.toLocaleString()}개 행 · {data.headers.length}개 열</span></div><DataTable headers={data.headers} rows={data.rows}/></section>}

        {activeTab === 'visualization' && <section className="detail-view visualization-view"><div className="visual-summary"><article><span>전체 행</span><strong>{data.totalRows.toLocaleString()}</strong><small>레코드</small></article><article><span>전체 컬럼</span><strong>{data.headers.length}</strong><small>변수</small></article><article><span>숫자형 컬럼</span><strong>{numericColumns.length}</strong><small>지표 후보</small></article><article><span>{metric?.header || '숫자 합계'}</span><strong>{metric ? totalValue.toLocaleString() : '—'}</strong><small>전체 합계</small></article></div><div className="visual-chart-card"><div className="visual-chart-heading"><div><h2>{metric ? `${metric.header} 그룹별 합계` : '시각화할 숫자형 컬럼이 없습니다'}</h2><p>CSV 데이터에서 자동으로 찾은 값으로 만든 차트입니다.</p></div>{metric && <span className="chart-legend-label"><i/>{metric.header}</span>}</div>{chartData.length > 0 ? <div className="visual-chart">{chartData.map((item, index) => <div className="visual-bar-row" key={item.label}><span className="visual-bar-label" title={item.label}>{item.label}</span><div className="visual-bar-track"><i className={index === 0 ? 'highlight' : ''} style={{ width: `${Math.max(2, (item.value / maxChartValue) * 100)}%` }}/></div><strong>{item.value.toLocaleString()}</strong></div>)}</div> : <div className="visual-empty">차트를 만들 수 있는 숫자형 데이터가 없습니다.</div>}</div></section>}

        {activeTab === 'processing' && <section className="detail-view processing-view"><div className="processing-heading"><div><h2>데이터 처리</h2><p>검색어로 행을 필터링하고 표에 표시할 컬럼을 선택하세요.</p></div><label className="row-search"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="데이터 검색" /></label></div><div className="column-picker"><strong>표시할 컬럼</strong>{data.headers.map((header, index) => <label key={`${header}-${index}`}><input type="checkbox" checked={!hiddenColumns.includes(index)} onChange={() => setHiddenColumns((current) => current.includes(index) ? current.filter((column) => column !== index) : [...current, index])}/><span>{header}</span></label>)}</div><div className="view-caption"><strong>처리 결과</strong><span>{visibleRows.length.toLocaleString()}개 행 표시 중</span></div><DataTable headers={data.headers} rows={visibleRows} indices={visibleColumns}/></section>}
      </section>
    </main>
  );
}
