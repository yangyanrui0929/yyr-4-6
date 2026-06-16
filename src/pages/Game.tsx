import { useGameStore } from "@/store/useGameStore";
import TopBar from "@/components/TopBar";
import ShopPanel from "@/components/day/ShopPanel";
import MenuPanel from "@/components/day/MenuPanel";
import DaySidebar from "@/components/day/DaySidebar";
import TowerSelect from "@/components/night/TowerSelect";
import Battlefield from "@/components/night/Battlefield";
import TowerInfo from "@/components/night/TowerInfo";
import WaveInfo from "@/components/night/WaveInfo";
import SettlementModal from "@/components/SettlementModal";

export default function Game() {
  const { phase, gameOver } = useGameStore();

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        phase === "night"
          ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950"
          : "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100"
      }`}
    >
      <TopBar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {phase === "day" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3">
              <ShopPanel />
            </div>
            <div className="lg:col-span-6">
              <MenuPanel />
            </div>
            <div className="lg:col-span-3">
              <DaySidebar />
            </div>
          </div>
        )}

        {phase === "night" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <TowerSelect />
              <TowerInfo />
            </div>
            <div className="lg:col-span-6 flex flex-col items-center justify-start">
              <Battlefield />
            </div>
            <div className="lg:col-span-3">
              <WaveInfo />
            </div>
          </div>
        )}
      </main>

      {(phase === "settlement" || gameOver) && <SettlementModal />}
    </div>
  );
}
