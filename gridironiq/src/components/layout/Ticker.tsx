import { PROSPECTS_TOP_40 } from "@/data/prospects";

function TickerSpan() {
  return (
    <>
      {PROSPECTS_TOP_40.map((p) => (
        <span key={p.id} className="mr-8 inline-flex items-center gap-1 font-mono text-[9px]">
          <span className="text-giq-gold">{p.pos}</span>
          <span className="text-giq-text2">·</span>
          <span className="text-giq-text">{p.name}</span>
          <span className="text-giq-text2">·</span>
          <span className="text-giq-green">{p.giqScore.toFixed(1)}</span>
        </span>
      ))}
    </>
  );
}

export default function Ticker() {
  return (
    <div
      className="flex h-7 items-stretch overflow-hidden border-b border-white/[0.06] bg-giq-ink2"
      style={{ height: 28 }}
    >
      <div
        className="flex shrink-0 items-center border-r border-white/[0.06] px-2 font-mono text-[9px] font-bold text-giq-gold"
        style={{ background: "rgba(212,168,67,0.10)" }}
      >
        LIVE_FEED
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="animate-ticker font-mono" style={{ lineHeight: "28px" }}>
          <TickerSpan />
          <TickerSpan />
        </div>
      </div>
    </div>
  );
}
