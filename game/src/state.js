// Warung Kilat — the whole game state and the rules that change it.
// One job: create a fresh day, spawn orders, match plates, score serves.

import {
  DAY_SECONDS, EARLY_RECIPES, LATE_RECIPES, MAX_ORDERS, MAX_STARS,
  PERFECT_BONUS_MULT, PERFECT_THRESHOLD, RICE_MAX, SPECIAL_CHANCE,
  SPECIAL_PATIENCE_MULT, SPECIAL_PAY_MULT, recipeById, sameItems,
} from './config.js';
import { mulberry32, pickFrom, range } from './random.js';

let orderId = 0;

export function createGame(seed = 7) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: 'title',
    paused: false,
    time: 0,
    timeLeft: DAY_SECONDS,
    coins: 0,
    served: 0,
    expired: 0,
    combo: 0,
    comboTimer: 0,
    stars: MAX_STARS,
    orders: [],
    spawnTimer: 3,
    rushing: false,
    rushAnnounced: false,
    player: { x: 640, y: 440, dir: 1, carry: null, moveTarget: null, pendingInteract: null },
    stations: {
      nasi: { stock: RICE_MAX, refill: 0 },
      grill: { slots: [{ active: false, t: 0, dur: 4 }, { active: false, t: 0, dur: 4 }] },
      wok: { slots: [{ active: false, t: 0, dur: 3 }] },
      chop: { slots: [{ active: false, t: 0, dur: 2.5 }] },
      plate: [],
    },
    particles: [],
    floats: [],
    flash: 0,
    message: '',
    messageTimer: 0,
    result: null,
  };
}

export function startDay(game) {
  const fresh = createGame(game.seed);
  Object.keys(fresh).forEach((key) => { game[key] = fresh[key]; });
  game.screen = 'play';
  spawnOrder(game);
  spawnOrder(game);
}

export function spawnInterval(game) {
  const progress = game.time / DAY_SECONDS;
  const base = 13 - progress * 6;
  return game.rushing ? base * 0.62 : base;
}

export function orderPatience(game) {
  const progress = game.time / DAY_SECONDS;
  const base = 52 - progress * 18;
  return game.rushing ? base * 0.8 : base;
}

export function spawnOrder(game) {
  if (game.orders.length >= MAX_ORDERS) return null;
  const late = game.time > 55 || game.rushing;
  const pool = late ? [...EARLY_RECIPES, ...LATE_RECIPES] : EARLY_RECIPES;
  const recipe = recipeById(pickFrom(game.rng, pool));
  const special = game.time > 20 && game.rng() < SPECIAL_CHANCE;
  const patience = orderPatience(game) * (special ? SPECIAL_PATIENCE_MULT : 1);
  const order = {
    id: orderId += 1,
    recipe,
    patience,
    maxPatience: patience,
    reward: special ? Math.round(recipe.price * SPECIAL_PAY_MULT) : recipe.price,
    special,
  };
  game.orders.push(order);
  return order;
}

export function plateMatchesOrder(plate, order) {
  return sameItems(plate, order.recipe.items);
}

export function findMatchingOrder(game, plate) {
  return game.orders.find((order) => plateMatchesOrder(plate, order));
}

export function servePlate(game, order) {
  const plate = [...(game.player.carryItems || [])];
  const patienceFraction = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(order.reward * 0.6 * patienceFraction);
  const comboBonus = 1 + 0.25 * Math.min(game.combo, 3);
  const perfect = patienceFraction >= PERFECT_THRESHOLD;
  let earned = Math.round((order.reward + tip) * comboBonus);
  if (perfect) earned = Math.round(earned * PERFECT_BONUS_MULT);
  game.coins += earned;
  game.served += 1;
  game.combo = game.comboTimer > 0 ? game.combo + 1 : 1;
  game.comboTimer = 8;
  game.orders = game.orders.filter((item) => item.id !== order.id);
  game.stations.plate = [];
  game.player.carry = null;
  game.player.carryItems = null;
  addFloat(game, 900, 700, `+${earned} koin`, '#2f9e44');
  if (perfect) addFloat(game, 900, 668, 'SEMPURNA! +50%', '#f2c14e');
  if (game.combo >= 2) addFloat(game, 900, 636, `KOMBO x${Math.min(game.combo, 4)}!`, '#e8590c');
  return { earned, plate };
}

export function expireOrder(game, order) {
  game.orders = game.orders.filter((item) => item.id !== order.id);
  game.expired += 1;
  game.stars = Math.max(0, game.stars - 1);
  game.combo = 0;
  game.comboTimer = 0;
  game.flash = 0.5;
  addFloat(game, 640, 120, 'Pesanan hangus! -1 ★', '#e03131');
}

export function endDay(game, reason) {
  game.screen = 'over';
  const rating = game.served >= 14 ? 'Koki Kilat! 🏆' : game.served >= 9 ? 'Koki Andal 👍' : game.served >= 5 ? 'Koki Magang 🙂' : 'Dapur Berantakan 😅';
  game.result = {
    reason,
    coins: game.coins,
    served: game.served,
    expired: game.expired,
    stars: game.stars,
    rating,
  };
}

export function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, life: 1.4 });
}

export function addParticles(game, x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    game.particles.push({
      x, y,
      vx: range(game.rng, -50, 50),
      vy: range(game.rng, -90, -20),
      life: range(game.rng, 0.4, 0.9),
      maxLife: 0.9,
      color,
      size: range(game.rng, 3, 7),
    });
  }
}

export function plateLabel(game) {
  return game.stations.plate.length === 0 ? 'Piring kosong' : game.stations.plate.join(' + ');
}
