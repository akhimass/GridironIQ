export function DraftClock({ value }: { value: number | null }) {
  if (value == null) return null;
  return <div className="mt-4 font-display text-5xl text-giq-gold">{value}</div>;
}
