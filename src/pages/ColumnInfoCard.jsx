import { useMemo } from 'react';

export default function ColumnInfoCard({ data }) {
  const columns = useMemo(() => data.headers.map((name, index) => {
    const values = data.rows.map((row) => String(row[index] ?? '').trim());
    const filled = values.filter(Boolean);
    const numericCount = filled.filter((value) => Number.isFinite(Number(value.replace(/[,$₩\s]/g, '')))).length;
    return {
      name,
      type: filled.length > 0 && numericCount / filled.length >= 0.7 ? '숫자' : '문자열',
      unique: new Set(filled).size,
      missing: values.length - filled.length,
    };
  }), [data]);

  return (
    <section className="column-info-card">
      <header className="column-info-heading">
        <span className="column-info-icon"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/></svg></span>
        <h2>컬럼 정보</h2><span className="column-count">{columns.length}개</span>
      </header>
      <div className="column-info-list">
        {columns.map((column, index) => (
          <article className="column-info-item" key={`${column.name}-${index}`}>
            <div className="column-item-line">
              <span className="column-item-symbol">▦</span>
              <strong title={column.name}>{column.name}</strong>
              <span className={`column-type ${column.type === '숫자' ? 'numeric' : 'textual'}`}>{column.type}</span>
            </div>
            <div className="column-item-stats"><span>고유값 <b>{column.unique.toLocaleString()}</b></span><span>결측치 <b>{column.missing.toLocaleString()}</b></span></div>
          </article>
        ))}
      </div>
    </section>
  );
}
