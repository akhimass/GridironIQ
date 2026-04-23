export function SectionBreak({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-3 border-b border-white/[0.06] px-6 pb-3 pt-5"
      style={{ padding: "20px 24px 12px" }}
    >
      <span className="shrink-0 font-mono text-[9px] tracking-[0.18em] text-giq-text3">
        <span className="text-giq-gold">// </span>
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.03]" />
    </div>
  );
}
