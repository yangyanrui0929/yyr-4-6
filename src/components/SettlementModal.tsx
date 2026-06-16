import { useGameStore } from "@/store/useGameStore";
import { TrendingUp, TrendingDown, DollarSign, Sun, RotateCcw, Skull } from "lucide-react";

export default function SettlementModal() {
  const {
    day,
    todayRevenue,
    todayExpense,
    waveReward,
    recipes,
    gameOver,
    startDay,
    resetGame,
  } = useGameStore();

  const netProfit = todayRevenue - todayExpense;
  const isProfit = netProfit >= 0;

  let foodRevenue = 0;
  for (const r of recipes) {
    foodRevenue += r.prepared * r.sellPrice;
  }

  if (gameOver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-bounce-in">
          <div className="text-6xl mb-4">💀</div>
          <h2 className="font-display text-3xl text-red-600 mb-2">
            游戏结束！
          </h2>
          <p className="text-gray-600 mb-6">
            你在第 <b className="text-kitchen-warm">{day}</b> 天坚持不住了...
            <br />
            厨房被食材怪占领了！
          </p>
          <div className="p-4 bg-red-50 rounded-xl mb-6">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <Skull className="w-6 h-6" />
              <span className="font-display text-xl">挑战失败</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm("确定要重新开始游戏吗？")) {
                resetGame();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-kitchen-warm to-orange-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            重新开始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full animate-bounce-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📊</div>
          <h2 className="font-display text-3xl text-kitchen-brown">
            第 {day} 天结算
          </h2>
          <p className="text-gray-500 text-sm mt-1">辛苦啦！来看看今天的业绩吧</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <span className="text-gray-700">菜品销售收入</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
              <TrendingUp className="w-4 h-4" />
              +💰 {foodRevenue}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <span className="text-gray-700">塔防奖励金币</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-600 font-bold text-lg">
              <TrendingUp className="w-4 h-4" />
              +💰 {waveReward}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <span className="text-gray-700">食材采购支出</span>
            </div>
            <div className="flex items-center gap-1 text-red-600 font-bold text-lg">
              <TrendingDown className="w-4 h-4" />
              -💰 {todayExpense}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 pt-4">
            <div
              className={`flex items-center justify-between p-4 rounded-xl ${
                isProfit
                  ? "bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300"
                  : "bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign
                  className={`w-6 h-6 ${
                    isProfit ? "text-green-600" : "text-red-600"
                  }`}
                />
                <span
                  className={`font-bold text-lg ${
                    isProfit ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isProfit ? "今日净利润" : "今日净亏损"}
                </span>
              </div>
              <div
                className={`font-display text-2xl ${
                  isProfit ? "text-green-600" : "text-red-600"
                }`}
              >
                {isProfit ? "+" : "-"}💰 {Math.abs(netProfit)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-6">
          <div className="text-sm text-amber-800">
            <span className="font-medium">📦 准备的菜品：</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipes
                .filter((r) => r.prepared > 0)
                .map((r) => (
                  <span
                    key={r.id}
                    className="px-2 py-1 bg-white rounded-md text-xs shadow-sm"
                  >
                    {r.emoji} {r.name} x{r.prepared}
                  </span>
                ))}
              {recipes.every((r) => r.prepared === 0) && (
                <span className="text-amber-600 text-xs">
                  今天没准备菜品，明天加油！
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={startDay}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-display text-xl bg-gradient-to-r from-amber-500 to-kitchen-warm text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <Sun className="w-6 h-6" />
          进入第 {day + 1} 天 ☀️
        </button>
      </div>
    </div>
  );
}
