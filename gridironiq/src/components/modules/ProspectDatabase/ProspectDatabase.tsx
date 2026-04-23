import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { FilterRow } from "@/components/shared/FilterRow";
import { PosBadge } from "@/components/shared/PosBadge";
import { ProbPill } from "@/components/shared/ProbPill";
import { RankBadge } from "@/components/shared/RankBadge";
import { Button } from "@/components/ui/button";
import { PROSPECTS, type Prospect } from "@/data/prospects";
import { ProspectDetailModal } from "./ProspectDetailModal";

const POS = ["ALL", "QB", "WR", "RB", "TE", "EDGE", "OT", "IOL", "CB", "S", "LB", "IDL"];
const CONF = ["ALL", "SEC", "B10", "B12", "ACC", "Other"];

type SortKey = "rank" | "giqScore" | "forty" | "r1Prob" | "athleticism";

export default function ProspectDatabase({
  onSelectProspect,
}: {
  onSelectProspect: (p: Prospect) => void;
}) {
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState("ALL");
  const [conf, setConf] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [modal, setModal] = useState<Prospect | null>(null);

  const rows = useMemo(() => {
    let list = [...PROSPECTS];
    if (pos !== "ALL") list = list.filter((p) => p.pos === pos);
    if (conf === "Other") list = list.filter((p) => !["SEC", "B10", "B12", "ACC", "Pac-12"].includes(p.conf));
    else if (conf !== "ALL") list = list.filter((p) => p.conf === conf);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.school.toLowerCase().includes(q));
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return 0;
    });
    return list;
  }, [search, pos, conf, sortBy, sortDir]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader
        title="PROSPECTS_DB // FULL_CLASS"
        actions={
          <div className="flex gap-1">
            <Button type="button" size="sm" variant={view === "cards" ? "gold" : "ghost"} onClick={() => setView("cards")}>
              CARDS
            </Button>
            <Button type="button" size="sm" variant={view === "table" ? "gold" : "ghost"} onClick={() => setView("table")}>
              TABLE
            </Button>
          </div>
        }
      />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="SEARCH_PROSPECTS..."
        className="mx-4 mt-2 rounded-[2px] border border-white/[0.06] bg-giq-ink2 px-3 py-2 font-mono text-[11px]"
      />
      <FilterRow options={POS} active={pos} onChange={setPos} />
      <FilterRow options={CONF} active={conf} onChange={setConf} />

      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-2 font-mono text-[10px] text-giq-text2">
        <span>SORT_BY:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-[2px] border border-white/[0.06] bg-giq-ink3 px-2 py-1"
        >
          {(["rank", "giqScore", "forty", "r1Prob", "athleticism"] as const).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="ghost" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
          {sortDir.toUpperCase()}
        </Button>
      </div>

      {view === "cards" ? (
        <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelectProspect(p);
                setModal(p);
              }}
              className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3 text-left transition-colors duration-150 ease hover:border-giq-gold/40"
            >
              <div className="flex items-center gap-2">
                <PosBadge pos={p.pos} />
                <RankBadge rank={p.rank} />
                <span className="font-display text-lg text-giq-text">{p.name}</span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-giq-text3">
                {p.school} · {p.conf}
              </div>
              <div className="mt-2 font-display text-3xl text-giq-gold">{p.giqScore.toFixed(1)}</div>
              <div className="mt-1 font-mono text-[9px] text-giq-gold">
                SIS {p.sisGrade.toFixed(1)} — {p.sisRole}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[9px]">
                {[
                  ["40_YD", p.forty != null ? p.forty.toFixed(2) : "—"],
                  ["R1_PROB", ""],
                  ["ATH", String(p.athleticism)],
                  ["SIS", p.sisGrade.toFixed(1)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-[2px] bg-giq-ink3 p-2">
                    <div className="text-giq-text3">{k}</div>
                    {k === "R1_PROB" ? <ProbPill prob={p.r1Prob} /> : <div className="text-giq-text">{v}</div>}
                  </div>
                ))}
              </div>
              <p className="mt-2 line-clamp-3 font-mono text-[9px] text-giq-text2">{p.notes}</p>
              <div className="mt-2 font-mono text-[9px] text-giq-gold">VIEW_DETAILS →</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-2">
          <table className="w-full font-mono text-[10px]">
            <thead className="sticky top-0 bg-giq-ink2 text-giq-text3">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">NAME</th>
                <th className="p-2">POS</th>
                <th className="p-2">GIQ</th>
                <th className="p-2">R1</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    onSelectProspect(p);
                    setModal(p);
                  }}
                  className="cursor-pointer border-b border-white/[0.03] hover:bg-giq-ink3"
                >
                  <td className="p-2">{p.rank}</td>
                  <td className="p-2 font-body font-semibold text-giq-text">{p.name}</td>
                  <td className="p-2">
                    <PosBadge pos={p.pos} />
                  </td>
                  <td className="p-2 text-giq-gold">{p.giqScore.toFixed(1)}</td>
                  <td className="p-2">
                    <ProbPill prob={p.r1Prob} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProspectDetailModal prospect={modal} open={!!modal} onOpenChange={(o) => !o && setModal(null)} />
    </div>
  );
}
