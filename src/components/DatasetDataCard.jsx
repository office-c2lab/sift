import { useState } from 'react';
import { Eye } from 'lucide-react';
import VirtualizedDataTable from './VirtualizedDataTable.jsx';

export default function DatasetDataCard({
  datasetId,
  headers,
  totalRows,
  className = '',
  showTitle = true,
}) {
  const [visibleRowRange, setVisibleRowRange] = useState({
    start: 0,
    end: 0,
    isLoading: true,
    hasError: false,
  });

  return (
    <section className={`overview-preview-card${className ? ` ${className}` : ''}`}>
      <header className={showTitle ? '' : 'is-titleless'}>
        {showTitle && (
          <div>
            <span className="overview-preview-icon">
              <Eye aria-hidden="true" />
            </span>
            <h2>데이터</h2>
          </div>
        )}
        <div className="overview-row-actions">
          <span>
            {visibleRowRange.isLoading
              ? '데이터 불러오는 중'
              : `${visibleRowRange.start.toLocaleString()}–${visibleRowRange.end.toLocaleString()} / ${totalRows.toLocaleString()}행`}
          </span>
        </div>
      </header>
      {visibleRowRange.hasError && (
        <p className="overview-row-error" role="alert">
          일부 행을 불러오지 못했어요. 스크롤하면 다시 시도합니다.
        </p>
      )}
      <VirtualizedDataTable
        datasetId={datasetId}
        headers={headers}
        totalRows={totalRows}
        onRangeChange={setVisibleRowRange}
      />
    </section>
  );
}
