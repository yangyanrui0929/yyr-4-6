import { useGameStore, getTowerStats } from "@/store/useGameStore";
import { TOWER_CONFIGS, FLAVOR_INFO, REACTION_CONFIGS } from "@/game/config";
import Card from "@/components/common/Card";
import { ArrowUp, Trash2, X } from "lucide-react";

export default function TowerInfo() {
  const { selectedTowerId, towers, gold, upgradeTower, sellTower, selectTower, baseFlavors } =
    useGameStore();

  const tower = towers.find((t) => t.id === selectedTowerId);

  if (!tower) {
    return (
      <Card title="塔信息" icon="ℹ️" className="h-full">
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🔍</div>
          <div>点击已放置的塔查看详情</div>
        </div>
      </Card>
    );
  }

  const config = TOWER_CONFIGS[tower.type];
  const stats = getTowerStats(tower);

  let totalCost = config.cost;
  for (let l = 1; l < tower.level; l++) {
    totalCost += Math.floor(
      config.upgradeCost * Math.pow(config.upgradeMultiplier, l - 1)
    );
  }
  const refund = Math.floor(totalCost * 0.6);

  const canUpgrade = tower.level < 5 && gold >= stats.upgradeCost;

  return (
    <Card title="塔信息" icon="ℹ️" className="h-full">
      <div className="flex justify-end">
        <button
          onClick={() => selectTower(null)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
        <span className="text-4xl">{config.emoji}</span>
        <div>
          <div className="font-bold text-lg text-kitchen-brown">
            {config.name}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < tower.level ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">💥 伤害</span>
          <span className="font-bold text-red-600">{stats.damage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">📏 射程</span>
          <span className="font-bold text-blue-600">{stats.range}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">⚡ 攻速</span>
          <span className="font-bold text-purple-600">
            {(1000 / stats.fireRate).toFixed(1)}/秒
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">✨ 特效</span>
          <span className="font-medium text-kitchen-warm">{config.special}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">🍽️ 味型</span>
          <div className="flex gap-1">
            {config.flavors.map((f) => (
              <span
                key={f}
                className="text-lg"
                style={{ color: FLAVOR_INFO[f].color }}
                title={FLAVOR_INFO[f].name + "味"}
              >
                {FLAVOR_INFO[f].emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {baseFlavors.length > 0 && (
        <div className="mb-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xs text-purple-700 font-medium mb-1">⚡ 可触发反应</div>
          <div className="space-y-1">
            {Object.values(REACTION_CONFIGS)
              .filter((r) => {
                const allFlavors = new Set([...baseFlavors, ...config.flavors]);
                return r.flavors.every((f) => allFlavors.has(f));
              })
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-1 text-xs text-purple-800"
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => upgradeTower(tower.id)}
          disabled={!canUpgrade}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
            canUpgrade
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow hover:shadow-lg hover:-translate-y-0.5"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="w-5 h-5" />
          {tower.level >= 5 ? (
            "已满级"
          ) : (
            <>
              升级 Lv.{tower.level + 1} 💰 {stats.upgradeCost}
            </>
          )}
        </button>

        <button
          onClick={() => {
            if (confirm(`确定拆除 ${config.name}？将返还 💰${refund}`)) {
              sellTower(tower.id);
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          拆除 (返还 💰{refund})
        </button>
      </div>
    </Card>
  );
}
