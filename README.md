# Warung Kilat — Game Memasak

Game memasak serba cepat yang dimainkan offline di browser desktop (keyboard + mouse).
Terima pesanan dari papan order, masak di lima stasiun dapur (rice cooker, panggangan,
wajan, talenan, dispenser es teh), susun hidangan di meja plating, dan sajikan di
jendela saji sebelum kesabaran pelanggan habis. 30 detik terakhir adalah Service Rush:
pesanan datang lebih cepat dan waktu makin sempit.

## Cara main

- **WASD / panah** — bergerak; **klik** lantai/stasiun juga bisa (jalan + pakai)
- **E / Spasi** — pakai stasiun terdekat
- **P** — jeda; **M** — suara; **R** — main lagi setelah hari selesai
- Satu hari = 150 detik, 3 bintang reputasi. Sajikan cepat untuk tip dan kombo.

## Jalankan

```sh
node serve.ts
# buka http://localhost:8080
```

Screenshot dibuat dari kode game sendiri lewat `?shot=cover|counter|assembly|serve`.

## Struktur

- `game/index.html` — halaman game
- `game/style.css` — chrome halaman
- `game/src/config.js` — konstanta, stasiun, resep
- `game/src/random.js` — RNG seed (mulberry32)
- `game/src/audio.js` — efek + musik dari WebAudio (tanpa file suara)
- `game/src/state.js` — state, pesanan, skor
- `game/src/input.js` — keyboard + mouse
- `game/src/logic.js` — update tiap frame: gerak, stasiun, pesanan, rush
- `game/src/render.js` — semua gambar di canvas
- `game/src/shots.js` — adegan screenshot
- `game/src/main.js` — boot + loop
- `main.ts` — program penyerahan (menyalin game/ + screenshots/ ke /output)
