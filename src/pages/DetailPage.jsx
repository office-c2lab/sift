import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatFileSize } from '../utils/csv.js';
import { ROUTES } from '../routes/paths.js';
import ColumnInfoCard from './ColumnInfoCard.jsx';
import ConfirmActionModal from './ConfirmActionModal.jsx';
import CustomDropdown from '../components/CustomDropdown.jsx';
import DetailLayout from '../layouts/DetailLayout.jsx';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const CHART_COLORS = ['#20a96b', '#69c58f', '#328f67', '#a0d9b6', '#4eb884', '#167c4a', '#c4ead2'];

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

function ProcessToolIcon({ type }) {
  if (type === 'missing') return <svg viewBox="0 0 24 24"><path d="M12 3v9m0 4v.1M5.6 20h12.8a2 2 0 0 0 1.7-3L13.7 5a2 2 0 0 0-3.4 0l-6.4 12a2 2 0 0 0 1.7 3Z"/></svg>;
  if (type === 'duplicate') return <svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
  return <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12h8"/></svg>;
}

export default function DetailPage({ data, onChangeFile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [columnSearch, setColumnSearch] = useState('');
  const [selectedRemovalColumns, setSelectedRemovalColumns] = useState([]);
  const [removedColumns, setRemovedColumns] = useState([]);
  const [processedRows, setProcessedRows] = useState(data.rows);
  const [processingTool, setProcessingTool] = useState('columns');
  const [confirmation, setConfirmation] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [chartMetricIndex, setChartMetricIndex] = useState('count');
  const [chartCategoryIndex, setChartCategoryIndex] = useState('auto');
  const [overviewRowLimit, setOverviewRowLimit] = useState('100');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const activeTab = location.pathname === ROUTES.visualization ? 'visualization' : location.pathname === ROUTES.processing ? 'processing' : 'overview';
  const numericColumns = useMemo(() => data.headers.map((header, index) => ({ header, index })).filter(({ index }) => {
    const filled = data.rows.slice(0, 100).map((row) => String(row[index] ?? '').trim()).filter(Boolean);
    return filled.length > 0 && filled.filter((value) => Number.isFinite(Number(value.replace(/[,$₩\s]/g, '')))).length / filled.length >= 0.7;
  }), [data]);
  const preferredMetric = numericColumns.find(({ header }) => /매출|revenue|sales|amount|수량|count|price|금액/i.test(header)) || numericColumns[0];
  const metric = chartMetricIndex === 'count' ? null : numericColumns.find(({ index }) => index === Number(chartMetricIndex)) || preferredMetric;
  const categoryIndex = chartCategoryIndex === 'auto' ? data.headers.findIndex((_, index) => !numericColumns.some((column) => column.index === index)) : Number(chartCategoryIndex);
  const chartData = useMemo(() => {
    const grouped = new Map();
    data.rows.forEach((row, rowIndex) => {
      const label = categoryIndex >= 0 ? row[categoryIndex] || '미지정' : `행 ${rowIndex + 1}`;
      const value = metric ? Number(String(row[metric.index] ?? '').replace(/[,$₩\s]/g, '')) || 0 : 1;
      grouped.set(label, (grouped.get(label) || 0) + value);
    });
    return [...grouped.entries()].slice(0, 20).map(([label, value]) => ({ label, value }));
  }, [data, metric, categoryIndex]);
  const visibleRows = processedRows;
  const visibleColumns = data.headers.map((_, index) => index).filter((index) => !removedColumns.includes(index));
  const missingValueCount = data.rows.reduce((total, row) => total + row.filter((value) => String(value ?? '').trim() === '').length, 0);
  const overviewRows = overviewRowLimit === 'all' ? data.rows : data.rows.slice(0, Number(overviewRowLimit));
  const missingRowsCount = processedRows.filter((row) => row.some((value) => String(value ?? '').trim() === '')).length;
  const duplicateRowsCount = processedRows.length - new Set(processedRows.map((row) => JSON.stringify(row))).size;
  const removeMissingRows = () => {
    if (!missingRowsCount) return;
    setConfirmation({
      title: '결측치가 포함된 행을 제거할까요?',
      description: `${missingRowsCount.toLocaleString()}개 행이 제거됩니다. 이 작업은 현재 데이터 처리 결과에 반영됩니다.`,
      confirmLabel: '행 제거',
      onConfirm: () => {
        setProcessingTool('missing');
        setProcessedRows((rows) => rows.filter((row) => row.every((value) => String(value ?? '').trim() !== '')));
      },
    });
  };
  const removeDuplicateRows = () => {
    if (!duplicateRowsCount) return;
    setConfirmation({
      title: '중복 행을 제거할까요?',
      description: `${duplicateRowsCount.toLocaleString()}개 중복 행이 제거됩니다. 이 작업은 현재 데이터 처리 결과에 반영됩니다.`,
      confirmLabel: '중복 제거',
      onConfirm: () => {
        setProcessingTool('duplicate');
        setProcessedRows((rows) => [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()]);
      },
    });
  };
  const removeSelectedColumns = () => {
    if (!selectedRemovalColumns.length) return;
    const count = selectedRemovalColumns.length;
    setConfirmation({
      title: '선택한 컬럼을 제거할까요?',
      description: `${count}개 컬럼이 처리 결과에서 제거됩니다.`,
      confirmLabel: '컬럼 제거',
      onConfirm: () => {
        setRemovedColumns((current) => [...new Set([...current, ...selectedRemovalColumns])]);
        setSelectedRemovalColumns([]);
      },
    });
  };
  const confirmFileChange = () => setConfirmation({
    title: '업로드한 파일을 변경할까요?',
    description: '현재 작업 내용이 초기화되고 업로드 화면으로 이동합니다.',
    confirmLabel: '파일 변경',
    onConfirm: onChangeFile,
  });
  const runConfirmedAction = () => {
    const action = confirmation?.onConfirm;
    setConfirmation(null);
    action?.();
  };
  const processingControls = <section className="sidebar-tools">
          <div className="process-tool-cards">
            <button type="button" className={processingTool === 'columns' ? 'active' : ''} onClick={() => setProcessingTool('columns')}><span><ProcessToolIcon type="columns"/></span><div><strong>컬럼 제거</strong><small>선택한 컬럼을 데이터에서 제거</small></div></button>
            <button type="button" onClick={removeMissingRows}><span><ProcessToolIcon type="missing"/></span><div><strong>결측치 제거</strong><small>비어 있는 값이 포함된 행 제거</small></div></button>
            <button type="button" onClick={removeDuplicateRows}><span><ProcessToolIcon type="duplicate"/></span><div><strong>중복 제거</strong><small>중복된 행을 하나로 정리</small></div></button>
          </div>
          <div className="process-column-heading"><strong>제거할 컬럼 선택</strong><span>{selectedRemovalColumns.length}개 선택</span></div>
          <label className="sidebar-column-search"><span>⌕</span><input value={columnSearch} onChange={(event) => setColumnSearch(event.target.value)} placeholder="컬럼 검색" /></label>
          <div className="sidebar-column-list">{data.headers.map((header, index) => ({header, index})).filter(({header, index}) => !removedColumns.includes(index) && header.toLowerCase().includes(columnSearch.toLowerCase())).map(({header, index}) => <label key={`${header}-${index}`}><input type="checkbox" checked={selectedRemovalColumns.includes(index)} onChange={() => setSelectedRemovalColumns((current) => current.includes(index) ? current.filter((column) => column !== index) : [...current, index])}/><span className="sidebar-column-name" title={header}>{header}</span></label>)}</div>
          <button className="remove-columns-button" type="button" disabled={!selectedRemovalColumns.length} onClick={removeSelectedColumns}><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>선택한 컬럼 제거</button>
    </section>;
  const visualizationControls = <section className="sidebar-chart-controls">
          <h2>차트 설정</h2>
          <fieldset><legend>그래프 종류</legend><div className="chart-type-options">{[['bar','막대'],['line','선'],['area','영역'],['pie','원형']].map(([value,label]) => <button type="button" key={value} className={chartType === value ? 'selected' : ''} onClick={() => setChartType(value)}>{label}</button>)}</div></fieldset>
          <div className="chart-select-field"><span>가로축 기준</span><CustomDropdown value={chartCategoryIndex} onChange={setChartCategoryIndex} options={[{value:'auto',label:'자동 선택'}, ...data.headers.map((header,index) => ({value:String(index),label:header}))]}/></div>
          <div className="chart-select-field"><span>세로축 값</span><CustomDropdown value={chartMetricIndex} onChange={setChartMetricIndex} options={[{value:'count',label:'행 개수'}, ...numericColumns.map(({header,index}) => ({value:String(index),label:`${header} 합계`}))]}/></div>
          <p className="chart-control-hint">선택한 기준으로 데이터를 묶어 그래프로 보여줍니다.</p>
    </section>;
  const outletContext = {
    overview: <section className="detail-view overview-view">
      <div className="overview-metrics">
        <article><span className="overview-metric-icon blue"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg></span><div><small>총 행 수</small><strong>{data.totalRows.toLocaleString()}</strong></div></article>
        <article><span className="overview-metric-icon blue"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/></svg></span><div><small>총 컬럼 수</small><strong>{data.headers.length.toLocaleString()}</strong></div></article>
        <article><span className="overview-metric-icon violet"><svg viewBox="0 0 24 24"><path d="M12 3v9l7.8 4.5A9 9 0 1 1 12 3Z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/></svg></span><div><small>결측치 수</small><strong>{missingValueCount.toLocaleString()}</strong></div></article>
        <article><span className="overview-metric-icon teal"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg></span><div><small>데이터 용량</small><strong>{formatFileSize(data.fileSize)}</strong></div></article>
      </div>
      <div className="overview-panels">
        <ColumnInfoCard data={data} layout="table" />
        <section className="overview-preview-card">
          <header><div><span className="overview-preview-icon"><svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></span><h2>데이터 미리보기</h2></div><div className="overview-limit-select"><CustomDropdown value={overviewRowLimit} onChange={setOverviewRowLimit} options={[{value:'100',label:'처음 100행 보기'},{value:'500',label:'처음 500행 보기'},{value:'all',label:'전체 데이터 보기'}]}/></div></header>
          <DataTable headers={data.headers} rows={overviewRows}/>
        </section>
      </div>
    </section>,
    visualization: <section className="detail-view visualization-view"><div className="page-control-panel">{visualizationControls}</div><div className="visual-chart-card"><div className="visual-chart-heading"><div><h2>{metric ? `${metric.header} 합계` : '행 개수'} · {categoryIndex >= 0 ? data.headers[categoryIndex] : '전체 행'}</h2><p>페이지 안의 설정에서 그래프 종류와 기준을 바꿀 수 있습니다.</p></div><span className="chart-legend-label"><i/>{metric?.header || '행 개수'}</span></div>{chartData.length > 0 ? <div className="recharts-frame"><ResponsiveContainer width="100%" height="100%">{chartType === 'pie' ? <PieChart><Tooltip/><Legend/><Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="48%" outerRadius="72%" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>{chartData.map((item,index) => <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]}/>)}</Pie></PieChart> : chartType === 'line' ? <LineChart data={chartData} margin={{top:20,right:24,left:8,bottom:48}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" angle={-28} textAnchor="end" interval={0} height={65}/><YAxis/><Tooltip/><Line type="monotone" dataKey="value" name={metric?.header || '행 개수'} stroke="#20a96b" strokeWidth={3} dot={{r:4}} activeDot={{r:6}}/></LineChart> : chartType === 'area' ? <AreaChart data={chartData} margin={{top:20,right:24,left:8,bottom:48}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" angle={-28} textAnchor="end" interval={0} height={65}/><YAxis/><Tooltip/><Area type="monotone" dataKey="value" name={metric?.header || '행 개수'} stroke="#20a96b" fill="#b9e8ca" strokeWidth={3}/></AreaChart> : <BarChart data={chartData} margin={{top:20,right:24,left:8,bottom:48}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" angle={-28} textAnchor="end" interval={0} height={65}/><YAxis/><Tooltip/><Bar dataKey="value" name={metric?.header || '행 개수'} fill="#20a96b" radius={[6,6,0,0]}/></BarChart>}</ResponsiveContainer></div> : <div className="visual-empty">표시할 데이터가 없습니다.</div>}</div></section>,
    processing: <section className="detail-view processing-view"><div className="page-control-panel">{processingControls}</div><DataTable headers={data.headers} rows={visibleRows} indices={visibleColumns}/></section>,
  };

  return (
    <>
    <DetailLayout
      data={data}
      activeTab={activeTab}
      navigate={navigate}
      assistantOpen={assistantOpen}
      onAssistantOpen={() => setAssistantOpen(true)}
      onAssistantClose={() => setAssistantOpen(false)}
      onFileChange={confirmFileChange}
      outletContext={outletContext}
    />
      {confirmation && <ConfirmActionModal {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={runConfirmedAction} />}
    </>
  );
}
