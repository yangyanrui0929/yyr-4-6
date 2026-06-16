import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
} from "@/game/config";
import { gameTick, drawBattlefield, spawnWaveEnemies, isSpawnActive } from "@/game/towerEngine";

export default function Battlefield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number>();
  const lastSpawnWaveRef = useRef<number>(-1);

  const {
    phase,
    waveInProgress,
    currentWave,
    placeTower,
    selectTower,
    towers,
    selectedTowerType,
  } = useGameStore();

  useEffect(() => {
    if (phase !== "night") return;

    let lastTime = 0;
    const tick = (now: number) => {
      if (now - lastTime >= 16) {
        gameTick(now);
        lastTime = now;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawBattlefield(ctx, hoverCell);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, hoverCell]);

  useEffect(() => {
    if (phase !== "night") return;
    if (!waveInProgress) return;
    if (lastSpawnWaveRef.current === currentWave && isSpawnActive()) return;
    if (lastSpawnWaveRef.current === currentWave) return;

    lastSpawnWaveRef.current = currentWave;
    spawnWaveEnemies(currentWave);
  }, [waveInProgress, currentWave, phase]);

  useEffect(() => {
    if (phase !== "night") {
      lastSpawnWaveRef.current = -1;
    }
  }, [phase]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTowerType) {
      if (hoverCell) setHoverCell(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(x / CELL_SIZE);
    const gy = Math.floor(y / CELL_SIZE);
    if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
      if (!hoverCell || hoverCell.x !== gx || hoverCell.y !== gy) {
        setHoverCell({ x: gx, y: gy });
      }
    } else if (hoverCell) {
      setHoverCell(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(x / CELL_SIZE);
    const gy = Math.floor(y / CELL_SIZE);

    if (selectedTowerType) {
      placeTower(gx, gy);
      return;
    }

    const clickedTower = towers.find(
      (t) => t.gridX === gx && t.gridY === gy
    );
    if (clickedTower) {
      selectTower(clickedTower.id);
    } else {
      selectTower(null);
    }
  };

  const handleMouseLeave = () => {
    if (hoverCell) setHoverCell(null);
  };

  if (phase !== "night") return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-kitchen-brown"
        style={{ background: "#3E2723" }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={selectedTowerType ? "cursor-crosshair" : "cursor-pointer"}
          style={{
            display: "block",
            maxWidth: "100%",
            height: "auto",
            imageRendering: "pixelated",
          }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        {selectedTowerType
          ? "💡 点击空地放置防御塔，绿色区域可放置"
          : "💡 点击防御塔查看详情与升级，或选择左侧塔进行放置"}
      </div>
    </div>
  );
}
