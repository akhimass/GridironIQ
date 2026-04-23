export function ScoreBar({ score, maxWidth = 60 }: { score: number; maxWidth?: number }) {
  const w = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 rounded-[2px] bg-giq-ink3"
        style={{ width: maxWidth, border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-[2px] bg-gradient-to-r from-giq-gold/40 to-giq-gold2"
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="font-mono text-[9px] font-bold text-giq-gold2">{score.toFixed(1)}</span>
    </div>
  );
}
