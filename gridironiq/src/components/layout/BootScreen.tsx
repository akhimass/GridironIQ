import { useEffect, useState } from "react";

const LINES: { text: string; color: "green" | "gold" | "cyan" | "display" }[] = [
  { text: "SYS.INIT // GRIDIRONIQ_PLATFORM v2.0", color: "green" },
  { text: "LOADING: nflverse_pbp_epa .............. OK", color: "green" },
  { text: "LOADING: combine_athleticism_model ..... OK", color: "green" },
  { text: "LOADING: rmu_sac_training_data ......... OK", color: "gold" },
  { text: "RUNNING: logistic_regression + xgb ..... OK", color: "green" },
  { text: "MODULES: big_board / simulator / compare ONLINE", color: "cyan" },
  { text: "GRIDIRONIQ", color: "display" },
];

export default function BootScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2900);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[8000] flex flex-col items-center justify-center bg-giq-ink"
      style={{ background: "#050709" }}
    >
      <div className="flex max-w-lg flex-col gap-2 px-8">
        {LINES.map((line, i) => (
          <div
            key={i}
            className="text-center font-mono text-[11px] tracking-wide"
            style={{
              opacity: 0,
              animation: `bootLine 0.4s ease forwards`,
              animationDelay: `${i * 0.2}s`,
              color:
                line.color === "gold"
                  ? "#d4a843"
                  : line.color === "cyan"
                    ? "#29b8e0"
                    : line.color === "display"
                      ? "#3ecf7a"
                      : "#3ecf7a",
              fontFamily: line.color === "display" ? "'Bebas Neue', sans-serif" : "'Share Tech Mono', monospace",
              fontSize: line.color === "display" ? 28 : 11,
              letterSpacing: line.color === "display" ? "0.2em" : "0.06em",
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes bootLine {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
