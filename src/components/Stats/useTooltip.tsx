import { useCallback, useRef, useState } from 'react';

interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

// hover tooltip positioned inside a relative chart container
export function useTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const show = useCallback((target: HTMLElement, content: React.ReactNode) => {
    const box = containerRef.current?.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    if (!box) return;
    setTip({ x: rect.left + rect.width / 2 - box.left, y: rect.top - box.top, content });
  }, []);

  const hide = useCallback(() => setTip(null), []);

  const bind = (content: React.ReactNode) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget, content),
    onMouseLeave: hide,
    onFocus: (e: React.FocusEvent<HTMLElement>) => show(e.currentTarget, content),
    onBlur: hide,
  });

  const tooltip = tip && (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-[#2a2a2a] bg-[#111] px-3 py-2 text-xs text-neutral-300 shadow-lg"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      {tip.content}
    </div>
  );

  return { containerRef, bind, tooltip };
}
