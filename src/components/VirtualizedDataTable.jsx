import { useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useDatasetRowPages from '../hooks/useDatasetRowPages.js';
import PreviewCell from './PreviewCell.jsx';

const PAGE_SIZE = 100;
const ROW_HEIGHT = 39;

export default function VirtualizedDataTable({ datasetId, headers, totalRows, onRangeChange }) {
  const scrollRef = useRef(null);
  const lastStatusRef = useRef('');
  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const firstVisibleIndex = virtualRows[0]?.index ?? 0;
  const lastVisibleIndex = virtualRows.at(-1)?.index ?? Math.min(totalRows - 1, PAGE_SIZE - 1);
  const pageOffsets = useMemo(() => {
    if (totalRows <= 0) return [];
    const firstPage = Math.max(0, Math.floor(firstVisibleIndex / PAGE_SIZE) - 1);
    const lastPage = Math.min(
      Math.ceil(totalRows / PAGE_SIZE) - 1,
      Math.floor(lastVisibleIndex / PAGE_SIZE) + 1,
    );
    return Array.from({ length: lastPage - firstPage + 1 }, (_, index) =>
      (firstPage + index) * PAGE_SIZE,
    );
  }, [firstVisibleIndex, lastVisibleIndex, totalRows]);
  const pageQueries = useDatasetRowPages(datasetId, pageOffsets, PAGE_SIZE);
  const pageMap = useMemo(
    () => new Map(pageOffsets.map((offset, index) => [offset, pageQueries[index]?.data?.rows])),
    [pageOffsets, pageQueries],
  );
  const isLoading = pageQueries.some(query => query.isFetching);
  const hasError = pageQueries.some(query => query.isError);
  const columnTemplate = `96px repeat(${headers.length}, minmax(150px, 1fr))`;
  const tableMinWidth = Math.max(700, 96 + headers.length * 180);

  useEffect(() => {
    const start = totalRows > 0 ? firstVisibleIndex + 1 : 0;
    const end = totalRows > 0 ? Math.min(lastVisibleIndex + 1, totalRows) : 0;
    const status = `${start}:${end}:${isLoading}:${hasError}`;
    if (status === lastStatusRef.current) return;
    lastStatusRef.current = status;
    onRangeChange?.({ start, end, isLoading, hasError });
  }, [firstVisibleIndex, lastVisibleIndex, totalRows, isLoading, hasError, onRangeChange]);

  return (
    <div
      className="virtual-data-table-wrap detail-table-wrap has-overflow"
      ref={scrollRef}
      role="table"
      aria-rowcount={totalRows + 1}
      aria-colcount={headers.length + 1}
    >
      <div className="virtual-data-table" style={{ minWidth: `${tableMinWidth}px` }}>
        <div
          className="virtual-table-header"
          style={{ gridTemplateColumns: columnTemplate }}
          role="row"
        >
          <div role="columnheader">일련번호</div>
          {headers.map((header, index) => (
            <div key={`${header}-${index}`} role="columnheader" title={header}>
              {header}
            </div>
          ))}
        </div>
        <div
          className="virtual-table-body"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
          role="rowgroup"
        >
          {virtualRows.map(virtualRow => {
            const pageOffset = Math.floor(virtualRow.index / PAGE_SIZE) * PAGE_SIZE;
            const row = pageMap.get(pageOffset)?.[virtualRow.index - pageOffset];
            return (
              <div
                className={`virtual-table-row${row ? '' : ' is-loading'}`}
                key={virtualRow.key}
                role="row"
                aria-rowindex={virtualRow.index + 2}
                style={{
                  gridTemplateColumns: columnTemplate,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div role="cell">{virtualRow.index + 1}</div>
                {headers.map((_, columnIndex) => (
                  <div key={columnIndex} role="cell">
                    {row ? (
                      <PreviewCell value={row[columnIndex]} />
                    ) : (
                      <span className="virtual-cell-skeleton" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
