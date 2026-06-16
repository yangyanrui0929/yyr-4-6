import { useGameStore, getTowerStats, getTowerPixelPos } from "@/store/useGameStore";
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TOWER_CONFIGS,
  ENEMY_CONFIGS,
  FLAVOR_INFO,
  REACTION_CONFIGS,
  FLAVOR_HIT_DURATION,
} from "@/game/config";
import type {
  Enemy,
  Bullet,
  Tower,
  FloatingText,
  FlavorType,
  ReactionType,
  FlavorHit,
} from "@/types/game";

function distance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function checkReaction(
  hits: FlavorHit[],
  baseFlavors: FlavorType[],
  now: number
): ReactionType | null {
  const validHits = hits.filter((h) => now - h.timestamp < FLAVOR_HIT_DURATION);
  const hitFlavors = new Set<FlavorType>();
  for (const h of validHits) hitFlavors.add(h.flavor);

  if (hitFlavors.size < 2) return null;

  const recentFlavors = new Set<FlavorType>(hitFlavors);
  for (const f of baseFlavors) recentFlavors.add(f);

  for (const reaction of Object.values(REACTION_CONFIGS)) {
    const [f1, f2] = reaction.flavors;
    const hitHasF1 = hitFlavors.has(f1);
    const hitHasF2 = hitFlavors.has(f2);
    if (!hitHasF1 && !hitHasF2) continue;
    if (recentFlavors.has(f1) && recentFlavors.has(f2)) {
      return reaction.id;
    }
  }
  return null;
}

function hasSameFlavorHit(hits: FlavorHit[], flavor: FlavorType, now: number): boolean {
  return hits.some((h) => h.flavor === flavor && now - h.timestamp < FLAVOR_HIT_DURATION);
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
  const burnDamages: Map<string, number> = new Map();

  for (const enemy of state.enemies) {
    const current = enemyUpdates.get(enemy.id) || {};
    let newHits = enemy.flavorHits.filter(
      (h) => now - h.timestamp < FLAVOR_HIT_DURATION
    );

    if (enemy.hitFlash > 0) {
      current.hitFlash = Math.max(0, enemy.hitFlash - 16);
    }

    if (enemy.burnUntil > now && enemy.burnDamage > 0) {
      const dps = enemy.burnDamage / 1000;
      const tickDamage = dps * 16;
      const prev = burnDamages.get(enemy.id) || 0;
      burnDamages.set(enemy.id, prev + tickDamage);
    }

    const isFrozen = enemy.slowUntil > now && enemy.slowFactor === 0;
    const isConfused = enemy.confusedUntil > now;

    if (isFrozen) {
      enemyUpdates.set(enemy.id, { ...current, flavorHits: newHits });
      continue;
    }

    if (isConfused) {
      if (enemy.pathIndex <= 0) {
        enemyUpdates.set(enemy.id, { ...current, flavorHits: newHits });
        continue;
      }

      const target = path[enemy.pathIndex - 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let speed = ENEMY_CONFIGS[enemy.type].speed;
      if (enemy.slowUntil > now) {
        speed *= enemy.slowFactor;
      }
      speed *= 0.6;

      if (dist < speed * 2) {
        current.x = target.x;
        current.y = target.y;
        current.pathIndex = enemy.pathIndex - 1;
      } else {
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        current.x = enemy.x + vx;
        current.y = enemy.y + vy;
      }
      current.flavorHits = newHits;
      enemyUpdates.set(enemy.id, current);
      continue;
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
      current.x = target.x;
      current.y = target.y;
      current.pathIndex = enemy.pathIndex + 1;
    } else {
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      current.x = enemy.x + vx;
      current.y = enemy.y + vy;
    }
    current.flavorHits = newHits;
    enemyUpdates.set(enemy.id, current);
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
      const config = TOWER_CONFIGS[tower.type];
      newBullets.push({
        id: `b-${now}-${tower.id}`,
        x: pos.x,
        y: pos.y,
        targetId: nearestEnemy.id,
        damage: stats.damage,
        type: tower.type,
        speed: 6,
        flavors: config.flavors,
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
  const { baseFlavors } = currState;
  const bulletsToRemove: string[] = [];
  const newFloatingTexts: FloatingText[] = [];
  const enemyDamage: Map<string, number> = new Map();
  const enemySlow: Map<string, { until: number; factor: number }> = new Map();
  const enemyFlavorHits: Map<string, FlavorHit[]> = new Map();
  const enemyReactions: Map<string, ReactionType> = new Map();
  const enemyBurn: Map<string, { until: number; damage: number }> = new Map();
  const enemyConfuse: Map<string, number> = new Map();
  const enemyBonusReward: Map<string, { until: number; mult: number }> =
    new Map();
  const enemyDefenseReduced: Map<string, boolean> = new Map();
  const splashDamages: Map<string, { x: number; y: number; damage: number }> =
    new Map();

  for (const bullet of currState.bullets) {
    const target = currState.enemies.find((e) => e.id === bullet.targetId);
    if (!target) {
      bulletsToRemove.push(bullet.id);
      continue;
    }

    const d = distance(bullet.x, bullet.y, target.x, target.y);
    if (d < 20) {
      bulletsToRemove.push(bullet.id);

      let damage = bullet.damage;
      if (enemyDefenseReduced.get(target.id)) {
        damage = Math.floor(damage * 1.5);
      }

      if (bullet.type === "chili") {
        for (const e of currState.enemies) {
          if (distance(target.x, target.y, e.x, e.y) <= 60) {
            let dmg = damage;
            if (enemyDefenseReduced.get(e.id)) {
              dmg = Math.floor(dmg * 1.5);
            }
            const prev = enemyDamage.get(e.id) || 0;
            enemyDamage.set(e.id, prev + dmg);
            for (const f of bullet.flavors) {
              const hits = enemyFlavorHits.get(e.id) || [...e.flavorHits];
              hits.push({ flavor: f, timestamp: now });
              enemyFlavorHits.set(e.id, hits);
            }
          }
        }
      } else if (bullet.type === "freezer") {
        const prev = enemyDamage.get(target.id) || 0;
        enemyDamage.set(target.id, prev + damage);
        enemySlow.set(target.id, { until: now + 2000, factor: 0.5 });
        for (const f of bullet.flavors) {
          const hits = enemyFlavorHits.get(target.id) || [...target.flavorHits];
          hits.push({ flavor: f, timestamp: now });
          enemyFlavorHits.set(target.id, hits);
        }
      } else {
        const prev = enemyDamage.get(target.id) || 0;
        enemyDamage.set(target.id, prev + damage);
        for (const f of bullet.flavors) {
          const hits = enemyFlavorHits.get(target.id) || [...target.flavorHits];
          hits.push({ flavor: f, timestamp: now });
          enemyFlavorHits.set(target.id, hits);
        }
      }

      const bulletColor =
        bullet.type === "chili"
          ? "#E53935"
          : bullet.type === "freezer"
          ? "#4FC3F7"
          : bullet.type === "vinegar"
          ? "#FFEB3B"
          : bullet.type === "wok"
          ? "#FF5722"
          : "#FFC107";

      newFloatingTexts.push({
        id: `ft-${now}-${bullet.id}`,
        x: target.x,
        y: target.y - 10,
        text: `-${damage}`,
        color: bulletColor,
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

  for (const [eId, hits] of enemyFlavorHits) {
    const enemy = currState.enemies.find((e) => e.id === eId);
    if (!enemy) continue;

    const reaction = checkReaction(hits, baseFlavors, now);
    if (reaction && !enemyReactions.has(eId)) {
      const canTrigger = now - enemy.lastReactionTime > 1500;
      if (canTrigger) {
        enemyReactions.set(eId, reaction);
        const rcfg = REACTION_CONFIGS[reaction];

        newFloatingTexts.push({
          id: `rx-${now}-${eId}`,
          x: enemy.x,
          y: enemy.y - 35,
          text: `${rcfg.emoji} ${rcfg.name}!`,
          color: rcfg.color,
          createdAt: now,
        });

        switch (reaction) {
          case "sour_spicy":
            enemyConfuse.set(eId, now + 3000);
            break;
          case "cold_umami":
            enemyBonusReward.set(eId, {
              until: now + 5000,
              mult: 2,
            });
            break;
          case "burnt_spicy": {
            const baseDmg = enemyDamage.get(eId) || 10;
            enemyBurn.set(eId, {
              until: now + 4000,
              damage: Math.floor(baseDmg * 0.8),
            });
            break;
          }
          case "sour_umami":
            enemyDefenseReduced.set(eId, true);
            const extraDmg = Math.floor((enemyDamage.get(eId) || 0) * 0.5);
            const prev = enemyDamage.get(eId) || 0;
            enemyDamage.set(eId, prev + extraDmg);
            break;
          case "cold_spicy":
            enemySlow.set(eId, { until: now + 1500, factor: 0 });
            break;
          case "burnt_sour":
            splashDamages.set(eId, {
              x: enemy.x,
              y: enemy.y,
              damage: Math.floor((enemyDamage.get(eId) || 10) * 0.6),
            });
            break;
        }

        useGameStore.getState().incrementReactionCount(reaction);
      }
    }
  }

  for (const [splashId, splash] of splashDamages) {
    for (const e of currState.enemies) {
      if (e.id === splashId) continue;
      if (distance(splash.x, splash.y, e.x, e.y) <= 70) {
        let dmg = splash.damage;
        if (enemyDefenseReduced.get(e.id)) {
          dmg = Math.floor(dmg * 1.5);
        }
        const prev = enemyDamage.get(e.id) || 0;
        enemyDamage.set(e.id, prev + dmg);
      }
    }
  }

  for (const [eId, dmg] of enemyDamage) {
    const e = currState.enemies.find((x) => x.id === eId);
    if (!e) continue;

    let totalDmg = dmg;
    const burnDmg = burnDamages.get(eId) || 0;
    totalDmg += burnDmg;

    const newHp = e.hp - totalDmg;

    if (newHp <= 0) {
      let reward = ENEMY_CONFIGS[e.type].reward;
      const bonus = enemyBonusReward.get(eId);
      if (bonus && bonus.until > now) {
        reward = Math.floor(reward * bonus.mult);
      }
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
      const burn = enemyBurn.get(eId);
      const confuse = enemyConfuse.get(eId);
      const bonusReward = enemyBonusReward.get(eId);
      const reaction = enemyReactions.get(eId);
      const flavorHits = enemyFlavorHits.get(eId) || e.flavorHits;

      useGameStore.setState((s) => ({
        enemies: s.enemies.map((x) =>
          x.id === eId
            ? {
                ...x,
                hp: newHp,
                hitFlash: 200,
                slowUntil: slow ? slow.until : x.slowUntil,
                slowFactor: slow ? slow.factor : x.slowFactor,
                burnUntil: burn ? burn.until : x.burnUntil,
                burnDamage: burn ? burn.damage : x.burnDamage,
                confusedUntil: confuse ? confuse : x.confusedUntil,
                bonusRewardUntil: bonusReward
                  ? bonusReward.until
                  : x.bonusRewardUntil,
                bonusRewardMultiplier: bonusReward
                  ? bonusReward.mult
                  : x.bonusRewardMultiplier,
                lastReaction: reaction ? reaction : x.lastReaction,
                lastReactionTime: reaction ? now : x.lastReactionTime,
                flavorHits,
              }
            : x
        ),
      }));
    }
  }

  for (const [eId, burn] of enemyBurn) {
    const e = currState.enemies.find((x) => x.id === eId);
    if (!e) continue;
    if (enemyDamage.has(eId)) continue;
    useGameStore.setState((s) => ({
      enemies: s.enemies.map((x) =>
        x.id === eId
          ? {
              ...x,
              burnUntil: burn.until,
              burnDamage: burn.damage,
            }
          : x
      ),
    }));
  }

  for (const [eId, burnTick] of burnDamages) {
    if (enemyDamage.has(eId)) continue;
    const e = currState.enemies.find((x) => x.id === eId);
    if (!e) continue;
    if (burnTick <= 0) continue;

    const newHp = e.hp - burnTick;
    if (newHp <= 0) {
      let reward = ENEMY_CONFIGS[e.type].reward;
      if (e.bonusRewardUntil > now) {
        reward = Math.floor(reward * e.bonusRewardMultiplier);
      }
      useGameStore.setState((s) => ({
        enemies: s.enemies.filter((x) => x.id !== eId),
        gold: s.gold + reward,
        waveReward: s.waveReward + reward,
      }));
      newFloatingTexts.push({
        id: `burn-kill-${now}-${eId}`,
        x: e.x,
        y: e.y - 20,
        text: `+💰${reward}`,
        color: "#FFD700",
        createdAt: now,
      });
    } else {
      useGameStore.setState((s) => ({
        enemies: s.enemies.map((x) =>
          x.id === eId
            ? {
                ...x,
                hp: newHp,
                hitFlash: 120,
              }
            : x
        ),
      }));
      newFloatingTexts.push({
        id: `burn-${now}-${eId}`,
        x: e.x,
        y: e.y - 10,
        text: `🔥-${Math.ceil(burnTick)}`,
        color: "#FF5722",
        createdAt: now,
      });
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
        flavorHits: [],
        burnUntil: 0,
        burnDamage: 0,
        confusedUntil: 0,
        bonusRewardUntil: 0,
        bonusRewardMultiplier: 1,
        lastReaction: null,
        lastReactionTime: 0,
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

  const nowDraw = performance.now();

  for (const enemy of state.enemies) {
    const cfg = ENEMY_CONFIGS[enemy.type];
    const isFrozen = enemy.slowUntil > nowDraw && enemy.slowFactor === 0;
    const isSlowed = enemy.slowUntil > nowDraw && enemy.slowFactor > 0;
    const isBurning = enemy.burnUntil > nowDraw;
    const isConfused = enemy.confusedUntil > nowDraw;
    const hasBonus = enemy.bonusRewardUntil > nowDraw;
    const scale = enemy.type === "boss" ? 1.5 : 1;
    const r = 16 * scale;

    if (isBurning) {
      ctx.fillStyle = "rgba(255,87,34,0.25)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${10 * scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🔥", enemy.x + r - 4, enemy.y - r + 4);
    }

    if (isFrozen) {
      ctx.fillStyle = "rgba(79,195,247,0.5)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4FC3F7";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isSlowed) {
      ctx.fillStyle = "rgba(79,195,247,0.2)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isConfused) {
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.textAlign = "center";
      const offset = Math.sin(nowDraw / 200) * 2;
      ctx.fillText("😵", enemy.x, enemy.y - r - 4 + offset);
    }

    if (hasBonus) {
      ctx.fillStyle = "rgba(255,215,0,0.3)";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillText("💰", enemy.x - r + 2, enemy.y - r + 4);
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
    if (bullet.type === "vinegar") color = "#FFEB3B";
    if (bullet.type === "wok") color = "#FF5722";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(bullet.x - 2, bullet.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    if (bullet.flavors && bullet.flavors.length > 0) {
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        bullet.flavors.map((f) => FLAVOR_INFO[f].emoji).join(""),
        bullet.x,
        bullet.y + 14
      );
    }
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
