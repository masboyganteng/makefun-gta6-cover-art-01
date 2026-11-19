# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/masboyganteng/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/masboyganteng/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover art — the multi-panel poster look, bold condensed lettering, and a Vice City neon-sunset colour grade — exported as a PNG to share. Built for the [make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** upload one or more photos (file picker or drag-and-drop), or load the bundled sample photos. One photo can fill every panel, or each panel can hold its own.
- **Multi-panel layouts:** Hero + 3, Four Grid, Tilted Snapshots, and Full-Bleed — the classic poster grid, all drawn on canvas.
- **Crop & position per panel:** click a panel to select it, drag to pan the photo, scroll or use the slider to zoom, reset any time.
- **Caption editor:** big condensed title (four styles: sunset gradient, neon outline, solid white, chrome), a script subtitle, and a size slider.
- **Colour grades:** Sunset, Neon Nights, Vice, Dusk, and Gold Hour — warm washes, cool shadows, halftone dots, film grain, and a vignette, all applied per panel.
- **Post sizes:** 1080 × 1080 square, 1080 × 1350 portrait, 1920 × 1080 wide — one click exports a full-resolution PNG.
- **Extras:** randomize layout/grade/style, shuffle photos across panels, and your last cover is remembered on this machine.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no upload — everything runs from the static files under `app/`. Photos are read on your own machine and never leave it.

Open `http://localhost:8080/?demo=1` to see it with the sample photos loaded, or `?shot=cover&size=wide&caption=Sunset%20Heist` for a full-frame exported cover (the scenes the screenshots were taken from).

## Screenshots

`screenshots/` holds four real renders of this app: the wide exported cover (`1-cover.jpg`, first by name, so it is the entry's cover image), the editor with both sample photos loaded (`2-editor.jpg`), the portrait exported cover (`3-cover.jpg`), and the square exported cover (`4-cover.jpg`). Each was captured from the app itself in headless Chrome — no editing, no compositing.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor chrome (dark neon UI)
- `app/src/main.js` — editor wiring: photos, panels, export
- `app/src/state.js` — cover state (photos, panels, caption, grade, size)
- `app/src/layouts.js` — the four panel layouts
- `app/src/grades.js` — the five colour grades
- `app/src/render.js` — the canvas cover renderer
- `app/src/shots.js` — demo / screenshot scenes (`?demo=1`, `?shot=cover`, `?shot=editor`)
- `app/samples/` — two sample photos made for make.fun, free to use

## Originality

All art, lettering, and effects are drawn by this app's own code and CSS. No Rockstar Games logo, wordmark, official artwork, character, or font is used. The lettering uses system fonts (Arial Black and a script fallback). The sample photos were made for make.fun and are free to use.

## License

MIT — see `LICENSE`.
