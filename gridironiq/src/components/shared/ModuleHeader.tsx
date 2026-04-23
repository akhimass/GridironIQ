import type { ReactNode } from "react";

export function ModuleHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className="flex items-center gap-2 border-b border-white/[0.06] bg-giq-ink2 px-6 py-3.5"
      style={{ padding: "14px 24px" }}
    >
      <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-giq-text">
        <span className="text-giq-gold">// </span>
        {title}
      </h2>
      {subtitle ? (
        <span className="ml-auto font-mono text-[9px] text-giq-text3">{subtitle}</span>
      ) : null}
      {actions ? <div className="ml-auto flex gap-1.5">{actions}</div> : null}
    </header>
  );
}
