import { cn } from "@/lib/utils";

type Item = { id: string; label: string; badge?: string; badgeTone?: "gold" | "green" | "cyan" };

const BOARD: Item[] = [
  { id: "BIG_BOARD", label: "BIG_BOARD", badge: "32", badgeTone: "gold" },
  { id: "DRAFT_MATRIX", label: "DRAFT_MATRIX", badge: "SIS", badgeTone: "gold" },
  { id: "OFFSEASON_INTEL", label: "OFFSEASON_INTEL", badge: "FA", badgeTone: "cyan" },
  { id: "R1_PROJECTOR", label: "R1_PROJECTIONS" },
  { id: "PROSPECTS_DB", label: "PROSPECTS_DB" },
  { id: "SIMULATOR", label: "SIMULATOR" },
  { id: "COMPARE", label: "COMPARE" },
];

const ANALYTICS: Item[] = [
  { id: "MODEL_INTEL", label: "MODEL_INTEL", badge: "NEW", badgeTone: "green" },
  { id: "TEAM_NEEDS", label: "TEAM_NEEDS" },
  { id: "MODEL_INTEL", label: "SCHEME_FIT" },
  { id: "MODEL_INTEL", label: "COMBINE_LAB", badge: "BETA", badgeTone: "cyan" },
  { id: "R1_PROJECTOR", label: "TREND_SIGNALS" },
];

const SCENARIO: Item[] = [
  { id: "SCENARIO_GEN", label: "SCENARIO_GEN", badge: "NEW", badgeTone: "green" },
  { id: "SCENARIO_GEN", label: "TRADE_VALUE" },
  { id: "SIMULATOR", label: "WAR_ROOM" },
  { id: "SIMULATOR", label: "AVAILABILITY_SIM" },
];

const POS = ["ALL", "QB", "WR", "RB", "EDGE", "OT", "DB", "LB"];

function NavBlock({
  title,
  items,
  activeModule,
  onModuleChange,
}: {
  title: string;
  items: Item[];
  activeModule: string;
  onModuleChange: (m: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-giq-gold">
        // {title}
      </div>
      {items.map((it) => (
        <button
          key={`${title}-${it.label}-${it.id}`}
          type="button"
          onClick={() => onModuleChange(it.id)}
          className={cn(
            "flex w-full items-center gap-2 border-l-2 border-transparent py-2 pl-4 pr-3 text-left font-mono text-[11px] text-giq-text2 transition-colors duration-150 ease hover:border-white/[0.06] hover:bg-giq-ink3 hover:text-giq-text",
            activeModule === it.id && "border-l-giq-gold bg-giq-goldDim text-giq-gold"
          )}
          style={{ padding: "9px 16px" }}
        >
          <span className="flex-1 tracking-wide">{it.label}</span>
          {it.badge ? (
            <span
              className={cn(
                "rounded-[2px] px-1 font-mono text-[8px] font-bold text-giq-ink",
                it.badgeTone === "green" && "bg-giq-green",
                it.badgeTone === "cyan" && "bg-giq-cyan text-giq-ink",
                (!it.badgeTone || it.badgeTone === "gold") && "bg-giq-gold text-giq-ink"
              )}
            >
              {it.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export default function LeftPanel({
  activeModule,
  onModuleChange,
}: {
  activeModule: string;
  onModuleChange: (m: string) => void;
}) {
  return (
    <aside
      className="hidden w-[220px] shrink-0 border-r border-white/[0.06] bg-giq-ink2 md:block"
      style={{ width: 220, background: "#0a0d14" }}
    >
      <div className="h-3" />
      <NavBlock title="BOARD_MODULES" items={BOARD} activeModule={activeModule} onModuleChange={onModuleChange} />
      <NavBlock title="ANALYTICS" items={ANALYTICS} activeModule={activeModule} onModuleChange={onModuleChange} />
      <NavBlock title="SCENARIO_TOOLS" items={SCENARIO} activeModule={activeModule} onModuleChange={onModuleChange} />
      <div className="px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-giq-gold">// POSITION_FILTER</div>
      <div className="px-2 pb-4">
        {POS.map((p) => (
          <div key={p} className="py-1 pl-2 font-mono text-[10px] text-giq-text2">
            {p === "ALL" ? "— ALL_POSITIONS" : p}
            {p === "DB" ? (
              <span className="ml-1 text-[8px] text-giq-text3">(CB/S)</span>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
