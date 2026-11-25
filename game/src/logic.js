// Warung Kilat — the rules tick: movement, stations, orders, rush, day end.
// One job: advance the state one frame from the player's intent.

import {
  COOK_TIME, DAY_SECONDS, FLOOR, GRILL_SLOTS, INTERACT_RANGE, ITEMS,
  PLAYER_RADIUS, PLAYER_SPEED, RICE_MAX, RICE_REFILL_SECONDS, RUSH_SECONDS,
  STATIONS, recipeById,
} from './config.js';
import {
  addFloat, addParticles, endDay, expireOrder, findMatchingOrder,
  servePlate, spawnInterval, spawnOrder,
} from './state.js';

function stationCentre(station) {
  return { x: station.x + station.width / 2, y: station.y + station.height / 2 };
}

function frontPoint(station) {
  const centre = stationCentre(station);
  if (station.y < 300) return { x: centre.x, y: station.y + station.height + 42 };
  return { x: centre.x, y: station.y - 42 };
}

export function nearestStation(game) {
  const player = game.player;
  let best = null;
  let bestDistance = INTERACT_RANGE;
  for (const id of Object.keys(STATIONS)) {
    const station = STATIONS[id];
    const centre = stationCentre(station);
    const distance = Math.hypot(player.x - centre.x, player.y - centre.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = station;
    }
  }
  return best;
}

function stationReady(stationId, game) {
  if (stationId === 'nasi') return game.stations.nasi.stock > 0;
  if (stationId === 'teh') return true;
  if (stationId === 'grill' || stationId === 'wok' || stationId === 'chop') {
    return game.stations[stationId].slots.some((slot) => slot.active && slot.t >= slot.dur)
      || game.stations[stationId].slots.some((slot) => !slot.active);
  }
  return true;
}

function takeFromProcessor(game, stationId, kind) {
  const slots = game.stations[stationId].slots;
  const done = slots.find((slot) => slot.active && slot.t >= slot.dur);
  if (done) {
    done.active = false;
    done.t = 0;
    game.player.carry = kind;
    return 'take';
  }
  const free = slots.find((slot) => !slot.active);
  if (free) {
    free.active = true;
    free.t = 0;
    free.dur = COOK_TIME[stationId];
    addParticles(game, game.player.x, game.player.y - 30, '#ffb703', 6);
    return 'start';
  }
  return 'busy';
}

function interact(game, station, sound) {
  const player = game.player;
  const id = station.id;
  const carrying = player.carry;
  const say = (text) => { game.message = text; game.messageTimer = 1.6; };

  if (id === 'trash') {
    if (!carrying && game.stations.plate.length === 0) { say('Tidak ada yang dibuang'); sound.fail(); return; }
    player.carry = null;
    game.stations.plate = [];
    say('Dibuang ke tempat sampah');
    sound.place();
    return;
  }

  if (id === 'plating') {
    if (carrying === 'Plate') {
      game.stations.plate = [...player.carryItems];
      player.carry = null;
      player.carryItems = null;
      say('Piring diletakkan');
      sound.place();
      return;
    }
    if (carrying) {
      if (game.stations.plate.includes(carrying)) { say('Sudah ada di piring'); sound.fail(); return; }
      if (game.stations.plate.length >= 3) { say('Piring penuh (maks 3)'); sound.fail(); return; }
      game.stations.plate.push(carrying);
      player.carry = null;
      addParticles(game, station.x + station.width / 2, station.y + 40, '#74c0fc', 8);
      say(`${ITEMS[carrying].name} masuk piring`);
      sound.place();
      return;
    }
    if (game.stations.plate.length > 0) {
      player.carry = 'Plate';
      player.carryItems = [...game.stations.plate];
      game.stations.plate = [];
      say('Piring diangkat');
      sound.pickup();
      return;
    }
    say('Piring masih kosong — susun bahan dulu');
    sound.fail();
    return;
  }

  if (id === 'serve') {
    if (carrying !== 'Plate') { say('Bawa piring dulu ke jendela saji'); sound.fail(); return; }
    const order = findMatchingOrder(game, player.carryItems || []);
    if (!order) { say('Tidak ada pesanan yang cocok!'); sound.fail(); return; }
    const result = servePlate(game, order);
    addParticles(game, station.x + station.width / 2, station.y + 30, '#ffd43b', 14);
    say(`${order.recipe.name} tersaji!`);
    if (result.perfect || order.special) sound.servePerfect();
    else sound.serve();
    return result;
  }

  if (carrying) { say('Tangan penuh — letakkan dulu di plating'); sound.fail(); return; }

  if (id === 'nasi') {
    if (game.stations.nasi.stock <= 0) { say('Nasi habis — tunggu masak'); sound.fail(); return; }
    game.stations.nasi.stock -= 1;
    player.carry = 'Nasi';
    say('Nasi diambil');
    sound.pickup();
    return;
  }
  if (id === 'teh') {
    player.carry = 'Teh';
    say('Es Teh diambil');
    sound.pickup();
    return;
  }
  if (id === 'grill' || id === 'wok' || id === 'chop') {
    const kind = id === 'grill' ? 'Ayam' : id === 'wok' ? 'Mie' : 'Sayur';
    const outcome = takeFromProcessor(game, id, kind);
    if (outcome === 'take') { say(`${ITEMS[kind].name} diambil`); sound.pickup(); }
    else if (outcome === 'start') { say(`${ITEMS[kind].name} mulai dimasak`); sound.chopTick(); }
    else { say('Semua slot sibuk'); sound.fail(); }
  }
}

function movePlayer(game, input, dt) {
  const player = game.player;
  const axes = input.axes();
  if (axes.x !== 0 || axes.y !== 0) {
    player.moveTarget = null;
    const length = Math.hypot(axes.x, axes.y) || 1;
    player.x += (axes.x / length) * PLAYER_SPEED * dt;
    player.y += (axes.y / length) * PLAYER_SPEED * dt;
    player.dir = axes.x !== 0 ? Math.sign(axes.x) : player.dir;
  } else if (player.moveTarget) {
    const dx = player.moveTarget.x - player.x;
    const dy = player.moveTarget.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
      player.moveTarget = null;
      if (player.pendingInteract) {
        const station = player.pendingInteract;
        player.pendingInteract = null;
        return station;
      }
    } else {
      player.x += (dx / distance) * PLAYER_SPEED * dt;
      player.y += (dy / distance) * PLAYER_SPEED * dt;
      player.dir = dx !== 0 ? Math.sign(dx) : player.dir;
    }
  }
  player.x = Math.min(FLOOR.x + FLOOR.width - PLAYER_RADIUS, Math.max(FLOOR.x + PLAYER_RADIUS, player.x));
  player.y = Math.min(FLOOR.y + FLOOR.height - PLAYER_RADIUS, Math.max(FLOOR.y + PLAYER_RADIUS, player.y));
  return null;
}

function tickProcessors(game, dt, sound) {
  const nasi = game.stations.nasi;
  if (nasi.stock < RICE_MAX) {
    nasi.refill += dt;
    if (nasi.refill >= RICE_REFILL_SECONDS) {
      nasi.refill = 0;
      nasi.stock += 1;
    }
  }
  for (const id of ['grill', 'wok', 'chop']) {
    for (const [slotIndex, slot] of game.stations[id].slots.entries()) {
      if (!slot.active || slot.t >= slot.dur) continue;
      const before = slot.t;
      slot.t += dt;
      // Steam puffs while food is cooking.
      if (game.rng() < dt * 2.5) {
        const sx = STATIONS[id].x + STATIONS[id].width - 58 + slotIndex * 28 + 12;
        addParticles(game, sx, STATIONS[id].y + 34, '#e9ecef', 1);
      }
      if (before < slot.dur && slot.t >= slot.dur) {
        sound.cookDone();
        addParticles(game, STATIONS[id].x + STATIONS[id].width / 2, STATIONS[id].y + 30, '#fff', 5);
      }
      // Sizzle crackle while the station is hot.
      if (slot.active && slot.t < slot.dur && game.rng() < dt * 5) sound.sizzleTick();
    }
  }
}

function tickOrders(game, dt, sound) {
  for (const order of [...game.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      expireOrder(game, order);
      sound.fail();
      if (game.stars <= 0) { endDay(game, 'Reputasi habis — pelanggan kabur!'); return; }
    }
  }
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    const spawned = spawnOrder(game);
    if (spawned) sound.orderIn();
    game.spawnTimer = spawnInterval(game);
  }
}

function handleClick(game, input, sound) {
  const click = input.takeClick();
  if (!click) return;
  // Clicking a station walks there and interacts on arrival; clicking the floor walks there.
  let clickedStation = null;
  for (const id of Object.keys(STATIONS)) {
    const station = STATIONS[id];
    if (click.x >= station.x && click.x <= station.x + station.width && click.y >= station.y && click.y <= station.y + station.height) {
      clickedStation = station;
      break;
    }
  }
  if (clickedStation) {
    game.player.moveTarget = frontPoint(clickedStation);
    game.player.pendingInteract = clickedStation;
    return;
  }
  if (click.y >= FLOOR.y && click.y <= FLOOR.y + FLOOR.height) {
    game.player.moveTarget = { x: click.x, y: click.y };
    game.player.pendingInteract = null;
  }
}

export function updateGame(game, input, dt, sound) {
  if (game.screen === 'title') {
    handleClick(game, input, sound);
    if (input.wasPressed('enter') || input.wasPressed(' ')) {
      sound.ensure();
      startDay(game);
    }
    return;
  }
  if (game.screen === 'over') {
    if (input.wasPressed('r') || input.wasPressed('enter') || input.takeClick()) {
      sound.ensure();
      startDay(game);
    }
    return;
  }
  if (input.wasPressed('p')) game.paused = !game.paused;
  if (input.wasPressed('m')) sound.setMuted(!sound.muted);
  if (game.paused) return;

  if (input.wasPressed('e') || input.wasPressed(' ')) {
    sound.ensure();
    const station = nearestStation(game);
    if (station) interact(game, station, sound);
  }
  handleClick(game, input, sound);
  const arrived = movePlayer(game, input, dt);
  if (arrived) interact(game, arrived, sound);

  game.time += dt;
  game.timeLeft = Math.max(0, DAY_SECONDS - game.time);
  if (game.timeLeft <= RUSH_SECONDS && !game.rushing) {
    game.rushing = true;
    game.message = 'SERVICE RUSH! Pesanan makin cepat!';
    game.messageTimer = 2.5;
    sound.rush();
  }
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.flash > 0) game.flash -= dt;

  tickProcessors(game, dt, sound);
  tickOrders(game, dt, sound);
  if (game.screen !== 'play') return;

  for (const float of game.floats) { float.y -= 34 * dt; float.life -= dt; }
  game.floats = game.floats.filter((float) => float.life > 0);
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 60 * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);

  sound.update(dt, game.rushing);
  if (game.timeLeft <= 0) endDay(game, game.stars > 0 ? 'Hari selesai!' : 'Reputasi habis!');
}

export { GRILL_SLOTS };
