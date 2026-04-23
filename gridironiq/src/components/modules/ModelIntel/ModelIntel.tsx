import { useEffect, useState } from "react";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { SISCitation } from "@/components/shared/SISCitation";
import { prospectById } from "@/data/prospects";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PIPE = [
  { n: "01", t: "DATA_INGESTION", bullets: ["nflverse feeds", "combine CSV", "CFBD snapshots"] },
  { n: "02", t: "TEAM_CONTEXT", bullets: ["needs graph", "scheme tags", "cap proxy"] },
  { n: "03", t: "PROSPECT_SCORING", bullets: ["ath index", "prod curves", "fit cosine"] },
  { n: "04", t: "FUSION_ENGINE", bullets: ["stacked gen", "RMU blend", "uncertainty"] },
  { n: "05", t: "OUTPUT_LAYER", bullets: ["boards", "sim cache", "exports"] },
] as const;

const BUGS = [
  { title: "CFBD_API", status: "OFFLINE", tone: "#e05252", desc: "Credential rotation pending — ingest paused." },
  { title: "COSINE_NORM", status: "FIX_NEEDED", tone: "#e05252", desc: "Vector drift on TE embeddings vs 2024 prior." },
  { title: "SNAP_DEPTH", status: "DEGEN", tone: "#e05252", desc: "Depth chart parser unstable on WSH/TEN swaps." },
  { title: "nflverse", status: "ACTIVE", tone: "#3ecf7a", desc: "PBP + rosters synced nightly." },
  { title: "XGB_MODEL", status: "LOADED", tone: "#3ecf7a", desc: "Holdout AUC 0.78 on stacked labels." },
  { title: "ADP_FALLBACK", status: "ACTIVE", tone: "#3ecf7a", desc: "Consensus board bridged for sparse FCS." },
] as const;

function MiniBars({
  name,
  pos,
  vals,
}: {
  name: string;
  pos: string;
  vals: { k: string; v: number }[];
}) {
  return (
    <div className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
      <div className="font-body text-sm font-semibold text-giq-text">
        {name} <span className="font-mono text-[9px] text-giq-text3">{pos}</span>
      </div>
      {vals.map(({ k, v }) => (
        <div key={k} className="mt-2">
          <div className="flex justify-between font-mono text-[8px] text-giq-text3">
            <span>{k}</span>
            <span>{v}</span>
          </div>
          <div className="mt-1 h-1 rounded-[2px] bg-giq-ink3">
            <div
              className="h-full rounded-[2px] bg-giq-gold/70 transition-[width] duration-[800ms] ease-out"
              style={{ width: `${v}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const rocPts = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.08, tpr: 0.22 },
  { fpr: 0.15, tpr: 0.41 },
  { fpr: 0.25, tpr: 0.58 },
  { fpr: 0.4, tpr: 0.72 },
  { fpr: 0.55, tpr: 0.81 },
  { fpr: 0.7, tpr: 0.9 },
  { fpr: 1, tpr: 1 },
];

export default function ModelIntel() {
  const [dash, setDash] = useState("0 400");
  useEffect(() => {
    const t = requestAnimationFrame(() => setDash("400 0"));
    return () => cancelAnimationFrame(t);
  }, []);

  const p1 = prospectById("jacob-rodriguez");
  const p2 = prospectById("kyle-louis");
  const p3 = prospectById("dani-dennis-sutton");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-giq-ink">
      <ModuleHeader title="MODEL_INTEL // SYSTEM_ARCHITECTURE" />

      <div className="border-b border-white/[0.06] p-4">
        <div className="font-mono text-[10px] text-giq-gold">// SCOUTING_PHILOSOPHY // SIS × GRIDIRONIQ</div>
        <div className="relative mx-auto mt-4 flex h-40 max-w-md items-center justify-center">
          <div
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-[65%] -translate-y-1/2 rounded-full border border-white/[0.08] opacity-90"
            style={{ background: "rgba(30,58,138,0.55)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-[35%] -translate-y-1/2 rounded-full border border-white/[0.08] opacity-90"
            style={{ background: "rgba(224,82,82,0.35)" }}
          />
          <div
            className="relative z-10 rounded-[2px] border border-white/[0.12] px-3 py-2 font-mono text-[10px] font-bold text-giq-text"
            style={{ background: "rgba(147,51,234,0.35)" }}
          >
            GIQ
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-lg font-mono text-[9px] leading-relaxed text-giq-text2">
          GridironIQ bridges the eye test and analytics — scouting trait grades fused with nflverse data signals. We do not believe in
          a conflict between scouting and statistics. Source: SIS methodology — nfldraft.sportsinfosolutions.com
        </p>
        <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-4">
          {[
            ["1", "SCOUT_SCHOOL"],
            ["2", "EVALUATE_PROSPECTS"],
            ["3", "REFINE_REPORTS"],
            ["4", "FINALIZE_RANKINGS"],
          ].map(([n, lab]) => (
            <div key={lab} className="flex w-[100px] flex-col items-center gap-1 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-giq-gold/40 bg-giq-ink2 font-mono text-sm text-giq-gold">
                {n}
              </div>
              <span className="font-mono text-[8px] text-giq-text3">{lab}</span>
            </div>
          ))}
        </div>
        <SISCitation className="mt-4" />
      </div>

      <div className="overflow-x-auto border-b border-white/[0.06] p-4">
        <div className="flex min-w-[900px] items-stretch gap-2">
          {PIPE.map((s, i) => (
            <div key={s.t} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
                <div className="font-mono text-[9px] text-giq-gold">{s.n}</div>
                <div className="font-mono text-[11px] text-giq-text">{s.t}</div>
                <ul className="mt-2 list-inside list-disc font-mono text-[9px] text-giq-text3">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              {i < PIPE.length - 1 ? <span className="font-mono text-giq-text3">→</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
        {BUGS.map((b) => (
          <div key={b.title} className="rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-giq-text">{b.title}</span>
              <span className="rounded-[2px] px-1 font-mono text-[8px]" style={{ background: `${b.tone}22`, color: b.tone }}>
                {b.status}
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] text-giq-text3">{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="mb-2 font-mono text-[10px] text-giq-gold">HOLDOUT_ROC (STACKED_ENSEMBLE)</div>
        <div className="h-48 w-full rounded-[2px] border border-white/[0.06] bg-giq-ink2 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rocPts} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" dataKey="fpr" domain={[0, 1]} stroke="#3d4f66" tick={{ fill: "#7d8fa8", fontSize: 9 }} />
              <YAxis type="number" dataKey="tpr" domain={[0, 1]} stroke="#3d4f66" tick={{ fill: "#7d8fa8", fontSize: 9 }} />
              <Tooltip contentStyle={{ background: "#0a0d14", border: "1px solid rgba(255,255,255,0.06)", fontSize: 10 }} />
              <Line type="monotone" dataKey="tpr" stroke="#d4a843" strokeWidth={1.5} dot={false} strokeDasharray={dash} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
        {p1 ? (
          <MiniBars
            name={p1.name}
            pos={p1.pos}
            vals={[
              { k: "ATH", v: p1.athleticism },
              { k: "PROD", v: p1.production },
              { k: "EFF", v: p1.efficiency },
              { k: "SCHEME", v: p1.schemeFit },
              { k: "NEED", v: p1.teamNeed },
            ]}
          />
        ) : null}
        {p2 ? (
          <MiniBars
            name={p2.name}
            pos={p2.pos}
            vals={[
              { k: "ATH", v: p2.athleticism },
              { k: "PROD", v: p2.production },
              { k: "EFF", v: p2.efficiency },
              { k: "SCHEME", v: p2.schemeFit },
              { k: "NEED", v: p2.teamNeed },
            ]}
          />
        ) : null}
        {p3 ? (
          <MiniBars
            name={p3.name}
            pos={p3.pos}
            vals={[
              { k: "ATH", v: p3.athleticism },
              { k: "PROD", v: p3.production },
              { k: "EFF", v: p3.efficiency },
              { k: "SCHEME", v: p3.schemeFit },
              { k: "NEED", v: p3.teamNeed },
            ]}
          />
        ) : null}
        <MiniBars
          name="Genesis Smith"
          pos="WR"
          vals={[
            { k: "ATH", v: 74 },
            { k: "PROD", v: 69 },
            { k: "EFF", v: 71 },
            { k: "SCHEME", v: 66 },
            { k: "NEED", v: 58 },
          ]}
        />
      </div>
    </div>
  );
}
