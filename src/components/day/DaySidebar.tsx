import { useGameStore } from "@/store/useGameStore";
import Card from "@/components/common/Card";
import { Moon, AlertTriangle } from "lucide-react";

export default function DaySidebar() {
  const { ingredients, recipes, gold, startNight } = useGameStore();

  const totalPrepared = recipes.reduce((s, r) => s + r.prepared, 0);
  const totalMax = recipes.reduce((s, r) => s + r.maxPrepare, 0);
  const estimatedRevenue = recipes.reduce(
    (s, r) => s + r.prepared * r.sellPrice,
    0
  );

  return (
    <div className="space-y-4">
      <Card title="库存一览" icon="📦">
        <div className="grid grid-cols-3 gap-2">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="flex flex-col items-center p-2 bg-amber-50 rounded-lg"
            >
              <span className="text-2xl">{ing.emoji}</span>
              <span className="text-xs text-gray-600 mt-0.5">{ing.name}</span>
              <span className="font-bold text-kitchen-warm">{ing.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="菜品准备进度" icon="🍽️">
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">总进度</span>
            <span className="font-bold">
              {totalPrepared} / {totalMax}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-kitchen-veggie transition-all duration-500"
              style={{
                width: `${totalMax > 0 ? (totalPrepared / totalMax) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span>
                {r.emoji} {r.name}
              </span>
              <span className="font-medium">
                {r.prepared} / {r.maxPrepare}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-amber-100">
          <div className="flex justify-between">
            <span className="text-gray-600">预估营业额</span>
            <span className="font-bold text-yellow-600">💰 {estimatedRevenue}</span>
          </div>
        </div>
      </Card>

      {totalPrepared === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          你还没准备任何菜品，夜晚后无法获得营业额！
        </div>
      )}

      <button
        onClick={startNight}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-display text-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
      >
        <Moon className="w-6 h-6" />
        进入夜晚 🌙
      </button>

      <div className="text-center text-xs text-gray-500">
        当前金币: <span className="font-bold text-yellow-600">💰 {gold}</span>
      </div>
    </div>
  );
}
