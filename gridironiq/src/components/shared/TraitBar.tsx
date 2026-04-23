import { useEffect, useState } from "react";

export function TraitBar({ trait, grade }: { trait: string; grade: number }) {
  const color = grade >= 7 ? "#f97316" : grade >= 6 ? "#d4a843" : grade >= 5 ? "#7d8fa8" : "#e05252";
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(Math.min(100, Math.max(0, (grade / 9) * 100))));
    return () => cancelAnimationFrame(t);
  }, [grade]);

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.03] py-1.5">
      <span className="w-32 flex-shrink-0 font-mono text-[9px] tracking-wider text-giq-text3">{trait.toUpperCase()}</span>
      <div className="h-[3px] flex-1 overflow-hidden rounded-sm bg-giq-ink3">
        <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
      <span className="w-4 text-right font-mono text-[10px] font-bold" style={{ color }}>
        {grade}
      </span>
    </div>
  );
}
