import { useMemo } from 'react';
import { TableProperties } from 'lucide-react';

export default function ColumnInfoCard({ data, layout = 'list' }) {
  const columns = useMemo(
    () =>
      data.headers.map((name, index) => {
        const values = data.rows.map(row => String(row[index] ?? '').trim());
        const filled = values.filter(Boolean);
        const numericCount = filled.filter(value =>
          Number.isFinite(Number(value.replace(/[,$₩\s]/g, '')))
        ).length;
        return {
          name,
          type: filled.length > 0 && numericCount / filled.length >= 0.7 ? '숫자' : '문자열',
          unique: new Set(filled).size,
          missing: values.length - filled.length,
        };
      }),
    [data]
  );

  return (
    <section className={`column-info-card${layout === 'table' ? ' is-table-layout' : ''}`}>
      <header className="column-info-heading">
        <span className="column-info-icon">
          <TableProperties aria-hidden="true" />
        </span>
        <h2>컬럼 정보</h2>
        <span className="column-count">{columns.length}개</span>
      </header>
      {layout === 'table' ? (
        <div className="column-info-scroll">
          <table className="column-info-table">
            <thead>
              <tr>
                <th>컬럼명</th>
                <th>데이터 타입</th>
                <th>고유값 수</th>
                <th>결측치 수</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((column, index) => (
                <tr key={`${column.name}-${index}`}>
                  <td title={column.name}>{column.name}</td>
                  <td>
                    <span
                      className={`column-type ${column.type === '숫자' ? 'numeric' : 'textual'}`}
                    >
                      {column.type}
                    </span>
                  </td>
                  <td>{column.unique.toLocaleString()}</td>
                  <td>{column.missing.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="column-info-list">
          {columns.map((column, index) => (
            <article className="column-info-item" key={`${column.name}-${index}`}>
              <div className="column-item-line">
                <span className="column-item-symbol">
                  <TableProperties aria-hidden="true" />
                </span>
                <strong title={column.name}>{column.name}</strong>
                <span className={`column-type ${column.type === '숫자' ? 'numeric' : 'textual'}`}>
                  {column.type}
                </span>
              </div>
              <div className="column-item-stats">
                <span>
                  고유값 <b>{column.unique.toLocaleString()}</b>
                </span>
                <span>
                  결측치 <b>{column.missing.toLocaleString()}</b>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
