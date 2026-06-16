import { useGameStore } from "@/store/useGameStore";
import { TOWER_CONFIGS } from "@/game/config";
import type { TowerType } from "@/types/game";
import Card from "@/components/common/Card";

export default function TowerSelect() {
  const { selectedTowerType, selectTowerType, gold } = useGameStore();

  const towers: TowerType[] = ["spatula", "chili", "freezer"];

  return (
    <Card title="防御塔商店" icon="🏰" className="h-full">
      <div className="space-y-3">
        {towers.map((type) => {
          const config = TOWER_CONFIGS[type];
          const canAfford = gold >= config.cost;
          const isSelected = selectedTowerType === type;
          return (
            <button
              key={type}
              onClick={() => selectTowerType(isSelected ? null : type)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-kitchen-warm bg-orange-100 shadow-lg scale-[1.02]"
                  : canAfford
                  ? "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:border-kitchen-warm hover:shadow-md"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
              disabled={!canAfford}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{config.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-kitchen-brown">
                    {config.name}
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>💥 伤害: {config.damage} | 📏 范围: {config.range}</div>
                    <div className="text-purple-600">✨ {config.special}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      canAfford ? "text-yellow-600" : "text-gray-400"
                    }`}
                  >
                    💰 {config.cost}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTowerType && (
        <div className="mt-4 p-3 bg-kitchen-warm/10 border border-kitchen-warm/30 rounded-lg text-sm text-kitchen-brown">
          💡 已选择 <b>{TOWER_CONFIGS[selectedTowerType].name}</b>，点击战场空地放置！
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        提示：再次点击塔可以取消选择
      </div>
    </Card>
  );
}
