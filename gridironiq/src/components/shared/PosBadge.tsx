import { posColorMap } from "@/lib/utils";

export function PosBadge({ pos }: { pos: string }) {
  const c = posColorMap[pos] ?? posColorMap.IDL;
  return (
    <span
      className="inline-block rounded-[2px] border px-[7px] py-[2px] font-mono text-[9px] font-bold tracking-[0.08em]"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {pos}
    </span>
  );
}
