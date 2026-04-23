export function SISCitation({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block font-mono text-[8px] text-giq-text3 ${className}`}
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      SOURCE: SPORTS INFO SOLUTIONS · nfldraft.sportsinfosolutions.com
    </span>
  );
}
