import { useCallback, useEffect, useState } from "react";
import BootScreen from "@/components/layout/BootScreen";
import TopNav from "@/components/layout/TopNav";
import Ticker from "@/components/layout/Ticker";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import BigBoard from "@/components/modules/BigBoard/BigBoard";
import Simulator from "@/components/modules/Simulator/Simulator";
import ScenarioGenerator from "@/components/modules/ScenarioGenerator/ScenarioGenerator";
import ProspectDatabase from "@/components/modules/ProspectDatabase/ProspectDatabase";
import Compare from "@/components/modules/Compare/Compare";
import R1Projector from "@/components/modules/R1Projector/R1Projector";
import TeamNeeds from "@/components/modules/TeamNeeds/TeamNeeds";
import OffseasonIntel from "@/components/modules/OffseasonIntel/OffseasonIntel";
import ModelIntel from "@/components/modules/ModelIntel/ModelIntel";
import DraftMatrix from "@/components/modules/DraftMatrix/DraftMatrix";
import type { Prospect } from "@/data/prospects";

export default function App() {
  const [booted, setBooted] = useState(false);
  const [activeModule, setActiveModule] = useState("BIG_BOARD");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [compareSlotAId, setCompareSlotAId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setBooted(true), 2900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (activeModule !== "COMPARE") setCompareSlotAId(null);
  }, [activeModule]);

  const useThreeCol = [
    "BIG_BOARD",
    "TEAM_NEEDS",
    "MODEL_INTEL",
    "R1_PROJECTOR",
    "DRAFT_MATRIX",
    "OFFSEASON_INTEL",
  ].includes(activeModule);

  const openCompareFromBoard = useCallback((p: Prospect) => {
    setCompareSlotAId(p.id);
    setActiveModule("COMPARE");
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "BIG_BOARD":
        return <BigBoard onSelectProspect={setSelectedProspect} onOpenCompare={openCompareFromBoard} />;
      case "SIMULATOR":
        return <Simulator />;
      case "COMPARE":
        return <Compare seedPlayerAId={compareSlotAId} />;
      case "SCENARIO_GEN":
        return <ScenarioGenerator />;
      case "PROSPECTS_DB":
        return <ProspectDatabase onSelectProspect={setSelectedProspect} />;
      case "R1_PROJECTOR":
        return <R1Projector />;
      case "TEAM_NEEDS":
        return <TeamNeeds />;
      case "MODEL_INTEL":
        return <ModelIntel />;
      case "DRAFT_MATRIX":
        return <DraftMatrix />;
      case "OFFSEASON_INTEL":
        return <OffseasonIntel />;
      default:
        return <BigBoard onSelectProspect={setSelectedProspect} onOpenCompare={openCompareFromBoard} />;
    }
  };

  return (
    <>
      {!booted && <BootScreen />}
      <TopNav activeModule={activeModule} onModuleChange={setActiveModule} />
      <Ticker />
      <div className="flex" style={{ minHeight: "calc(100vh - 76px)" }}>
        <LeftPanel activeModule={activeModule} onModuleChange={setActiveModule} />
        <main className="flex-1 overflow-x-hidden" style={{ background: "#050709" }}>
          {renderModule()}
        </main>
        {useThreeCol ? <RightPanel prospect={selectedProspect} /> : null}
      </div>
      <footer
        className="flex items-center gap-4 px-6 py-4"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0d14",
        }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: 18,
            color: "#d4a843",
            letterSpacing: "0.08em",
          }}
        >
          GRIDIRONIQ
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: 9,
            color: "#3d4f66",
            letterSpacing: "0.08em",
          }}
        >
          NFL DRAFT INTELLIGENCE PLATFORM · v2.0 · 2026
          <br />
          DATA: nflverse · ESPN Scouts Inc. · CFBD · RMU SAC HACKATHON · SIS: nfldraft.sportsinfosolutions.com
        </span>
        <div className="ml-auto flex gap-4">
          {["BIG_BOARD", "MODEL_DOCS", "GITHUB", "API_DOCS", "RMU_SAC"].map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: 9,
                color: "#3d4f66",
                textDecoration: "none",
                letterSpacing: "0.1em",
              }}
              onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#d4a843")}
              onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#3d4f66")}
            >
              {l}
            </a>
          ))}
        </div>
      </footer>
    </>
  );
}
