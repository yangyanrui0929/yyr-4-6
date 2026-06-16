import { useGameStore } from "@/store/useGameStore";
import Card from "@/components/common/Card";
import { ChefHat, Plus, Minus } from "lucide-react";
import { FLAVOR_INFO } from "@/game/config";

export default function MenuPanel() {
  const { recipes, ingredients, cookRecipe, cookMax, calculateBaseFlavorsFromMenu } = useGameStore();

  const getIngredient = (id: string) => ingredients.find((i) => i.id === id);

  const canCook = (recipeId: string): boolean => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return false;
    if (recipe.prepared >= recipe.maxPrepare) return false;
    for (const req of recipe.ingredients) {
      const ing = getIngredient(req.ingredientId);
      if (!ing || ing.count < req.count) return false;
    }
    return true;
  };

  const handleCook = (recipeId: string, amount: number) => {
    const ok = cookRecipe(recipeId, amount);
    if (ok) calculateBaseFlavorsFromMenu();
  };

  const handleCookMax = (recipeId: string) => {
    const count = cookMax(recipeId);
    if (count > 0) calculateBaseFlavorsFromMenu();
  };

  return (
    <Card title="今日菜单" icon="📋" className="h-full">
      <div className="space-y-3">
        {recipes.map((recipe) => {
          const ok = canCook(recipe.id);
          return (
            <div
              key={recipe.id}
              className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-kitchen-veggie transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{recipe.emoji}</span>
                  <div>
                    <div className="font-bold text-kitchen-brown flex items-center gap-1">
                      {recipe.name}
                      <div className="flex gap-0.5 ml-1">
                        {recipe.flavors.map((f) => (
                          <span
                            key={f}
                            className="text-sm"
                            style={{ color: FLAVOR_INFO[f].color }}
                            title={FLAVOR_INFO[f].name + "味"}
                          >
                            {FLAVOR_INFO[f].emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-green-700">
                      售价: 💰 {recipe.sellPrice}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">准备份数</div>
                  <div className="font-bold text-lg text-green-700">
                    {recipe.prepared}
                    <span className="text-sm text-gray-400">
                      /{recipe.maxPrepare}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {recipe.ingredients.map((req) => {
                  const ing = getIngredient(req.ingredientId);
                  const enough = ing && ing.count >= req.count;
                  return (
                    <div
                      key={req.ingredientId}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        enough
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <span>{ing?.emoji}</span>
                      <span>
                        {ing?.name} x{req.count}
                      </span>
                      <span className="opacity-70">
                        ({ing?.count ?? 0})
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCook(recipe.id, 1)}
                  disabled={!ok}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    ok
                      ? "bg-kitchen-veggie text-white hover:bg-green-600 shadow hover:shadow-md"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  做1份
                </button>
                <button
                  onClick={() => {
                    for (let i = 0; i < 5; i++) {
                      if (canCook(recipe.id)) handleCook(recipe.id, 1);
                    }
                  }}
                  disabled={!ok}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    ok
                      ? "bg-green-700 text-white hover:bg-green-800 shadow hover:shadow-md"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  批量
                </button>
                <button
                  onClick={() => handleCookMax(recipe.id)}
                  disabled={!ok}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    ok
                      ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow hover:shadow-md"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  全部
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
