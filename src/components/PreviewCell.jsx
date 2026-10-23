const MAX_PREVIEW_CHARACTERS = 20;

export default function PreviewCell({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="blank-value">—</span>;
  }

  const text = String(value);
  const characters = Array.from(text);
  const isTruncated = characters.length > MAX_PREVIEW_CHARACTERS;
  const displayValue = isTruncated
    ? `${characters.slice(0, MAX_PREVIEW_CHARACTERS).join('')}...`
    : text;

  return (
    <span title={isTruncated ? text : undefined} aria-label={isTruncated ? text : undefined}>
      {displayValue}
    </span>
  );
}
