import { useGameStore, getTowerStats, getTowerPixelPos } from "@/store/useGameStore";
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
} from "@/game/config";
import type { Enemy, Bullet, Tower, FloatingText } from "@/types/game";

function distance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function gameTick(now: number) {
  const state = useGameStore.getState();
  if (state.phase !== "night" || state.isPaused || state.gameOver) return;

  const { path, gridPath } = state;

  const pathCells: Set<string> = new Set();
  for (let i = 0; i < gridPath.length - 1; i++) {
    const a = gridPath[i];
    const b = gridPath[i + 1];
    if (a.x === b.x) {
      const [s, e] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
      for (let y = s; y <= e; y++) pathCells.add(`${a.x},${y}`);
    } else {
      const [s, e] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
      for (let x = s; x <= e; x++) pathCells.add(`${x},${a.y}`);
    }
  }

  const enemiesToRemove: string[] = [];
  const enemyUpdates: Map<string, Partial<Enemy>> = new Map();

  for (const enemy of state.enemies) {
    if (enemy.hitFlash > 0) {
      enemyUpdates.set(enemy.id, { hitFlash: Math.max(0, enemy.hitFlash - 16) });
    }

    if (enemy.pathIndex >= path.length - 1) {
      enemiesToRemove.push(enemy.id);
      useGameStore.getState().loseLife(ENEMY_CONFIGS[enemy.type].damage);
      continue;
    }

    const target = path[enemy.pathIndex + 1];
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let speed = ENEMY_CONFIGS[enemy.type].speed;
    if (enemy.slowUntil > now) {
      speed *= enemy.slowFactor;
    }

    if (dist < speed * 2) {
      enemyUpdates.set(enemy.id, {
        x: target.x,
        y: target.y,
        pathIndex: enemy.pathIndex + 1,
      });
    } else {
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      enemyUpdates.set(enemy.id, {
        x: enemy.x + vx,
        y: enemy.y + vy,
      });
    }
  }

  for (const [id, updates] of enemyUpdates) {
    useGameStore.getState().updateEnemy(id, updates);
  }
  for (const id of enemiesToRemove) {
    useGameStore.getState().updateEnemy(id, {});
    useGameStore.setState((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) }));
  }

  const newBullets: Bullet[] = [];
  const towerUpdates: Map<string, number> = new Map();

  for (const tower of state.towers) {
    const stats = getTowerStats(tower);
    if (now - tower.lastFireTime < stats.fireRate) continue;

    const pos = getTowerPixelPos(tower);
    let nearestEnemy: Enemy | null = null;
    let nearestDist = Infinity;

    for (const enemy of state.enemies) {
      const d = distance(pos.x, pos.y, enemy.x, enemy.y);
      if (d <= stats.range && d < nearestDist) {
        nearestDist = d;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy) {
      towerUpdates.set(tower.id, now);
      newBullets.push({
        id: `b-${now}-${tower.id}`,
        x: pos.x,
        y: pos.y,
        targetId: nearestEnemy.id,
        damage: stats.damage,
        type: tower.type,
        speed: 6,
      });
    }
  }

  for (const [id, time] of towerUpdates) {
    useGameStore.setState((s) => ({
      towers: s.towers.map((t) => (t.id === id ? { ...t, lastFireTime: time } : t)),
    }));
  }
  for (const b of newBullets) {
    useGameStore.setState((s) => ({ bullets: [...s.bullets, b] }));
  }

  const currState = useGameStore.getState();
  const bulletsToRemove: string[] = [];
  const newFloatingTexts: FloatingText[] = [];
  const enemyDamage: Map<string, number> = new Map();
  const enemySlow: Map<string, { until: number; factor: number }> = new Map();

  for (const bullet of currState.bullets) {
    const target = currState.enemies.find((e) => e.id === bullet.targetId);
    if (!target) {
      bulletsToRemove.push(bullet.id);
      continue;
    }

    const d = distance(bullet.x, bullet.y, target.x, target.y);
    if (d < 20) {
      bulletsToRemove.push(bullet.id);

      if (bullet.type === "chili") {
        for (const e of currState.enemies) {
          if (distance(target.x, target.y, e.x, e.y) <= 60) {
            const prev = enemyDamage.get(e.id) || 0;
            enemyDamage.set(e.id, prev + bullet.damage);
          }
        }
      } else if (bullet.type === "freezer") {
        const prev = enemyDamage.get(target.id) || 0;
        enemyDamage.set(target.id, prev + bullet.damage);
        enemySlow.set(target.id, { until: now + 2000, factor: 0.5 });
      } else {
        const prev = enemyDamage.get(target.id) || 0;
        enemyDamage.set(target.id, prev + bullet.damage);
      }

      newFloatingTexts.push({
        id: `ft-${now}-${bullet.id}`,
        x: target.x,
        y: target.y - 10,
        text: `-${bullet.damage}`,
        color:
          bullet.type === "chili"
            ? "#E53935"
            : bullet.type === "freezer"
            ? "#4FC3F7"
            : "#FFC107",
        createdAt: now,
      });
    } else {
      const dx = target.x - bullet.x;
      const dy = target.y - bullet.y;
      const vx = (dx / d) * bullet.speed;
      const vy = (dy / d) * bullet.speed;
      useGameStore.setState((s) => ({
        bullets: s.bullets.map((b) =>
          b.id === bullet.id ? { ...b, x: b.x + vx, y: b.y + vy } : b
        ),
      }));
    }
  }

  for (const [eId, dmg] of enemyDamage) {
    const e = currState.enemies.find((x) => x.id === eId);
    if (!e) continue;
    const newHp = e.hp - dmg;
    if (newHp <= 0) {
      const reward = ENEMY_CONFIGS[e.type].reward;
      useGameStore.setState((s) => ({
        enemies: s.enemies.filter((x) => x.id !== eId),
        gold: s.gold + reward,
        waveReward: s.waveReward + reward,
      }));
      newFloatingTexts.push({
        id: `reward-${now}-${eId}`,
        x: e.x,
        y: e.y - 20,
        text: `+💰${reward}`,
        color: "#FFD700",
        createdAt: now,
      });
    } else {
      const slow = enemySlow.get(eId);
      useGameStore.setState((s) => ({
        enemies: s.enemies.map((x) =>
          x.id === eId
            ? {
                ...x,
                hp: newHp,
                hitFlash: 200,
                slowUntil: slow ? slow.until : x.slowUntil,
                slowFactor: slow ? slow.factor : x.slowFactor,
              }
            : x
        ),
      }));
    }
  }

  for (const id of bulletsToRemove) {
    useGameStore.setState((s) => ({ bullets: s.bullets.filter((b) => b.id !== id) }));
  }
  for (const ft of newFloatingTexts) {
    useGameStore.setState((s) => ({ floatingTexts: [...s.floatingTexts, ft] }));
  }

  const finalState = useGameStore.getState();
  const expiredTexts = finalState.floatingTexts.filter(
    (t) => now - t.createdAt > 1000
  );
  if (expiredTexts.length > 0) {
    useGameStore.setState((s) => ({
      floatingTexts: s.floatingTexts.filter((t) => now - t.createdAt <= 1000),
    }));
  }

  if (
    finalState.waveInProgress &&
    finalState.enemies.length === 0 &&
    !spawnQueueActive
  ) {
    if (finalState.currentWave >= finalState.totalWaves - 1) {
      useGameStore.getState().setWaveInProgress(false);
      setTimeout(() => useGameStore.getState().finishAllWaves(), 800);
    } else {
      useGameStore.getState().nextWave();
    }
  }
}

let spawnQueueActive = false;

export async function spawnWaveEnemies(waveIndex: number) {
  const state = useGameStore.getState();
  const waves = state.getCurrentWaves();
  const wave = waves[waveIndex];
  if (!wave) return;

  spawnQueueActive = true;
  const startPos = state.path[0];

  for (const group of wave.enemies) {
    for (let i = 0; i < group.count; i++) {
      if (useGameStore.getState().phase !== "night") {
        spawnQueueActive = false;
        return;
      }
      const cfg = ENEMY_CONFIGS[group.type];
      const difficulty = 1 + (useGameStore.getState().day - 1) * 0.2;
      useGameStore.getState().addEnemy({
        type: group.type,
        hp: Math.floor(cfg.hp * difficulty),
        maxHp: Math.floor(cfg.hp * difficulty),
        x: startPos.x,
        y: startPos.y,
        pathIndex: 0,
        slowUntil: 0,
        slowFactor: 1,
        hitFlash: 0,
      });
      await new Promise((r) => setTimeout(r, group.delay));
    }
  }

  spawnQueueActive = false;
}

export function isSpawnActive() {
  return spawnQueueActive;
}

export function drawBattlefield(
  ctx: CanvasRenderingContext2D,
  hoverCell: { x: number; y: number } | null
) {
  const state = useGameStore.getState();

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#FFF8E1";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const pathCells: Set<string> = new Set();
  for (let i = 0; i < state.gridPath.length - 1; i++) {
    const a = state.gridPath[i];
    const b = state.gridPath[i + 1];
    if (a.x === b.x) {
      const [s, e] = a.y < b.y ? [a.y, b.y] : [b.y, a.y];
      for (let y = s; y <= e; y++) pathCells.add(`${a.x},${y}`);
    } else {
      const [s, e] = a.x < b.x ? [a.x, b.x] : [b.x, a.x];
      for (let x = s; x <= e; x++) pathCells.add(`${x},${a.y}`);
    }
  }

  for (let gx = 0; gx < GRID_COLS; gx++) {
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      const x = gx * CELL_SIZE;
      const y = gy * CELL_SIZE;
      const isPath = pathCells.has(`${gx},${gy}`);

      if (isPath) {
        ctx.fillStyle = "#8D6E63";
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            x + Math.random() * CELL_SIZE,
            y + Math.random() * CELL_SIZE,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else {
        ctx.fillStyle = (gx + gy) % 2 === 0 ? "#FFF3E0" : "#FFE0B2";
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }

      ctx.strokeStyle = "rgba(139,69,19,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  const startP = state.path[0];
  ctx.fillStyle = "#4CAF50";
  ctx.beginPath();
  ctx.arc(startP.x, startP.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("入", startP.x, startP.y);

  const endP = state.path[state.path.length - 1];
  ctx.fillStyle = "#F44336";
  ctx.beginPath();
  ctx.arc(endP.x, endP.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.fillText("厨", endP.x, endP.y);

  if (hoverCell && state.selectedTowerType) {
    const canPlace =
      !pathCells.has(`${hoverCell.x},${hoverCell.y}`) &&
      !state.towers.some((t) => t.gridX === hoverCell.x && t.gridY === hoverCell.y);

    const hx = hoverCell.x * CELL_SIZE;
    const hy = hoverCell.y * CELL_SIZE;
    ctx.fillStyle = canPlace ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)";
    ctx.fillRect(hx, hy, CELL_SIZE, CELL_SIZE);

    if (canPlace) {
      const cfg = TOWER_CONFIGS[state.selectedTowerType];
      ctx.strokeStyle = "rgba(255,107,53,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(
        hx + CELL_SIZE / 2,
        hy + CELL_SIZE / 2,
        cfg.range,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cfg.emoji, hx + CELL_SIZE / 2, hy + CELL_SIZE / 2);
    }
  }

  for (const tower of state.towers) {
    const pos = getTowerPixelPos(tower);
    const cfg = TOWER_CONFIGS[tower.type];
    const isSelected = state.selectedTowerId === tower.id;

    if (isSelected) {
      const stats = getTowerStats(tower);
      ctx.strokeStyle = "rgba(255,107,53,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, stats.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,107,53,0.15)";
      ctx.fill();
    }

    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + 4, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.emoji, pos.x, pos.y);

    if (tower.level > 1) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`Lv${tower.level}`, pos.x, pos.y + 22);
    }
  }

  for (const enemy of state.enemies) {
    const cfg = ENEMY_CONFIGS[enemy.type];
    const isFrozen = enemy.slowUntil > performance.now();
    const scale = enemy.type === "boss" ? 1.5 : 1;
    const r = 16 * scale;

    if (isFrozen) {
      ctx.fillStyle = "rgba(79,195,247,0.3)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (enemy.hitFlash > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `${28 * scale}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.emoji, enemy.x, enemy.y);

    const barW = 36 * scale;
    const barH = 5;
    const barX = enemy.x - barW / 2;
    const barY = enemy.y - r - 10;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle =
      hpRatio > 0.5 ? "#4CAF50" : hpRatio > 0.25 ? "#FFC107" : "#F44336";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  for (const bullet of state.bullets) {
    const cfg = TOWER_CONFIGS[bullet.type];
    let color = "#FFC107";
    if (bullet.type === "chili") color = "#E53935";
    if (bullet.type === "freezer") color = "#4FC3F7";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(bullet.x - 2, bullet.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillText(cfg.emoji, bullet.x, bullet.y);
  }

  const now = performance.now();
  for (const ft of state.floatingTexts) {
    const age = now - ft.createdAt;
    const alpha = Math.max(0, 1 - age / 1000);
    const offsetY = (age / 1000) * 30;

    ctx.globalAlpha = alpha;
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y - offsetY);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y - offsetY);
    ctx.globalAlpha = 1;
  }

  if (state.isPaused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⏸️ 暂停中", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = "18px sans-serif";
    ctx.fillText("点击继续按钮恢复游戏", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }
}
