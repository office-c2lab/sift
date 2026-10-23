import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDatasetOverview from '../hooks/useDatasetOverview.js';
import useChartData from '../hooks/useChartData.js';
import useChartOptions from '../hooks/useChartOptions.js';
import useApplyProcessing from '../hooks/useApplyProcessing.js';
import useProcessingOptions from '../hooks/useProcessingOptions.js';
import useDownloadDataset from '../hooks/useDownloadDataset.js';
import { formatFileSize, parseCsv } from '../utils/csv.js';
import ColumnInfoCard from './ColumnInfoCard.jsx';
import ConfirmActionModal from './ConfirmActionModal.jsx';
import CustomDropdown from '../components/CustomDropdown.jsx';
import DatasetDataCard from '../components/DatasetDataCard.jsx';
import OverflowTableContainer from '../components/OverflowTableContainer.jsx';
import PreviewCell from '../components/PreviewCell.jsx';
import DetailLayout from '../layouts/DetailLayout.jsx';
import {
  ChartPie,
  Copy,
  Database,
  FileUp,
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

async function readMergeCsv(file) {
  const buffer = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder('euc-kr').decode(buffer);
  }
  const parsed = parseCsv(text);
  if (!parsed?.headers.length) throw new Error('empty CSV');
  return { ...parsed, fileName: file.name };
}

function DataTable({ headers, rows, indices = headers.map((_, index) => index) }) {
  return (
    <OverflowTableContainer className="preview-table-wrap detail-table-wrap">
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
    </OverflowTableContainer>
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
  const [mergeMode, setMergeMode] = useState('key');
  const [mergeFileData, setMergeFileData] = useState(null);
  const [mergeFileLoading, setMergeFileLoading] = useState(false);
  const [mergeFileError, setMergeFileError] = useState('');
  const [mergePrimaryKey, setMergePrimaryKey] = useState('');
  const [mergeSecondaryKey, setMergeSecondaryKey] = useState('');
  const [mergeJoinType, setMergeJoinType] = useState('left');
  const [confirmation, setConfirmation] = useState(null);
  const [chartType, setChartType] = useState('');
  const [chartMetricIndex, setChartMetricIndex] = useState('');
  const [chartCategoryIndex, setChartCategoryIndex] = useState('');
  const [chartAggregation, setChartAggregation] = useState('');
  const [renderedChart, setRenderedChart] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [downloadPreparing, setDownloadPreparing] = useState(false);
  const {
    data: datasetOverview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useDatasetOverview(data.datasetId);
  const {
    data: chartOptions,
    isFetching: chartOptionsLoading,
    isError: chartOptionsError,
  } = useChartOptions(data.datasetId, chartType);
  const chartDataMutation = useChartData(data.datasetId);
  const {
    data: processingOptions,
    isLoading: processingOptionsLoading,
    isError: processingOptionsError,
  } = useProcessingOptions(data.datasetId);
  const processingMutation = useApplyProcessing(data.datasetId);
  const downloadMutation = useDownloadDataset(data.datasetId);
  const activeTab =
    location.pathname === '/details/visualization'
      ? 'visualization'
      : location.pathname === '/details/merge'
        ? 'merge'
        : location.pathname === '/details/processing'
          ? 'processing'
          : 'overview';
  const categoryOptions = chartOptions?.category_columns ?? [];
  const valueOptions = chartOptions?.value_options ?? [];
  const aggregationOptions = chartOptions?.aggregations ?? [];
  const needsAggregation = chartMetricIndex !== '' && chartMetricIndex !== 'row_count';
  const canDrawChart = Boolean(
    chartType &&
      chartCategoryIndex !== '' &&
      chartMetricIndex &&
      (!needsAggregation || chartAggregation) &&
      !chartOptionsLoading &&
      !chartDataMutation.isPending
  );
  const drawChart = async () => {
    if (!canDrawChart) return;
    const selectedCategory = categoryOptions.find(
      option => option.column_index === Number(chartCategoryIndex)
    );
    const selectedValue = valueOptions.find(option =>
      option.kind === 'row_count'
        ? chartMetricIndex === 'row_count'
        : option.column_index === Number(chartMetricIndex)
    );
    const selectedAggregation = aggregationOptions.find(
      option => option.value === chartAggregation
    );
    const configuration = {
      chart_type: chartType,
      category_column_index: Number(chartCategoryIndex),
      value:
        chartMetricIndex === 'row_count'
          ? { kind: 'row_count' }
          : { kind: 'column', column_index: Number(chartMetricIndex) },
      aggregation: needsAggregation ? chartAggregation : null,
    };

    try {
      const response = await chartDataMutation.mutateAsync(configuration);
      setRenderedChart({
        type: chartType,
        categoryLabel: selectedCategory?.name ?? '가로축',
        valueLabel: selectedValue?.name ?? selectedValue?.label ?? '행 개수',
        aggregationLabel: needsAggregation ? selectedAggregation?.label : '',
        data: response.data.map(point => ({ label: point.x, value: point.y })),
      });
    } catch {
      // The mutation error is rendered in the chart area.
    }
  };
  const chartData = renderedChart?.data ?? [];
  const renderedValueLabel = renderedChart
    ? [renderedChart.valueLabel, renderedChart.aggregationLabel].filter(Boolean).join(' · ')
    : '';
  const visibleRows = processedRows;
  const visibleColumns = processedHeaders
    .map((_, index) => index)
    .filter(index => !removedColumns.includes(index));
  const processingColumns = useMemo(
    () =>
      [...(processingOptions?.columns ?? [])].sort(
        (left, right) => left.column_index - right.column_index
      ),
    [processingOptions]
  );
  const mergePrimaryOptions = visibleColumns.map(index => ({
    value: String(index),
    label: processedHeaders[index],
  }));
  const mergeSecondaryOptions = (mergeFileData?.headers ?? []).map((header, index) => ({
    value: String(index),
    label: header,
  }));
  const currentMergeHeaders = visibleColumns.map(index => processedHeaders[index]);
  const appendCompatible = Boolean(
    mergeFileData &&
      currentMergeHeaders.length === mergeFileData.headers.length &&
      currentMergeHeaders.every(header => mergeFileData.headers.includes(header))
  );
  const missingValueCount = data.rows.reduce(
    (total, row) => total + row.filter(value => String(value ?? '').trim() === '').length,
    0
  );
  const overviewSummary = datasetOverview?.summary;
  const overviewRowCount = overviewSummary?.row_count ?? data.totalRows;
  const overviewColumnCount = overviewSummary?.column_count ?? data.headers.length;
  const overviewMissingCount = overviewSummary?.missing_count ?? missingValueCount;
  const overviewSize = overviewSummary?.size_bytes ?? data.fileSize;
  const overviewHeaders = useMemo(
    () =>
      datasetOverview?.columns
        ? [...datasetOverview.columns]
            .sort((left, right) => left.column_index - right.column_index)
            .map(column => column.name)
        : data.headers,
    [datasetOverview, data.headers]
  );
  const processingHeaders = processingColumns.length
    ? processingColumns.map(column => column.name)
    : overviewHeaders;
  const applyServerProcessing = async (operation, columnIndices) => {
    try {
      const result = await processingMutation.mutateAsync({
        operation,
        column_indices: columnIndices,
      });
      const selectedSet = new Set(columnIndices);
      if (operation === 'drop_columns') {
        setProcessedHeaders(headers =>
          headers.filter((_, index) => !selectedSet.has(index))
        );
        setProcessedRows(rows =>
          rows.map(row => row.filter((_, index) => !selectedSet.has(index)))
        );
      } else if (operation === 'drop_missing') {
        setProcessedRows(rows =>
          rows.filter(row =>
            columnIndices.every(index => String(row[index] ?? '').trim() !== '')
          )
        );
      } else {
        setProcessedRows(rows => {
          const seen = new Set();
          return rows.filter(row => {
            const key = JSON.stringify(columnIndices.map(index => row[index] ?? ''));
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }
      setRemovedColumns([]);
      setSelectedRemovalColumns([]);
      setSelectedMissingColumns([]);
      setSelectedDuplicateColumns([]);
      setRenderedChart(null);
      const resultMessage =
        result.removed_columns > 0
          ? `${result.removed_columns.toLocaleString()}개 컬럼 제거 완료`
          : `${result.removed_rows.toLocaleString()}개 행 제거 완료`;
      toast.success(
        `${resultMessage} · 현재 ${result.row_count.toLocaleString()}행 / ${result.column_count.toLocaleString()}열`
      );
    } catch {
      // The mutation error is rendered in the processing controls.
    }
  };
  const removeMissingRows = () => {
    if (!selectedMissingColumns.length) return;
    setConfirmation({
      title: '선택한 컬럼의 결측 행을 제거할까요?',
      description: `${selectedMissingColumns.length}개 컬럼을 확인해 결측치가 있는 행을 서버 데이터에서 제거합니다.`,
      confirmLabel: '행 제거',
      onConfirm: () => applyServerProcessing('drop_missing', selectedMissingColumns),
    });
  };
  const removeDuplicateRows = () => {
    if (!selectedDuplicateColumns.length) return;
    setConfirmation({
      title: '선택한 컬럼을 기준으로 중복 행을 제거할까요?',
      description: `${selectedDuplicateColumns.length}개 컬럼을 기준으로 중복 행을 서버 데이터에서 제거합니다.`,
      confirmLabel: '중복 제거',
      onConfirm: () => applyServerProcessing('drop_duplicates', selectedDuplicateColumns),
    });
  };
  const removeSelectedColumns = () => {
    if (!selectedRemovalColumns.length) return;
    const count = selectedRemovalColumns.length;
    setConfirmation({
      title: '선택한 컬럼을 제거할까요?',
      description: `${count}개 컬럼을 서버의 현재 데이터에서 제거합니다.`,
      confirmLabel: '컬럼 제거',
      onConfirm: () => applyServerProcessing('drop_columns', selectedRemovalColumns),
    });
  };
  const chooseMergeFile = async file => {
    if (!file) return;
    setMergeFileError('');
    setMergeFileData(null);
    setMergePrimaryKey('');
    setMergeSecondaryKey('');
    if (!/\.csv$/i.test(file.name)) {
      setMergeFileError('CSV 파일을 선택해 주세요.');
      return;
    }
    try {
      setMergeFileLoading(true);
      setMergeFileData(await readMergeCsv(file));
    } catch {
      setMergeFileError('병합할 CSV를 읽지 못했어요. 파일 형식과 인코딩을 확인해 주세요.');
    } finally {
      setMergeFileLoading(false);
    }
  };
  const mergeDatasets = () => {
    if (!mergeFileData) return;
    const baseRows = processedRows.map(row => visibleColumns.map(index => row[index] ?? ''));

    if (mergeMode === 'append') {
      if (!appendCompatible) return;
      setConfirmation({
        title: '두 데이터셋의 행을 이어 붙일까요?',
        description: `${mergeFileData.fileName}의 ${mergeFileData.rows.length.toLocaleString()}개 행을 현재 데이터 아래에 추가합니다.`,
        confirmLabel: '행 추가',
        onConfirm: () => {
          const sourceIndices = currentMergeHeaders.map(header =>
            mergeFileData.headers.indexOf(header)
          );
          const appendedRows = mergeFileData.rows.map(row =>
            sourceIndices.map(index => row[index] ?? '')
          );
          setProcessedHeaders(currentMergeHeaders);
          setProcessedRows([...baseRows, ...appendedRows]);
          setRemovedColumns([]);
          setSelectedRemovalColumns([]);
          setSelectedMissingColumns([]);
          setSelectedDuplicateColumns([]);
        },
      });
      return;
    }

    if (mergePrimaryKey === '' || mergeSecondaryKey === '') return;
    const primaryKeyIndex = visibleColumns.indexOf(Number(mergePrimaryKey));
    const secondaryKeyIndex = Number(mergeSecondaryKey);
    const sourceValueIndices = mergeFileData.headers
      .map((_, index) => index)
      .filter(index => index !== secondaryKeyIndex);
    const mergedHeaders = [...currentMergeHeaders];
    sourceValueIndices.forEach(index => {
      const baseName = mergeFileData.headers[index];
      let uniqueName = baseName;
      let suffix = 2;
      while (mergedHeaders.includes(uniqueName)) {
        uniqueName = `${baseName}_병합${suffix === 2 ? '' : suffix}`;
        suffix += 1;
      }
      mergedHeaders.push(uniqueName);
    });
    const rowsByKey = new Map();
    mergeFileData.rows.forEach(row => {
      const key = String(row[secondaryKeyIndex] ?? '');
      const matches = rowsByKey.get(key) ?? [];
      matches.push(row);
      rowsByKey.set(key, matches);
    });
    const mergedRows = baseRows.flatMap(row => {
      const matches = rowsByKey.get(String(row[primaryKeyIndex] ?? ''));
      if (!matches?.length) {
        return mergeJoinType === 'left'
          ? [[...row, ...sourceValueIndices.map(() => '')]]
          : [];
      }
      return matches.map(match => [
        ...row,
        ...sourceValueIndices.map(index => match[index] ?? ''),
      ]);
    });
    setConfirmation({
      title: '선택한 키를 기준으로 데이터를 병합할까요?',
      description: `${mergeJoinType === 'left' ? '왼쪽 외부 조인' : '내부 조인'}으로 ${mergedRows.length.toLocaleString()}개 결과 행을 만듭니다.`,
      confirmLabel: '데이터 병합',
      onConfirm: () => {
        setProcessedHeaders(mergedHeaders);
        setProcessedRows(mergedRows);
        setRemovedColumns([]);
        setSelectedRemovalColumns([]);
        setSelectedMissingColumns([]);
        setSelectedDuplicateColumns([]);
      },
    });
  };
  const downloadCurrentCsv = async () => {
    if (downloadMutation.isPending || downloadPreparing) return;

    setDownloadPreparing(true);
    try {
      let fileHandle = null;
      if (typeof window.showSaveFilePicker === 'function') {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: data.fileName,
            types: [
              {
                description: 'CSV 파일',
                accept: { 'text/csv': ['.csv'] },
              },
            ],
          });
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }

      const { blob, filename } = await downloadMutation.mutateAsync();
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || data.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    } catch {
      toast.error('CSV 파일을 다운로드하지 못했어요.');
    } finally {
      setDownloadPreparing(false);
    }
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
    processingOptionsLoading ||
    processingOptionsError ||
    processingMutation.isPending;
  const runSelectedProcessingAction =
    processingTool === 'missing'
      ? removeMissingRows
      : processingTool === 'duplicate'
        ? removeDuplicateRows
        : removeSelectedColumns;
  const processingActionLabel =
    processingMutation.isPending
      ? '데이터 처리 중'
      : processingTool === 'missing'
        ? '선택한 컬럼의 결측 행 제거'
        : processingTool === 'duplicate'
          ? '선택한 컬럼 기준 중복 제거'
          : '선택한 컬럼 제거';
  const mergeControls = (
    <section className="sidebar-tools">
      <div className="data-merge-form">
        <fieldset>
          <legend>병합 방식</legend>
          <div className="data-merge-mode-options">
            <button
              type="button"
              className={mergeMode === 'key' ? 'active' : ''}
              onClick={() => setMergeMode('key')}
            >
              키 기준 병합
            </button>
            <button
              type="button"
              className={mergeMode === 'append' ? 'active' : ''}
              onClick={() => setMergeMode('append')}
            >
              행 추가
            </button>
          </div>
        </fieldset>
        <label className="data-merge-file-picker">
          <span>병합할 CSV</span>
          <span className="data-merge-file-button">
            <FileUp aria-hidden="true" />
            {mergeFileLoading ? '파일 읽는 중' : 'CSV 파일 선택'}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={mergeFileLoading}
            onChange={event => chooseMergeFile(event.target.files?.[0])}
          />
        </label>
        {mergeFileData && (
          <div className="data-merge-selected-file">
            <strong title={mergeFileData.fileName}>{mergeFileData.fileName}</strong>
            <span>
              {mergeFileData.rows.length.toLocaleString()}행 ·{' '}
              {mergeFileData.headers.length.toLocaleString()}열
            </span>
          </div>
        )}
        {mergeFileError && (
          <p className="data-merge-message is-error" role="alert">
            {mergeFileError}
          </p>
        )}
        {mergeMode === 'key' ? (
          <>
            <label>
              <span>현재 데이터 기준 컬럼</span>
              <CustomDropdown
                value={mergePrimaryKey}
                onChange={setMergePrimaryKey}
                options={[{ value: '', label: '기준 컬럼 선택' }, ...mergePrimaryOptions]}
              />
            </label>
            <label>
              <span>추가 데이터 기준 컬럼</span>
              <CustomDropdown
                value={mergeSecondaryKey}
                onChange={setMergeSecondaryKey}
                disabled={!mergeFileData}
                options={[
                  { value: '', label: '기준 컬럼 선택' },
                  ...mergeSecondaryOptions,
                ]}
              />
            </label>
            <label>
              <span>조인 방식</span>
              <CustomDropdown
                value={mergeJoinType}
                onChange={setMergeJoinType}
                options={[
                  { value: 'left', label: '왼쪽 외부 조인' },
                  { value: 'inner', label: '내부 조인' },
                ]}
              />
            </label>
          </>
        ) : (
          <p className={`data-merge-message${mergeFileData && !appendCompatible ? ' is-error' : ''}`}>
            {mergeFileData && !appendCompatible
              ? '행을 추가하려면 두 데이터셋의 컬럼 구성이 같아야 합니다.'
              : '같은 컬럼의 데이터를 현재 데이터 아래에 이어 붙입니다.'}
          </p>
        )}
        <button
          className="merge-datasets-button"
          type="button"
          disabled={
            !mergeFileData ||
            (mergeMode === 'key'
              ? mergePrimaryKey === '' || mergeSecondaryKey === ''
              : !appendCompatible)
          }
          onClick={mergeDatasets}
        >
          <Merge aria-hidden="true" />
          {mergeMode === 'key' ? '데이터 병합하기' : '행 추가하기'}
        </button>
      </div>
    </section>
  );
  const processingControls = (
    <section className="sidebar-tools">
      <div className="process-tool-cards">
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
        {processingColumns
          .filter(column => column.name.toLowerCase().includes(columnSearch.toLowerCase()))
          .map(column => (
            <label key={`${column.name}-${column.column_index}`}>
              <input
                type="checkbox"
                checked={selectedProcessingColumns.includes(column.column_index)}
                onChange={() =>
                  setSelectedProcessingColumns(current =>
                    current.includes(column.column_index)
                      ? current.filter(index => index !== column.column_index)
                      : [...current, column.column_index]
                  )
                }
              />
              <span className="sidebar-column-name" title={column.name}>
                {column.name}
              </span>
            </label>
          ))}
      </div>
      {processingOptionsLoading && (
        <p className="processing-api-status" role="status">
          처리 대상 컬럼을 불러오고 있어요.
        </p>
      )}
      {processingOptionsError && (
        <p className="processing-api-status is-error" role="alert">
          처리 대상 컬럼을 불러오지 못했어요.
        </p>
      )}
      {processingMutation.isError && (
        <p className="processing-api-status is-error" role="alert">
          데이터를 처리하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
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
              onClick={() => {
                setChartType(value);
                setChartCategoryIndex('');
                setChartMetricIndex('');
                setChartAggregation('');
                chartDataMutation.reset();
              }}
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
          disabled={!chartType || chartOptionsLoading || chartOptionsError}
          options={[
            {
              value: '',
              label: chartOptionsLoading ? '옵션 불러오는 중' : '가로축 선택',
            },
            ...categoryOptions.map(option => ({
              value: String(option.column_index),
              label: option.name,
            })),
          ]}
        />
      </div>
      <div className="chart-select-field">
        <span>세로축 값</span>
        <CustomDropdown
          value={chartMetricIndex}
          onChange={value => {
            setChartMetricIndex(value);
            setChartAggregation('');
          }}
          disabled={!chartType || chartOptionsLoading || chartOptionsError}
          options={[
            {
              value: '',
              label: chartOptionsLoading ? '옵션 불러오는 중' : '세로축 선택',
            },
            ...valueOptions.map(option => ({
              value:
                option.kind === 'row_count' ? 'row_count' : String(option.column_index),
              label: option.kind === 'row_count' ? option.label : option.name,
            })),
          ]}
        />
      </div>
      {needsAggregation && (
        <div className="chart-select-field">
          <span>집계 방식</span>
          <CustomDropdown
            value={chartAggregation}
            onChange={setChartAggregation}
            options={[
              { value: '', label: '집계 방식 선택' },
              ...aggregationOptions.map(option => ({
                value: option.value,
                label: option.label,
              })),
            ]}
          />
        </div>
      )}
      <button
        className="draw-chart-button"
        type="button"
        disabled={!canDrawChart}
        onClick={drawChart}
      >
        {chartDataMutation.isPending ? '데이터 집계 중' : '그래프 그리기'}
      </button>
      {chartOptionsError ? (
        <p className="chart-control-hint is-error" role="alert">
          차트 옵션을 불러오지 못했어요. 그래프 종류를 다시 선택해 주세요.
        </p>
      ) : chartDataMutation.isError ? (
        <p className="chart-control-hint is-error" role="alert">
          차트 데이터를 불러오지 못했어요. 설정을 확인한 후 다시 시도해 주세요.
        </p>
      ) : (
        <p className="chart-control-hint">
          {chartOptions?.max_groups
            ? `그래프에는 최대 ${chartOptions.max_groups.toLocaleString()}개 그룹이 표시됩니다.`
            : '모든 항목을 선택한 후 그래프 그리기를 눌러주세요.'}
        </p>
      )}
    </section>
  );
  const outletContext = {
    overview: (
      <section className="detail-view overview-view">
        {overviewLoading && (
          <p className="overview-api-status" role="status">
            데이터셋 개요를 불러오고 있어요.
          </p>
        )}
        {overviewError && (
          <p className="overview-api-status is-error" role="alert">
            서버 개요를 불러오지 못해 현재 데이터로 표시하고 있어요.
          </p>
        )}
        <div className="overview-metrics">
          <article>
            <span className="overview-metric-icon blue">
              <Rows3 aria-hidden="true" />
            </span>
            <div>
              <small>총 행 수</small>
              <strong>{overviewRowCount.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon blue">
              <TableProperties aria-hidden="true" />
            </span>
            <div>
              <small>총 컬럼 수</small>
              <strong>{overviewColumnCount.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon violet">
              <ChartPie aria-hidden="true" />
            </span>
            <div>
              <small>결측치 수</small>
              <strong>{overviewMissingCount.toLocaleString()}</strong>
            </div>
          </article>
          <article>
            <span className="overview-metric-icon teal">
              <Database aria-hidden="true" />
            </span>
            <div>
              <small>데이터 용량</small>
              <strong>{formatFileSize(overviewSize)}</strong>
            </div>
          </article>
        </div>
        <div className="overview-panels">
          <ColumnInfoCard data={data} columns={datasetOverview?.columns} layout="table" />
          <DatasetDataCard
            datasetId={data.datasetId}
            headers={overviewHeaders}
            totalRows={overviewRowCount}
          />
        </div>
      </section>
    ),
    visualization: (
      <section className="detail-view visualization-view">
        <div className="visual-chart-card">
          {chartDataMutation.isPending ? (
            <div className="visual-empty visual-empty-setup" role="status">
              <ChartPie aria-hidden="true" />
              <strong>차트 데이터를 집계하고 있어요</strong>
              <span>전체 데이터 기준으로 그래프를 준비하고 있습니다.</span>
            </div>
          ) : !renderedChart ? (
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
                    {renderedValueLabel} · {renderedChart.categoryLabel}
                  </h2>
                  <p>설정을 변경한 후 그래프 그리기를 누르면 차트가 갱신됩니다.</p>
                </div>
                <span className="chart-legend-label">
                  <i />
                  {renderedValueLabel}
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
                        name={renderedValueLabel}
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
                        name={renderedValueLabel}
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
                        name={renderedValueLabel}
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
      <DatasetDataCard
        className="detail-view processing-view processing-data-card"
        datasetId={data.datasetId}
        headers={processingHeaders}
        totalRows={overviewRowCount}
        showTitle={false}
      />
    ),
    merge: (
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
        onDownloadCsv={downloadCurrentCsv}
        downloadPending={downloadMutation.isPending || downloadPreparing}
        sidebarContent={
          activeTab === 'merge'
            ? mergeControls
            : activeTab === 'processing'
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
