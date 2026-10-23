import { useLayoutEffect, useRef, useState } from 'react';

export default function OverflowTableContainer({ className, children }) {
  const containerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const overflowing =
        container.scrollWidth > container.clientWidth + 1 ||
        container.scrollHeight > container.clientHeight + 1;
      setHasOverflow(current => (current === overflowing ? current : overflowing));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (container.firstElementChild) observer.observe(container.firstElementChild);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  });

  return (
    <div
      ref={containerRef}
      className={`${className}${hasOverflow ? ' has-overflow' : ''}`}
    >
      {children}
    </div>
  );
}
