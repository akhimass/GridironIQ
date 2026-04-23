import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { PosBadge } from "@/components/shared/PosBadge";
import { RankBadge } from "@/components/shared/RankBadge";
import { PROSPECTS_TOP_40, prospectById } from "@/data/prospects";
import { nflPickValue } from "@/lib/nflPickValue";

const SADIQ = "kenyon-sadiq";
const MESIDOR = "akheem-mesidor";
const MNW = "emmanuel-mcneil-warren";
const FANO = "spencer-fano";

type ScenarioKey = "A" | "B" | "C" | "D" | "E";

const HEADER: Record<ScenarioKey, { bar: string; title: string }> = {
  A: { bar: "bg-giq-green", title: "SCENARIO_A" },
  B: { bar: "bg-amber-500", title: "SCENARIO_B" },
  C: { bar: "bg-giq-cyan", title: "SCENARIO_C" },
  D: { bar: "bg-slate-700", title: "SCENARIO_D" },
  E: { bar: "bg-purple-500", title: "SCENARIO_E" },
};

export default function ScenarioGenerator() {
  const [gonePicks, setGonePicks] = useState<string[]>([]);

  const top25 = PROSPECTS_TOP_40.filter((p) => p.rank <= 25);

  const toggle = (id: string) => {
    setGonePicks((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  };

  const { scenarios, active, sadiqGone } = useMemo(() => {
    const sadiqGone = gonePicks.includes(SADIQ);
    const mesidorGone = gonePicks.includes(MESIDOR);
    const mnwGone = gonePicks.includes(MNW);

    const sadiq = prospectById(SADIQ)!;
    const mesidor = prospectById(MESIDOR)!;
    const mnw = prospectById(MNW)!;
    const fano = prospectById(FANO)!;

    const scen: {
      key: ScenarioKey;
      pick: typeof sadiq;
      why: string;
      offseason: string;
    }[] = [
      {
        key: "A",
        pick: sadiq,
        why: "Best case — elite TE1 traits on the board. Take immediately before a trade-up.",
        offseason:
          "Enabled by: Phillips signing (EDGE need reduced in transactions_2026.json → TE becomes clearer priority vs division TE gap).",
      },
      {
        key: "B",
        pick: !mesidorGone ? mesidor : mnw,
        why: sadiqGone
          ? "Sadiq gone — pivot to EDGE value (Mesidor) if available; otherwise coverage safety floor."
          : "Sadiq still available — scenario B is alternate EDGE priority if board pushes TE.",
        offseason:
          "Constrained when: Lloyd LB signing partially clears LB but leaves room for BPA; Phillips already lowered pure EDGE urgency.",
      },
      {
        key: "C",
        pick: mnw,
        why: "Both Sadiq + Mesidor gone — McNeil-Warren as safe coverage S with pro-ready instincts.",
        offseason: "Division_watch: TB/NO still carry WR needs — board may clear WRs early; S value rises.",
      },
      {
        key: "D",
        pick: fano,
        why: "All three gone — Spencer Fano OT stabilizes the room with positional flexibility.",
        offseason:
          "Walker 1yr OT bridge in override file keeps OT on the board after 2026 — Fano extends runway without solving long-term bookends.",
      },
      {
        key: "E",
        pick: sadiq,
        why: "Trade-up suggestion: jump BAL (14) if Sadiq is the last premium TE on the board.",
        offseason:
          "Pick capital unchanged in CAR row of pick_changes — trade math still driven by pick-value EV below.",
      },
    ];

    let activeKey: ScenarioKey = "A";
    if (!sadiqGone) activeKey = "A";
    else if (!mesidorGone) activeKey = "B";
    else if (!mnwGone) activeKey = "C";
    else activeKey = "D";

    return { scenarios: scen, active: activeKey, sadiqGone };
  }, [gonePicks]);

  const [tradeTo, setTradeTo] = useState(26);
  const [extraPicks, setExtraPicks] = useState("52,91");

  const ev = useMemo(() => {
    const cur = nflPickValue(19);
    const tgt = nflPickValue(tradeTo);
    const extras = extraPicks
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n))
      .reduce((acc, n) => acc + nflPickValue(n), 0);
    const gain = tgt + extras - cur;
    return { cur, tgt, extras, gain };
  }, [tradeTo, extraPicks]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader
        title="SCENARIO_GENERATOR // WAR_ROOM_DECISION_TREE"
        subtitle="SELECT WHICH PROSPECTS ARE GONE — SEE YOUR OPTIONS CHANGE"
      />
      <div className="grid flex-1 grid-cols-1 gap-3 p-4 lg:grid-cols-10">
        <div className="lg:col-span-4">
          <div className="mb-2 font-mono text-[10px] text-giq-gold">PROSPECTS GONE BEFORE YOUR PICK</div>
          <div className="max-h-[60vh] space-y-1 overflow-auto rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-2">
            {top25.map((p) => {
              const gone = gonePicks.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`flex w-full items-center gap-2 rounded-[2px] border border-white/[0.06] px-2 py-2 text-left font-mono text-[10px] transition-colors duration-150 ease hover:bg-giq-ink3 ${
                    gone ? "text-giq-red/80 line-through opacity-50" : "text-giq-text"
                  }`}
                >
                  <RankBadge rank={p.rank} />
                  <span className="flex-1">{p.name}</span>
                  <PosBadge pos={p.pos} />
                  <span className="text-giq-text3">{p.school}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="mb-2 font-mono text-[10px] text-giq-gold">LIVE SCENARIOS</div>
          <div className="space-y-2">
            {scenarios.map((s) => {
              const hiPrimary = s.key === active;
              const hiTrade = s.key === "E" && sadiqGone;
              return (
                <div
                  key={s.key}
                  className={`rounded-[2px] border bg-giq-ink2 ${
                    hiPrimary ? "border-giq-gold" : hiTrade ? "border-giq-cyan" : "border-white/[0.06]"
                  }`}
                >
                  <div className={`flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-giq-ink ${HEADER[s.key].bar}`}>
                    {HEADER[s.key].title}
                  </div>
                  <div className="p-3">
                    <div className="font-body text-lg font-semibold text-giq-text">{s.pick.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <PosBadge pos={s.pick.pos} />
                      <span className="font-mono text-[9px] text-giq-text3">{s.pick.school}</span>
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-giq-gold">
                      SIS {s.pick.sisGrade.toFixed(1)} — {s.pick.sisRole}
                    </div>
                    <p className="mt-2 font-mono text-[9px] text-giq-text2">{s.why}</p>
                    <div className="mt-3 rounded-[2px] border border-giq-cyan/25 bg-giq-ink3/80 p-2">
                      <div className="font-mono text-[8px] font-bold tracking-wide text-giq-cyan">OFFSEASON CONTEXT</div>
                      <p className="mt-1 font-mono text-[8px] leading-relaxed text-giq-text3">{s.offseason}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="mb-2 font-mono text-[10px] text-giq-gold">TRADE-DOWN EV (PICK_VALUE MODEL)</div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] text-giq-text2">
          <label className="flex items-center gap-2">
            CURRENT_PICK
            <input readOnly value={19} className="w-12 rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-1" />
          </label>
          <label className="flex items-center gap-2">
            TRADE_TO
            <input
              type="number"
              value={tradeTo}
              min={20}
              max={32}
              onChange={(e) => setTradeTo(parseInt(e.target.value, 10) || 26)}
              className="w-14 rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-1"
            />
          </label>
          <label className="flex flex-1 items-center gap-2">
            EXTRA_PICKS (comma rnds)
            <input
              value={extraPicks}
              onChange={(e) => setExtraPicks(e.target.value)}
              className="min-w-[120px] flex-1 rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-2 py-1"
            />
          </label>
        </div>
        <div className="mt-3 font-mono text-[11px] text-giq-text">
          EV_DELTA:{" "}
          <span className={ev.gain >= 0 ? "text-giq-green" : "text-giq-red"}>{ev.gain.toFixed(0)} pts</span> · REC:{" "}
          {ev.gain >= 0 ? "ACCEPT_STRUCTURE" : "HOLD_19"}
        </div>
      </div>
    </div>
  );
}
