import { useEffect, useMemo, useState } from "react";

export type RadarScores = {
  ath: number;
  prod: number;
  eff: number;
  scheme: number;
  need: number;
  cmb: number;
};

const LABELS = ["ATH", "PROD", "EFF", "SCH", "NEED", "CMB"] as const;
const DEG = [0, 60, 120, 180, 240, 300];

function pt(cx: number, cy: number, r: number, deg: number) {
  const rad = (Math.PI / 180) * deg;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)] as const;
}

export function RadarChart({ scores }: { scores: RadarScores }) {
  const vals = [scores.ath, scores.prod, scores.eff, scores.scheme, scores.need, scores.cmb];
  const cx = 90;
  const cy = 90;
  const R = 50;

  const dataPoly = useMemo(() => {
    return DEG.map((d, i) => {
      const rr = (vals[i] / 100) * R;
      const [x, y] = pt(cx, cy, rr, d);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [vals]);

  const len = useMemo(() => {
    let p = 0;
    for (let i = 0; i < 6; i++) {
      const d0 = DEG[i];
      const d1 = DEG[(i + 1) % 6];
      const r0 = (vals[i] / 100) * R;
      const r1 = (vals[(i + 1) % 6] / 100) * R;
      const [x0, y0] = pt(cx, cy, r0, d0);
      const [x1, y1] = pt(cx, cy, r1, d1);
      p += Math.hypot(x1 - x0, y1 - y0);
    }
    return p;
  }, [vals]);

  const [dash, setDash] = useState("0 " + len);

  useEffect(() => {
    const t = requestAnimationFrame(() => setDash(`${len} ${len}`));
    return () => cancelAnimationFrame(t);
  }, [len]);

  const rings = [R * 0.33, R * 0.66, R];

  return (
    <svg viewBox="0 0 180 180" width={180} height={180} className="mx-auto">
      {rings.map((rr) => (
        <polygon
          key={rr}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
          points={DEG.map((d) => {
            const [x, y] = pt(cx, cy, rr, d);
            return `${x},${y}`;
          }).join(" ")}
        />
      ))}
      {DEG.map((d) => {
        const [x, y] = pt(cx, cy, R, d);
        return (
          <line
            key={d}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        fill="rgba(212,168,67,0.15)"
        stroke="#d4a843"
        strokeWidth={1.5}
        strokeDasharray={dash}
        strokeLinejoin="miter"
        points={dataPoly}
      />
      {DEG.map((d, i) => {
        const rr = (vals[i] / 100) * R;
        const [x, y] = pt(cx, cy, rr, d);
        return <circle key={d} cx={x} cy={y} r={3} fill="#d4a843" />;
      })}
      {DEG.map((d, i) => {
        const [lx, ly] = pt(cx, cy, R + 14, d);
        return (
          <text
            key={`l-${d}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#7d8fa8"
            className="font-mono"
            style={{ fontSize: 8 }}
          >
            {LABELS[i]}
          </text>
        );
      })}
    </svg>
  );
}
