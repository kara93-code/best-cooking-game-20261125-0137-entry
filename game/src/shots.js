// Warung Kilat — screenshot scenes for ?shot=cover|counter|assembly|serve.
// One job: stage a real mid-game state through the game's own state
// functions, then let the game's own renderer draw it. No pixels are faked:
// every frame is the game code running in the browser.

import { recipeById } from './config.js';
import { spawnOrder, startDay } from './state.js';

function setOrder(game, recipeId, patience) {
  const recipe = recipeById(recipeId);
  const order = { id: 900 + game.orders.length, recipe, patience, maxPatience: patience, reward: recipe.price };
  game.orders.push(order);
  return order;
}

function cookSlot(game, stationId, slotIndex, fraction) {
  const slot = game.stations[stationId].slots[slotIndex];
  slot.active = true;
  slot.t = slot.dur * fraction;
}

export function stageShot(name, game) {
  startDay(game);
  game.orders = [];
  if (name === 'counter') {
    setOrder(game, 'mie-goreng', 34);
    setOrder(game, 'nasi-goreng', 41);
    game.time = 48;
    game.timeLeft = 102;
    game.coins = 37;
    game.served = 2;
    cookSlot(game, 'grill', 0, 0.55);
    cookSlot(game, 'wok', 0, 1);
    cookSlot(game, 'chop', 0, 0.5);
    game.stations.nasi.stock = 3;
    game.stations.plate = ['Mie'];
    game.player.x = 790;
    game.player.y = 400;
    game.player.carry = null;
    game.message = 'Mie selesai! Ambil di wajan.';
    game.messageTimer = 5;
    return;
  }
  if (name === 'assembly') {
    setOrder(game, 'komplit', 38);
    setOrder(game, 'mie-ayam', 29);
    game.time = 96;
    game.timeLeft = 54;
    game.coins = 96;
    game.served = 5;
    game.combo = 2;
    game.comboTimer = 5;
    cookSlot(game, 'grill', 0, 1);
    game.stations.plate = ['Nasi', 'Ayam'];
    game.player.x = 300;
    game.player.y = 560;
    game.player.carry = 'Sayur';
    game.message = 'Satu bahan lagi: Sayur untuk Komplit Kilat!';
    game.messageTimer = 5;
    return;
  }
  if (name === 'serve') {
    setOrder(game, 'nasi-ayam', 12);
    setOrder(game, 'komplit', 22);
    setOrder(game, 'es-teh', 30);
    game.time = 138;
    game.timeLeft = 12;
    game.rushing = true;
    game.coins = 148;
    game.served = 7;
    game.combo = 3;
    game.comboTimer = 6;
    game.stations.plate = [];
    game.player.x = 910;
    game.player.y = 580;
    game.player.carry = 'Plate';
    game.player.carryItems = ['Nasi', 'Ayam'];
    game.message = 'SERVICE RUSH! Sajikan sebelum waktu habis!';
    game.messageTimer = 5;
    return;
  }
  // cover (default): a busy kitchen, three orders, food everywhere.
  setOrder(game, 'nasi-ayam', 40);
  setOrder(game, 'mie-goreng', 28);
  setOrder(game, 'es-teh', 47);
  game.time = 62;
  game.timeLeft = 88;
  game.coins = 85;
  game.served = 4;
  game.combo = 2;
  game.comboTimer = 4;
  cookSlot(game, 'grill', 0, 1);
  cookSlot(game, 'grill', 1, 0.6);
  cookSlot(game, 'wok', 0, 0.75);
  cookSlot(game, 'chop', 0, 1);
  game.stations.nasi.stock = 2;
  game.stations.plate = ['Sayur'];
  game.player.x = 400;
  game.player.y = 420;
  game.player.carry = 'Ayam';
  game.message = 'Ayam matang! Susun Nasi Ayam di plating.';
  game.messageTimer = 5;
}

export function shotNames() {
  return ['cover', 'counter', 'assembly', 'serve'];
}
