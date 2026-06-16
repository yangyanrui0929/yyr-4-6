import { useGameStore } from "@/store/useGameStore";
import Card from "@/components/common/Card";
import { ShoppingCart } from "lucide-react";

export default function ShopPanel() {
  const { ingredients, gold, buyIngredient } = useGameStore();

  const handleBuy = (id: string, amount: number) => {
    buyIngredient(id, amount);
  };

  return (
    <Card title="食材采购" icon="🛒" className="h-full">
      <div className="space-y-3">
        {ingredients.map((ing) => {
          const canAfford1 = gold >= ing.price;
          const canAfford5 = gold >= ing.price * 5;
          return (
            <div
              key={ing.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-kitchen-warm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ing.emoji}</span>
                <div>
                  <div className="font-medium text-kitchen-brown">
                    {ing.name}
                  </div>
                  <div className="text-sm text-amber-700">
                    库存: <span className="font-bold">{ing.count}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div className="text-sm font-bold text-yellow-700">
                  💰 {ing.price}/个
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleBuy(ing.id, 1)}
                    disabled={!canAfford1}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      canAfford1
                        ? "bg-kitchen-warm text-white hover:bg-orange-500 shadow hover:shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    买1
                  </button>
                  <button
                    onClick={() => handleBuy(ing.id, 5)}
                    disabled={!canAfford5}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      canAfford5
                        ? "bg-orange-600 text-white hover:bg-orange-700 shadow hover:shadow-md"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    买5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
        <ShoppingCart className="w-4 h-4 inline mr-1" />
        提示：夜晚会根据食材种类生成食材怪，合理采购哦！
      </div>
    </Card>
  );
}
