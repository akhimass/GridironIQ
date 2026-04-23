const NAV = [
  "BIG_BOARD",
  "DRAFT_MATRIX",
  "SIMULATOR",
  "COMPARE",
  "SCENARIO_GEN",
  "PROSPECTS_DB",
  "R1_PROJECTOR",
  "TEAM_NEEDS",
  "OFFSEASON_INTEL",
  "MODEL_INTEL",
] as const;

export default function TopNav({
  activeModule,
  onModuleChange,
}: {
  activeModule: string;
  onModuleChange: (m: string) => void;
}) {
  return (
    <nav
      className="sticky top-0 z-50 flex h-12 items-center border-b border-white/[0.06] backdrop-blur-sm"
      style={{ background: "rgba(5,7,9,0.95)" }}
    >
      <div className="flex w-full items-center px-4">
        <div className="flex shrink-0 items-baseline gap-2 pr-4">
          <span className="font-display text-xl tracking-wide text-giq-gold">GRIDIRONIQ</span>
          <span className="font-mono text-[10px] text-giq-text3" style={{ letterSpacing: "0.1em" }}>
            NFL//2026
          </span>
        </div>
        <div className="mx-auto hidden flex-1 items-center justify-center overflow-x-auto lg:flex">
          {NAV.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModuleChange(m)}
              className={`border-r border-white/[0.03] px-2 py-3 font-mono text-[10px] tracking-[0.1em] transition-colors duration-150 ease last:border-r-0 ${
                activeModule === m
                  ? "border-b-2 border-b-giq-gold bg-giq-goldDim text-giq-gold"
                  : "text-giq-text2 hover:bg-giq-goldDim hover:text-giq-gold"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 pl-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-[2px] bg-giq-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-[2px] bg-giq-green" />
          </span>
          <span className="font-mono text-[10px] font-bold text-giq-green" style={{ letterSpacing: "0.08em" }}>
            LIVE
          </span>
        </div>
      </div>
    </nav>
  );
}
