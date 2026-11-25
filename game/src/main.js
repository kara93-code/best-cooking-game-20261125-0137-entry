// Warung Kilat — boot and frame loop.
// One job: wire the canvas, the input, the sound and the update/render tick.
// With ?shot=<name> it stages one screenshot scene and draws a single frame.

import { VIEW } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { updateGame } from './logic.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';
import { createGame } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '7');
const game = createGame(Number.isFinite(seed) ? seed : 7);
const input = new Input(canvas);
const sound = new SoundEngine();
const status = document.getElementById('status');

function announce() {
  if (!status) return;
  status.textContent = `Warung Kilat: ${game.served} pesanan tersaji, ${game.coins} koin, ${Math.ceil(game.timeLeft)} detik tersisa, ${game.stars} bintang.`;
}

if (params.get('shot')) {
  stageShot(params.get('shot'), game);
  renderGame(ctx, game);
  announce();
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateGame(game, input, dt, sound);
    renderGame(ctx, game);
    input.endFrame();
    announce();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
