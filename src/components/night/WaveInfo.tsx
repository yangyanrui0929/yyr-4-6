import { useGameStore } from "@/store/useGameStore";
import { ENEMY_CONFIGS } from "@/game/config";
import Card from "@/components/common/Card";
import { Play, Pause } from "lucide-react";

export default function WaveInfo() {
  const {
    currentWave,
    totalWaves,
    waveInProgress,
    isPaused,
    enemies,
    gold,
    lives,
    startWave,
    nextWave,
    togglePause,
    getCurrentWaves,
    waveReward,
  } = useGameStore();

  const waves = getCurrentWaves();
  const currentWaveData = waves[currentWave];
  const isLastWave = currentWave >= totalWaves - 1;
  const canStartNext = !waveInProgress && currentWave < totalWaves;

  return (
    <Card title="波次信息" icon="⚔️" className="h-full">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">当前波次</span>
          <span className="font-display text-2xl text-kitchen-warm">
            {Math.min(currentWave + 1, totalWaves)} / {totalWaves}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-kitchen-warm to-red-500 transition-all duration-500"
            style={{
              width: `${totalWaves > 0 ? ((currentWave + (waveInProgress ? 1 : 0)) / totalWaves) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-2">
          {waveInProgress ? "🟢 进行中..." : canStartNext ? `⚔️ 第 ${currentWave + 1} 波` : "✅ 已完成"}
        </div>
        {currentWaveData && (
          <div className="flex flex-wrap gap-2">
            {currentWaveData.enemies.map((e, i) => {
              const cfg = ENEMY_CONFIGS[e.type];
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs shadow-sm"
                >
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="font-bold">x{e.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-red-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">场上敌人</div>
          <div className="font-bold text-xl text-red-600">{enemies.length}</div>
        </div>
        <div className="p-2 bg-yellow-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">本波奖励</div>
          <div className="font-bold text-xl text-yellow-600">💰{waveReward}</div>
        </div>
      </div>

      <div className="space-y-2">
        {canStartNext && (
          <button
            onClick={() => {
              if (!waveInProgress) {
                startWave();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-kitchen-chili to-red-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all animate-pulse-soft"
          >
            <Play className="w-5 h-5 fill-current" />
            开始第{currentWave + 1}波
          </button>
        )}

        {waveInProgress && (
          <button
            onClick={togglePause}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
              isPaused
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-5 h-5" />
                继续
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" />
                暂停
              </>
            )}
          </button>
        )}

        {isLastWave && !waveInProgress && currentWave >= totalWaves && (
          <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-green-700">所有波次完成！</div>
            <div className="text-sm text-green-600 mt-1">即将进入结算...</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
        <div>💰 当前金币: <span className="font-bold text-yellow-600">{gold}</span></div>
        <div>❤️ 当前生命: <span className="font-bold text-red-600">{lives}</span></div>
      </div>
    </Card>
  );
}
