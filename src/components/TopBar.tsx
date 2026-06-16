import { useGameStore } from "@/store/useGameStore";
import { Sun, Moon, Save, RotateCcw, Heart, Coins, Calendar } from "lucide-react";

export default function TopBar() {
  const {
    day,
    phase,
    gold,
    lives,
    saveProgress,
    resetGame,
  } = useGameStore();

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-kitchen-brown to-amber-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍳</span>
          <h1 className="font-display text-2xl tracking-wide">
            机关厨房塔防
          </h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">第 {day} 天</span>
          </div>

          <div className="flex items-center gap-1.5 bg-yellow-500/20 rounded-full px-4 py-1.5">
            <Coins className="w-4 h-4 text-yellow-300" />
            <span className="font-bold text-yellow-200">{gold}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-500/20 rounded-full px-4 py-1.5">
            <Heart className="w-4 h-4 text-red-300 fill-red-300" />
            <span className="font-bold text-red-200">{lives}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-500/20 rounded-full px-4 py-1.5">
            {phase === "day" ? (
              <>
                <Sun className="w-4 h-4 text-yellow-300" />
                <span className="font-medium">☀️ 白天经营</span>
              </>
            ) : phase === "night" ? (
              <>
                <Moon className="w-4 h-4 text-blue-200" />
                <span className="font-medium">🌙 夜晚塔防</span>
              </>
            ) : (
              <span className="font-medium">📊 结算中</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
          <button
            onClick={() => {
              if (confirm("确定要重新开始游戏吗？所有进度将丢失！")) {
                resetGame();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            重开
          </button>
        </div>
      </div>
    </div>
  );
}
