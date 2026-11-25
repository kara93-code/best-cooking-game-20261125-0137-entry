// Warung Kilat — every pixel the player sees.
// One job: draw the kitchen, the orders, the chef, the HUD and the screens.

import { DAY_SECONDS, FLOOR, ITEMS, PLAYER_RADIUS, RUSH_SECONDS, STATIONS, STATION_ORDER, VIEW, recipeById } from './config.js';
import { nearestStation } from './logic.js';
import { findMatchingOrder } from './state.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function patienceColor(fraction) {
  if (fraction > 0.55) return '#51cf66';
  if (fraction > 0.28) return '#fab005';
  return '#fa5252';
}

function drawOrderCard(ctx, order, x, y, width, height, highlight, time) {
  const fraction = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  if (highlight) {
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = '#fff9e6';
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = highlight ? '#fab005' : '#e9c46a';
  ctx.lineWidth = highlight ? 3 : 1.5;
  roundRect(ctx, x, y, width, height, 10);
  ctx.stroke();
  if (order.special) {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 3;
    roundRect(ctx, x + 3, y + 3, width - 6, height - 6, 8);
    ctx.stroke();
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('★ SPESIAL', x + width - 8, y + 14);
    ctx.textAlign = 'left';
  }
  if (fraction < 0.25) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.55 * pulse;
    ctx.strokeStyle = '#fa5252';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 10);
    ctx.stroke();
    ctx.restore();
  }
  ctx.font = '34px serif';
  ctx.fillText(order.recipe.emoji, x + 10, y + 42);
  ctx.fillStyle = '#33302a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(order.recipe.name, x + 52, y + 24);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#6b6257';
  const parts = order.recipe.items.map((item) => ITEMS[item].emoji).join('  +  ');
  ctx.fillText(parts, x + 52, y + 44);
  ctx.fillStyle = '#8a6d1a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${order.reward} koin`, x + 52, y + 64);
  ctx.fillStyle = '#e9ecef';
  roundRect(ctx, x + 10, y + height - 14, width - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = patienceColor(fraction);
  roundRect(ctx, x + 10, y + height - 14, (width - 20) * fraction, 8, 4);
  ctx.fill();
  ctx.fillStyle = fraction < 0.28 ? '#c92a2a' : '#495057';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.ceil(order.patience)} dtk`, x + width - 52, y + 64);
}

function drawStation(ctx, game, station) {
  const near = game.screen === 'play' && nearestStation(game) === station;
  const ready = station.id === 'grill' || station.id === 'wok' || station.id === 'chop'
    ? game.stations[station.id].slots.some((slot) => slot.active && slot.t >= slot.dur)
    : station.id === 'nasi' ? game.stations.nasi.stock > 0 : true;
  ctx.save();
  if (near) {
    ctx.shadowColor = '#ffd43b';
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = '#8b5e34';
  roundRect(ctx, station.x, station.y, station.width, station.height, 12);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = station.tint;
  roundRect(ctx, station.x + 4, station.y + 4, station.width - 8, 34, 8);
  ctx.fill();
  ctx.fillStyle = '#3b2f23';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x + station.width / 2, station.y + 27);
  ctx.textAlign = 'left';
  ctx.font = '30px serif';
  ctx.fillText(station.emoji, station.x + 12, station.y + 72);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#fff8e7';
  ctx.fillText(station.hint, station.x + 48, station.y + 58);
  if (near) {
    ctx.fillStyle = '#ffd43b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('[E] pakai', station.x + 48, station.y + 76);
  }
  if (station.id === 'nasi') {
    for (let index = 0; index < 3; index += 1) {
      ctx.fillStyle = index < game.stations.nasi.stock ? '#fff3d6' : '#5c4632';
      ctx.beginPath();
      ctx.arc(station.x + station.width - 22 - index * 22, station.y + 62, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (station.id === 'grill' || station.id === 'wok' || station.id === 'chop') {
    const slots = game.stations[station.id].slots;
    slots.forEach((slot, index) => {
      const bx = station.x + station.width - 58 + index * 28;
      const by = station.y + 54;
      ctx.fillStyle = '#3b2f23';
      roundRect(ctx, bx, by, 24, 24, 5);
      ctx.fill();
      if (slot.active) {
        const fraction = Math.min(1, slot.t / slot.dur);
        ctx.fillStyle = slot.t >= slot.dur ? '#51cf66' : '#ffa94d';
        roundRect(ctx, bx + 2, by + 2, 20 * fraction, 20, 4);
        ctx.fill();
        if (slot.t >= slot.dur) {
          ctx.font = '16px serif';
          ctx.fillText('✓', bx + 4, by + 19);
        }
      } else {
        ctx.fillStyle = '#868e96';
        ctx.font = '14px serif';
        ctx.fillText('·', bx + 9, by + 18);
      }
    });
  }
  if (station.id === 'plating') {
    const plate = game.stations.plate;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(station.x + station.width / 2, station.y + 58, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2;
    ctx.stroke();
    plate.forEach((item, index) => {
      ctx.font = '20px serif';
      ctx.fillText(ITEMS[item].emoji, station.x + station.width / 2 - 22 + index * 20, station.y + 66);
    });
  }
  if (station.id === 'serve') {
    const carriedPlate = game.player.carry === 'Plate' ? (game.player.carryItems || []) : null;
    const match = carriedPlate ? findMatchingOrder(game, carriedPlate) : null;
    ctx.fillStyle = match ? '#d3f9d8' : '#fff3bf';
    roundRect(ctx, station.x + 14, station.y + 44, station.width - 28, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#3b2f23';
    ctx.font = match ? 'bold 16px sans-serif' : 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(match ? `✅ ${match.recipe.name} — sajikan!` : 'Antar piring yang cocok ke sini', station.x + station.width / 2, station.y + 72);
    ctx.textAlign = 'left';
  }
}

function drawCustomers(ctx, game) {
  if (game.screen !== 'play') return;
  const faces = ['🧑', '👩', '👵', '👨'];
  const shirts = ['#e8590c', '#4c6ef5', '#2f9e44', '#fab005'];
  game.orders.forEach((order, index) => {
    const x = 700 + index * 130;
    const y = 596;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + 34, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Colored body so the customer reads against the pale floor.
    ctx.fillStyle = shirts[index % shirts.length];
    ctx.beginPath();
    ctx.arc(x, y + 18, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.fillText(faces[index % faces.length], x, y + 14);
    ctx.fillStyle = '#fff9e6';
    ctx.beginPath();
    ctx.arc(x, y - 46, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e9c46a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '20px serif';
    ctx.fillText(order.recipe.emoji, x, y - 39);
    ctx.textAlign = 'left';
  });
}

function drawPlayer(ctx, game) {
  const player = game.player;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: apron over a shirt.
  ctx.fillStyle = '#e8590c';
  roundRect(ctx, -20, -6, 40, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  roundRect(ctx, -14, 2, 28, 22, 8);
  ctx.fill();
  // Head and chef hat.
  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(0, -18, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-9, -30, 9, 0, Math.PI * 2);
  ctx.arc(0, -34, 11, 0, Math.PI * 2);
  ctx.arc(9, -30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -30, 28, 6);
  ctx.fillStyle = '#212529';
  ctx.beginPath();
  ctx.arc(-5 + player.dir * 2, -19, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + player.dir * 2, -19, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -14, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item floats above the hat.
  if (player.carry) {
    ctx.fillStyle = '#fff9e6';
    ctx.beginPath();
    ctx.arc(0, -58, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e9c46a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    if (player.carry === 'Plate') {
      (player.carryItems || []).forEach((item, index) => {
        ctx.fillText(ITEMS[item].emoji, -18 + index * 18, -50);
      });
    } else {
      ctx.fillText(ITEMS[player.carry].emoji, 0, -50);
    }
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(0, 0, VIEW.width, 110);
  ctx.fillStyle = '#7a4f27';
  ctx.fillRect(0, 106, VIEW.width, 4);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('🍲 WARUNG KILAT', 16, 26);
  const carriedPlate = game.player.carry === 'Plate' ? (game.player.carryItems || []) : null;
  const match = carriedPlate ? findMatchingOrder(game, carriedPlate) : null;
  game.orders.forEach((order, index) => {
    drawOrderCard(ctx, order, 215 + index * 206, 12, 196, 86, match === order, game.time);
  });
  if (game.orders.length === 0) {
    ctx.fillStyle = '#ffe8cc';
    ctx.font = 'italic 15px sans-serif';
    ctx.fillText('Belum ada pesanan — siap-siap!', 210, 55);
  }
  const panelX = 1264;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 30px sans-serif';
  const minutes = Math.floor(game.timeLeft / 60);
  const seconds = Math.floor(game.timeLeft % 60);
  ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, panelX, 40);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#ffd43b';
  ctx.fillText(`🪙 ${game.coins}`, panelX, 68);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Saji: ${game.served}/9  •  ★ ${'★'.repeat(game.stars)}${'☆'.repeat(3 - game.stars)}`, panelX, 92);
  ctx.textAlign = 'left';
  const dayFraction = 1 - game.timeLeft / DAY_SECONDS;
  ctx.fillStyle = '#3b2f23';
  ctx.fillRect(16, 100, 160, 6);
  ctx.fillStyle = '#ffa94d';
  ctx.fillRect(16, 100, 160 * dayFraction, 6);
}

function drawFloor(ctx, game) {
  ctx.fillStyle = '#f3d9a4';
  ctx.fillRect(0, 110, VIEW.width, VIEW.height - 110);
  ctx.fillStyle = '#eec88f';
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.height; y += 56) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.width; x += 56) {
      if (((x + y) / 56) % 2 === 0) ctx.fillRect(x, y, 56, 56);
    }
  }
  ctx.strokeStyle = '#d9b06a';
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.width, FLOOR.height);
  // A rug in the middle of the floor and potted plants in the corners.
  ctx.fillStyle = 'rgba(224, 122, 63, 0.25)';
  roundRect(ctx, 440, 300, 400, 220, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(224, 122, 63, 0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 458, 318, 364, 184, 18);
  ctx.stroke();
  ctx.font = '44px serif';
  ctx.fillText('🪴', 56, 300);
  ctx.fillText('🪴', 1180, 300);
  ctx.fillText('🪴', 56, 620);
  ctx.fillText('🪴', 1180, 620);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#8a6d3b';
  ctx.fillText('WASD / Panah bergerak  •  E interaksi  •  Klik stasiun = jalan + pakai  •  P jeda  •  M suara', 30, 786);
  if (game.messageTimer > 0) {
    ctx.fillStyle = 'rgba(59,47,35,0.92)';
    roundRect(ctx, 380, 620, 520, 34, 10);
    ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, 640, 642);
    ctx.textAlign = 'left';
  }
}

function drawRush(ctx, game) {
  if (!game.rushing || game.screen !== 'play') return;
  const pulse = 0.5 + 0.5 * Math.sin(game.time * 6);
  ctx.save();
  ctx.strokeStyle = `rgba(224,49,49,${0.35 + 0.4 * pulse})`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, VIEW.width - 10, VIEW.height - 10);
  ctx.fillStyle = '#e03131';
  roundRect(ctx, 480, 118, 320, 36, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ SERVICE RUSH! ⚡', 640, 142);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(40,25,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff9e6';
  roundRect(ctx, 290, 130, 700, 500, 18);
  ctx.fill();
  ctx.strokeStyle = '#e9c46a';
  ctx.lineWidth = 4;
  roundRect(ctx, 290, 130, 700, 500, 18);
  ctx.stroke();
  ctx.fillStyle = '#5c3d1e';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍲 WARUNG KILAT', 640, 210);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#6b6257';
  ctx.fillText('Game memasak serba cepat — masak, susun, sajikan!', 640, 248);
  ctx.textAlign = 'left';
  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#33302a';
  const lines = [
    '🎯 Terima pesanan dari papan order, lalu rencanakan rute dapurmu.',
    '🍚 Ambil Nasi & Es Teh langsung. 🔥 Bakar Ayam, 🥘 masak Mie, 🔪 potong Sayur.',
    '🍽️ Susun bahan di Meja Plating (maks 3), angkat piringnya, sajikan di Jendela Saji.',
    '⏱️ Sajikan sebelum kesabaran pelanggan habis — makin cepat, makin besar tipnya.',
    '⭐ Pesanan emas bayar 1,5x • Saji cepat (sabar >60%) = bonus SEMPURNA +50%.',
    '⚡ 30 detik terakhir: SERVICE RUSH! Pesanan datang lebih cepat.',
    '⌨️ WASD / Panah bergerak • E interaksi • Klik stasiun untuk jalan & pakai • P jeda • M suara',
  ];
  lines.forEach((line, index) => ctx.fillText(line, 330, 300 + index * 32));
  ctx.fillStyle = '#e8590c';
  roundRect(ctx, 490, 510, 300, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▶  MULAI MASAK', 640, 550);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8a6d3b';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tekan Enter atau klik di mana saja', 640, 600);
  ctx.textAlign = 'left';
}

function drawOver(ctx, game) {
  ctx.fillStyle = 'rgba(40,25,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff9e6';
  roundRect(ctx, 340, 170, 600, 430, 18);
  ctx.fill();
  ctx.strokeStyle = '#e9c46a';
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 170, 600, 430, 18);
  ctx.stroke();
  const result = game.result || { reason: 'Hari selesai!', coins: 0, served: 0, expired: 0, stars: 0, rating: '' };
  ctx.fillStyle = '#5c3d1e';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(result.reason, 640, 240);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(result.rating, 640, 286);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#33302a';
  ctx.fillText(`🪙 Koin: ${result.coins}`, 640, 340);
  ctx.fillText(`🍽️ Pesanan tersaji: ${result.served}`, 640, 376);
  ctx.fillText(`💨 Pesanan hangus: ${result.expired}`, 640, 412);
  ctx.fillText(`★ Reputasi: ${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}`, 640, 448);
  ctx.fillStyle = '#e8590c';
  roundRect(ctx, 490, 490, 300, 60, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('↻  MASAK LAGI (R)', 640, 528);
  ctx.textAlign = 'left';
}

export function renderGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, game);
  for (const id of STATION_ORDER) drawStation(ctx, game, STATIONS[id]);
  drawCustomers(ctx, game);
  if (game.screen !== 'title') drawPlayer(ctx, game);
  for (const particle of game.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const float of game.floats) {
    ctx.globalAlpha = Math.max(0, float.life / 1.4);
    ctx.fillStyle = float.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(float.text, float.x, float.y);
    ctx.textAlign = 'left';
  }
  ctx.globalAlpha = 1;
  drawHud(ctx, game);
  drawRush(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(224,49,49,${game.flash * 0.35})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  if (game.paused && game.screen === 'play') {
    ctx.fillStyle = 'rgba(40,25,10,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸ JEDA — tekan P untuk lanjut', 640, 400);
    ctx.textAlign = 'left';
  }
  if (game.screen === 'title') drawTitle(ctx, game);
  if (game.screen === 'over') drawOver(ctx, game);
}
