import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatFileSize } from '../utils/csv.js';
import ColumnInfoCard from './ColumnInfoCard.jsx';
import ConfirmActionModal from './ConfirmActionModal.jsx';
import CustomDropdown from '../components/CustomDropdown.jsx';
import PreviewCell from '../components/PreviewCell.jsx';
import DetailLayout from '../layouts/DetailLayout.jsx';
import {
  ChartPie,
  Copy,
  Database,
  Download,
  Eye,
  Merge,
  Rows3,
  Search,
  SquareMinus,
  TableProperties,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = ['#20a96b', '#69c58f', '#328f67', '#a0d9b6', '#4eb884', '#167c4a', '#c4ead2'];

function DataTable({ headers, rows, indices = headers.map((_, index) => index) }) {
  return (
    <div className="preview-table-wrap detail-table-wrap">
      <table className="preview-table">
        <thead>
          <tr>
            <th>일련번호</th>
            {indices.map(index => (
              <th key={index}>{headers[index]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>{rowIndex + 1}</td>
              {indices.map(columnIndex => (
                <td key={columnIndex}>
                  <PreviewCell value={row[columnIndex]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessToolIcon({ type }) {
  if (type === 'missing') return <TriangleAlert aria-hidden="true" />;
  if (type === 'duplicate') return <Copy aria-hidden="true" />;
  if (type === 'merge') return <Merge aria-hidden="true" />;
  return <SquareMinus aria-hidden="true" />;
}

export default function DetailPage({ data, onChangeFile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [columnSearch, setColumnSearch] = useState('');
  const [selectedRemovalColumns, setSelectedRemovalColumns] = useState([]);
  const [selectedMissingColumns, setSelectedMissingColumns] = useState([]);
  const [selectedDuplicateColumns, setSelectedDuplicateColumns] = useState([]);
  const [removedColumns, setRemovedColumns] = useState([]);
  const [processedHeaders, setProcessedHeaders] = useState(data.headers);
  const [processedRows, setProcessedRows] = useState(data.rows);
  const [processingTool, setProcessingTool] = useState('columns');
  const [mergeFirstColumn, setMergeFirstColumn] = useState('');
  const [mergeSecondColumn, setMergeSecondColumn] = useState('');
  const [mergeColumnName, setMergeColumnName] = useState('');
  const [mergeSeparator, setMergeSeparator] = useState(' ');
  const [confirmation, setConfirmation] = useState(null);
  const [chartType, setChartType] = useState('');
  const [chartMetricIndex, setChartMetricIndex] = useState('');
  const [chartCategoryIndex, setChartCategoryIndex] = useState('');
  const [renderedChart, setRenderedChart] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const activeTab =
    location.pathname === '/details/visualization'
      ? 'visualization'
      : location.pathname === '/details/processing'
        ? 'processing'
        : 'overview';
  const numericColumns = useMemo(
    () =>
      data.headers
        .map((header, index) => ({ header, index }))
        .filter(({ index }) => {
          const filled = data.rows
            .slice(0, 100)
            .map(row => String(row[index] ?? '').trim())
            .filter(Boolean);
          return (
            filled.length > 0 &&
            filled.filter(value => Number.isFinite(Number(value.replace(/[,$₩\s]/g, '')))).length /
              filled.length >=
              0.7
          );
        }),
    [data]
  );
  const metric =
    renderedChart?.metricIndex === 'count'
      ? null
      : numericColumns.find(({ index }) => index === Number(renderedChart?.metricIndex));
  const categoryIndex = renderedChart ? Number(renderedChart.categoryIndex) : -1;
  const chartData = useMemo(() => {
    if (!renderedChart) return [];
    const grouped = new Map();
    data.rows.forEach((row, rowIndex) => {
      const label = categoryIndex >= 0 ? row[categoryIndex] || '미지정' : `행 ${rowIndex + 1}`;
      const value = metric
        ? Number(String(row[metric.index] ?? '').replace(/[,$₩\s]/g, '')) || 0
        : 1;
      grouped.set(label, (grouped.get(label) || 0) + value);
    });
    return [...grouped.entries()].slice(0, 20).map(([label, value]) => ({ label, value }));
  }, [data, metric, categoryIndex, renderedChart]);
  const canDrawChart = Boolean(chartType && chartCategoryIndex && chartMetricIndex);
  const drawChart = () => {
    if (!canDrawChart) return;
    setRenderedChart({
      type: chartType,
      categoryIndex: chartCategoryIndex,
      metricIndex: chartMetricIndex,
    });
  };
  const visibleRows = processedRows;
  const visibleColumns = processedHeaders
    .map((_, index) => index)
    .filter(index => !removedColumns.includes(index));
  const mergeColumnOptions = visibleColumns.map(index => ({
    value: String(index),
    label: processedHeaders[index],
  }));
  const missingValueCount = data.rows.reduce(
    (total, row) => total + row.filter(value => String(value ?? '').trim() === '').length,
    0
  );
  const selectedMissingVisibleColumns = selectedMissingColumns.filter(index =>
    visibleColumns.includes(index)
  );
  const selectedDuplicateVisibleColumns = selectedDuplicateColumns.filter(index =>
    visibleColumns.includes(index)
  );
  const missingRowsCount = processedRows.filter(row =>
    selectedMissingVisibleColumns.some(index => String(row[index] ?? '').trim() === '')
  ).length;
  const duplicateRowsCount = (() => {
    if (!selectedDuplicateVisibleColumns.length) return 0;
    const seen = new Set();
    return processedRows.reduce((count, row) => {
      const key = JSON.stringify(selectedDuplicateVisibleColumns.map(index => row[index] ?? ''));
      if (seen.has(key)) return count + 1;
      seen.add(key);
      return count;
    }, 0);
  })();
  const removeMissingRows = () => {
    if (!selectedMissingVisibleColumns.length || !missingRowsCount) return;
    setConfirmation({
      title: '선택한 컬럼의 결측 행을 제거할까요?',
      description: `${selectedMissingVisibleColumns.length}개 컬럼을 확인해 결측치가 있는 ${missingRowsCount.toLocaleString()}개 행을 제거합니다.`,
      confirmLabel: '행 제거',
      onConfirm: () => {
        setProcessingTool('missing');
        setProcessedRows(rows =>
          rows.filter(row =>
            selectedMissingVisibleColumns.every(index => String(row[index] ?? '').trim() !== '')
          )
        );
        setSelectedMissingColumns([]);
      },
    });
  };
  const removeDuplicateRows = () => {
    if (!selectedDuplicateVisibleColumns.length || !duplicateRowsCount) return;
    setConfirmation({
      title: '선택한 컬럼을 기준으로 중복 행을 제거할까요?',
      description: `${selectedDuplicateVisibleColumns.length}개 컬럼을 기준으로 ${duplicateRowsCount.toLocaleString()}개 중복 행을 제거합니다.`,
      confirmLabel: '중복 제거',
      onConfirm: () => {
        setProcessingTool('duplicate');
        setProcessedRows(rows => {
          const seen = new Set();
          return rows.filter(row => {
            const key = JSON.stringify(
              selectedDuplicateVisibleColumns.map(index => row[index] ?? '')
            );
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        setSelectedDuplicateColumns([]);
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
        setRemovedColumns(current => [...new Set([...current, ...selectedRemovalColumns])]);
        setSelectedMissingColumns(current =>
          current.filter(index => !selectedRemovalColumns.includes(index))
        );
        setSelectedDuplicateColumns(current =>
          current.filter(index => !selectedRemovalColumns.includes(index))
        );
        setSelectedRemovalColumns([]);
      },
    });
  };
  const mergeColumns = () => {
    const firstIndex = Number(mergeFirstColumn);
    const secondIndex = Number(mergeSecondColumn);
    const name = mergeColumnName.trim();
    if (!name || mergeFirstColumn === '' || mergeSecondColumn === '' || firstIndex === secondIndex)
      return;
    let uniqueName = name;
    let suffix = 2;
    while (processedHeaders.includes(uniqueName)) {
      uniqueName = `${name}_${suffix}`;
      suffix += 1;
    }
    setConfirmation({
      title: '선택한 컬럼을 병합할까요?',
      description: `${processedHeaders[firstIndex]}와 ${processedHeaders[secondIndex]} 값을 합쳐 ${uniqueName} 컬럼을 만듭니다.`,
      confirmLabel: '컬럼 병합',
      onConfirm: () => {
        setProcessedHeaders(headers => [...headers, uniqueName]);
        setProcessedRows(rows =>
          rows.map(row => {
            const values = [row[firstIndex], row[secondIndex]]
              .map(value => String(value ?? '').trim())
              .filter(Boolean);
            return [...row, values.join(mergeSeparator)];
          })
        );
        setMergeColumnName('');
        setMergeFirstColumn('');
        setMergeSecondColumn('');
      },
    });
  };
  const downloadProcessedCsv = () => {
    const escapeCell = value => {
      const text = String(value ?? '');
      return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    const csvRows = [
      visibleColumns.map(index => processedHeaders[index]),
      ...processedRows.map(row => visibleColumns.map(index => row[index] ?? '')),
    ];
    const csv = `\uFEFF${csvRows.map(row => row.map(escapeCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.fileName.replace(/\.csv$/i, '')}_processed.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const confirmFileChange = () =>
    setConfirmation({
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
  const selectedProcessingColumns =
    processingTool === 'missing'
      ? selectedMissingColumns
      : processingTool === 'duplicate'
        ? selectedDuplicateColumns
        : selectedRemovalColumns;
  const setSelectedProcessingColumns =
    processingTool === 'missing'
      ? setSelectedMissingColumns
      : processingTool === 'duplicate'
        ? setSelectedDuplicateColumns
        : setSelectedRemovalColumns;
  const processingSelectionHeading =
    processingTool === 'missing'
      ? '결측치를 확인할 컬럼 선택'
      : processingTool === 'duplicate'
        ? '중복 기준 컬럼 선택'
        : '제거할 컬럼 선택';
  const processingActionDisabled =
    !selectedProcessingColumns.length ||
    (processingTool === 'missing' && !missingRowsCount) ||
    (processingTool === 'duplicate' && !duplicateRowsCount);
  const runSelectedProcessingAction =
    processingTool === 'missing'
      ? removeMissingRows
      : processingTool === 'duplicate'
        ? removeDuplicateRows
        : removeSelectedColumns;
  const processingActionLabel =
    processingTool === 'missing'
      ? `결측 행 ${missingRowsCount.toLocaleString()}개 제거`
      : processingTool === 'duplicate'
        ? `중복 행 ${duplicateRowsCount.toLocaleString()}개 제거`
        : '선택한 컬럼 제거';
  const processingControls = (
    <section className="sidebar-tools">
      <div className="process-tool-cards">
        <button
          type="button"
          className={`merge-tool${processingTool === 'merge' ? ' active' : ''}`}
          onClick={() => setProcessingTool('merge')}
        >
          <span>
            <ProcessToolIcon type="merge" />
          </span>
          <div>
            <strong>컬럼 병합</strong>
            <small>두 컬럼의 값을 새 컬럼으로 합치기</small>
          </div>
        </button>
        <button
          type="button"
          className={processingTool === 'columns' ? 'active' : ''}
          onClick={() => setProcessingTool('columns')}
        >
          <span>
            <ProcessToolIcon type="columns" />
          </span>
          <div>
            <strong>컬럼 제거</strong>
            <small>선택한 컬럼을 데이터에서 제거</small>
          </div>
        </button>
        <button
          type="button"
          className={processingTool === 'missing' ? 'active' : ''}
          onClick={() => setProcessingTool('missing')}
        >
          <span>
            <ProcessToolIcon type="missing" />
          </span>
          <div>
            <strong>결측치 제거</strong>
            <small>선택한 컬럼에 빈 값이 있는 행 제거</small>
          </div>
        </button>
        <button
          type="button"
          className={processingTool === 'duplicate' ? 'active' : ''}
          onClick={() => setProcessingTool('duplicate')}
        >
          <span>
            <ProcessToolIcon type="duplicate" />
          </span>
          <div>
            <strong>중복 제거</strong>
            <small>선택한 컬럼을 기준으로 중복 행 정리</small>
          </div>
        </button>
      </div>
      {processingTool === 'merge' ? (
        <div className="merge-column-form">
          <div className="process-column-heading">
            <strong>병합할 컬럼 설정</strong>
            <span>2개 선택</span>
          </div>
          <label>
            <span>첫 번째 컬럼</span>
            <CustomDropdown
              value={mergeFirstColumn}
              onChange={setMergeFirstColumn}
              options={[{ value: '', label: '컬럼 선택' }, ...mergeColumnOptions]}
            />
          </label>
          <label>
            <span>두 번째 컬럼</span>
            <CustomDropdown
              value={mergeSecondColumn}
              onChange={setMergeSecondColumn}
              options={[{ value: '', label: '컬럼 선택' }, ...mergeColumnOptions]}
            />
          </label>
          <label>
            <span>새 컬럼명</span>
            <input
              value={mergeColumnName}
              onChange={event => setMergeColumnName(event.target.value)}
              placeholder="예: 전체 주소"
            />
          </label>
          <label>
            <span>구분자</span>
            <input
              value={mergeSeparator}
              onChange={event => setMergeSeparator(event.target.value)}
              placeholder="공백 없이 병합"
            />
          </label>
          <button
            className="merge-columns-button"
            type="button"
            disabled={
              !mergeColumnName.trim() ||
              mergeFirstColumn === '' ||
              mergeSecondColumn === '' ||
              mergeFirstColumn === mergeSecondColumn
            }
            onClick={mergeColumns}
          >
            <ProcessToolIcon type="merge" />새 컬럼으로 병합
          </button>
        </div>
      ) : (
        <>
          <div className="process-column-heading">
            <strong>{processingSelectionHeading}</strong>
            <span>{selectedProcessingColumns.length}개 선택</span>
          </div>
          <label className="sidebar-column-search">
            <span>
              <Search aria-hidden="true" />
            </span>
            <input
              value={columnSearch}
              onChange={event => setColumnSearch(event.target.value)}
              placeholder="컬럼 검색"
            />
          </label>
          <div className="sidebar-column-list">
            {processedHeaders
              .map((header, index) => ({ header, index }))
              .filter(
                ({ header, index }) =>
                  !removedColumns.includes(index) &&
                  header.toLowerCase().includes(columnSearch.toLowerCase())
              )
              .map(({ header, index }) => (
                <label key={`${header}-${index}`}>
                  <input
                    type="checkbox"
                    checked={selectedProcessingColumns.includes(index)}
                    onChange={() =>
                      setSelectedProcessingColumns(current =>
                        current.includes(index)
                          ? current.filter(column => column !== index)
                          : [...current, index]
                      )
                    }
                  />
                  <span className="sidebar-column-name" title={header}>
                    {header}
                  </span>
                </label>
              ))}
          </div>
          <button
            className="remove-columns-button"
            type="button"
            disabled={processingActionDisabled}
            onClick={runSelectedProcessingAction}
          >
            {processingTool === 'columns' ? (
              <Trash2 aria-hidden="true" />
            ) : (
              <ProcessToolIcon type={processingTool} />
            )}
            {processingActionLabel}
          </button>
        </>
      )}
      <div className="processing-download-footer">
        <button className="download-csv-button" type="button" onClick={downloadProcessedCsv}>
          <Download aria-hidden="true" />
          CSV 다운로드
        </button>
      </div>
    </section>
  );
  const visualizationControls = (
    <section className="sidebar-chart-controls">
      <h2>차트 설정</h2>
      <fieldset>
        <legend>그래프 종류</legend>
        <div className="chart-type-options">
          {[
            ['bar', '막대'],
            ['line', '선'],
            ['area', '영역'],
            ['pie', '원형'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={chartType === value ? 'selected' : ''}
              onClick={() => setChartType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="chart-select-field">
        <span>가로축 기준</span>
        <CustomDropdown
          value={chartCategoryIndex}
          onChange={setChartCategoryIndex}
          options={[
            { value: '', label: '가로축 선택' },
            ...data.headers.map((header, index) => ({ value: String(index), label: header })),
          ]}
        />
      </div>
      <div className="chart-select-field">
        <span>세로축 값</span>
        <CustomDropdown
          value={chartMetricIndex}
          onChange={setChartMetricIndex}
          options={[
            { value: '', label: '세로축 선택' },
            { value: 'count', label: '행 개수' },
            ...numericColumns.map(({ header, index }) => ({
              value: String(index),
              label: `${header} 합계`,
            })),
          ]}
        />
      </div>
      <button
        className="draw-chart-button"
        type="button"
        disabled={!canDrawChart}
        onClick={drawChart}
      >
        그래프 그리기
      </button>
      <p className="chart-control-hint">모든 항목을 선택한 후 그래프 그리기를 눌러주세요.</p>
    </section>
  );
  const outletContext = {
    overview: (
      <section className="detail-view overview-view">
        <div className="overview-metrics">
          <article>
            <span className="overview-metric-icon blue">
              <Rows3 aria-hidden="true" />
            </span>
            <div>
              <small>총 행 수</small>
              <strong>{data.totalRows.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon blue">
              <TableProperties aria-hidden="true" />
            </span>
            <div>
              <small>총 컬럼 수</small>
              <strong>{data.headers.length.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon violet">
              <ChartPie aria-hidden="true" />
            </span>
            <div>
              <small>결측치 수</small>
              <strong>{missingValueCount.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon teal">
              <Database aria-hidden="true" />
            </span>
            <div>
              <small>데이터 용량</small>
              <strong>{formatFileSize(data.fileSize)}</strong>
            </div>
          </article>
        </div>
        <div className="overview-panels">
          <ColumnInfoCard data={data} layout="table" />
          <section className="overview-preview-card">
            <header>
              <div>
                <span className="overview-preview-icon">
                  <Eye aria-hidden="true" />
                </span>
                <h2>데이터</h2>
              </div>
            </header>
            <DataTable headers={data.headers} rows={data.rows} />
          </section>
        </div>
      </section>
    ),
    visualization: (
      <section className="detail-view visualization-view">
        <div className="visual-chart-card">
          {!renderedChart ? (
            <div className="visual-empty visual-empty-setup">
              <ChartPie aria-hidden="true" />
              <strong>차트 설정을 완료해 주세요</strong>
              <span>가로축, 세로축, 그래프 종류를 선택하면 데이터를 시각화할 수 있습니다.</span>
            </div>
          ) : chartData.length > 0 ? (
            <>
              <div className="visual-chart-heading">
                <div>
                  <h2>
                    {metric ? `${metric.header} 합계` : '행 개수'} · {data.headers[categoryIndex]}
                  </h2>
                  <p>설정을 변경한 후 그래프 그리기를 누르면 차트가 갱신됩니다.</p>
                </div>
                <span className="chart-legend-label">
                  <i />
                  {metric?.header || '행 개수'}
                </span>
              </div>
              <div className="recharts-frame">
                <ResponsiveContainer width="100%" height="100%" debounce={120}>
                  {renderedChart.type === 'pie' ? (
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="48%"
                        outerRadius="72%"
                        isAnimationActive={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((item, index) => (
                          <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : renderedChart.type === 'line' ? (
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 24, left: 8, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        angle={-28}
                        textAnchor="end"
                        interval={0}
                        height={65}
                      />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={metric?.header || '행 개수'}
                        stroke="#20a96b"
                        strokeWidth={3}
                        isAnimationActive={false}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : renderedChart.type === 'area' ? (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 20, right: 24, left: 8, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        angle={-28}
                        textAnchor="end"
                        interval={0}
                        height={65}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={metric?.header || '행 개수'}
                        stroke="#20a96b"
                        fill="#b9e8ca"
                        strokeWidth={3}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 20, right: 24, left: 8, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        angle={-28}
                        textAnchor="end"
                        interval={0}
                        height={65}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        name={metric?.header || '행 개수'}
                        fill="#20a96b"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="visual-empty">표시할 데이터가 없습니다.</div>
          )}
        </div>
      </section>
    ),
    processing: (
      <section className="detail-view processing-view">
        <DataTable headers={processedHeaders} rows={visibleRows} indices={visibleColumns} />
      </section>
    ),
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
        sidebarContent={
          activeTab === 'processing'
            ? processingControls
            : activeTab === 'visualization'
              ? visualizationControls
              : null
        }
        outletContext={outletContext}
      />
      {confirmation && (
        <ConfirmActionModal
          {...confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </>
  );
}
