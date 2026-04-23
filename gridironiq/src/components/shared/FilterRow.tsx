import { cn } from "@/lib/utils";

export function FilterRow({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-giq-ink2 px-4 py-2.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "shrink-0 cursor-pointer rounded-[2px] border px-2 py-1 font-mono text-[9px] transition-colors duration-150 ease",
            active === o
              ? "border-giq-gold bg-giq-goldDim text-giq-gold"
              : "border-white/[0.06] text-giq-text2 hover:border-white/20 hover:text-giq-text"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
