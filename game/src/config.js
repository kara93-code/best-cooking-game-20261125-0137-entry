// Warung Kilat — constants, stations, recipes and tuning.
// One job: every number and name the rest of the game reads lives here.

export const VIEW = { width: 1280, height: 800 };

export const DAY_SECONDS = 150;
export const RUSH_SECONDS = 30;
export const MAX_ORDERS = 4;
export const MAX_STARS = 3;
export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 26;
export const INTERACT_RANGE = 118;

// Walkable floor band: stations sit above and below it, never inside it.
export const FLOOR = { x: 24, y: 238, width: 1232, height: 402 };

export const ITEMS = {
  Nasi: { emoji: '🍚', name: 'Nasi', color: '#fff3d6' },
  Ayam: { emoji: '🍗', name: 'Ayam Bakar', color: '#e8a04c' },
  Sayur: { emoji: '🥬', name: 'Sayur Potong', color: '#7dc383' },
  Mie: { emoji: '🍜', name: 'Mie', color: '#f2c14e' },
  Teh: { emoji: '🧋', name: 'Es Teh', color: '#d98a4b' },
};

export const RECIPES = [
  { id: 'nasi-ayam', name: 'Nasi Ayam', emoji: '🍛', items: ['Nasi', 'Ayam'], price: 14 },
  { id: 'mie-goreng', name: 'Mie Goreng', emoji: '🍜', items: ['Mie', 'Sayur'], price: 13 },
  { id: 'nasi-goreng', name: 'Nasi Goreng', emoji: '🍲', items: ['Nasi', 'Sayur'], price: 12 },
  { id: 'mie-ayam', name: 'Mie Ayam', emoji: '🍜', items: ['Mie', 'Ayam'], price: 15 },
  { id: 'es-teh', name: 'Es Teh', emoji: '🧋', items: ['Teh'], price: 8 },
  { id: 'komplit', name: 'Komplit Kilat', emoji: '🍱', items: ['Nasi', 'Ayam', 'Sayur'], price: 22 },
  { id: 'nasi-campur', name: 'Nasi Campur', emoji: '🥡', items: ['Nasi', 'Mie', 'Sayur'], price: 20 },
];

// Early orders are simple; the 3-item dishes only appear once the rush builds.
export const EARLY_RECIPES = ['nasi-ayam', 'mie-goreng', 'nasi-goreng', 'es-teh'];
export const LATE_RECIPES = ['mie-ayam', 'komplit', 'nasi-campur'];

export const STATIONS = {
  nasi: { id: 'nasi', label: 'Rice Cooker', hint: 'Ambil Nasi', x: 40, y: 128, width: 180, height: 84, emoji: '🍚', tint: '#f6d9a0' },
  grill: { id: 'grill', label: 'Panggangan Ayam', hint: 'Bakar Ayam', x: 260, y: 128, width: 180, height: 84, emoji: '🔥', tint: '#e88f5a' },
  wok: { id: 'wok', label: 'Wajan Mie', hint: 'Masak Mie', x: 480, y: 128, width: 180, height: 84, emoji: '🥘', tint: '#f2c14e' },
  chop: { id: 'chop', label: 'Talenan Sayur', hint: 'Potong Sayur', x: 700, y: 128, width: 180, height: 84, emoji: '🔪', tint: '#8fce8f' },
  teh: { id: 'teh', label: 'Dispenser Es Teh', hint: 'Ambil Es Teh', x: 920, y: 128, width: 180, height: 84, emoji: '🧋', tint: '#d98a4b' },
  plating: { id: 'plating', label: 'Meja Plating', hint: 'Susun di Piring', x: 80, y: 668, width: 340, height: 92, emoji: '🍽️', tint: '#cfe3ff' },
  trash: { id: 'trash', label: 'Sampah', hint: 'Buang', x: 460, y: 668, width: 110, height: 92, emoji: '🗑️', tint: '#b9b9c4' },
  serve: { id: 'serve', label: 'Jendela Saji', hint: 'Sajikan!', x: 620, y: 660, width: 580, height: 100, emoji: '🔔', tint: '#ffd166' },
};

export const STATION_ORDER = ['nasi', 'grill', 'wok', 'chop', 'teh', 'plating', 'trash', 'serve'];

export const COOK_TIME = { grill: 4, wok: 3, chop: 2.5 };
export const GRILL_SLOTS = 2;
export const RICE_MAX = 3;
export const RICE_REFILL_SECONDS = 5;

// Special (gold) orders: rare, pay 1.5x, but patience runs out faster.
// A serve while patience is still above the threshold pays a PERFECT bonus.
// During SERVICE RUSH every serve pays a RUSH bonus on top.
export const SPECIAL_CHANCE = 0.15;
export const SPECIAL_PAY_MULT = 1.5;
export const SPECIAL_PATIENCE_MULT = 0.7;
export const PERFECT_THRESHOLD = 0.6;
export const PERFECT_BONUS_MULT = 1.5;
export const RUSH_BONUS_MULT = 1.25;

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, index) => item === sortedB[index]);
}
