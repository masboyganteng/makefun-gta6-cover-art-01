// Vice Cover Studio — the cover renderer. drawCover paints a whole cover onto
// any 2D canvas at any pixel size: photos into the layout's panels, the grade
// wash over them, the bold title block, halftone, grain and vignette.
// Everything is drawn by code — no external images, no game artwork.

import { layoutRects, titleRect } from './layouts.js';
import { gradeFor } from './grades.js';

const TITLE_FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const SCRIPT_FONT = '"Brush Script MT", "Segoe Script", "Comic Sans MS", cursive';

// Deterministic grain tile, built once and tiled over the cover.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128; tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  let seed = 20261119;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

// Draw one photo into a panel rect with a cover fit, honouring the panel's
// zoom and centre point (cx, cy in 0..1 of the photo).
export function drawPhotoIntoPanel(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih || w <= 0 || h <= 0) return;
  const base = Math.max(w / iw, h / ih);
  const scale = base * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // The centre point picks which part of the photo the panel shows.
  const cx = (panel.cx ?? 0.5) * iw;
  const cy = (panel.cy ?? 0.5) * ih;
  const dx = x + w / 2 - cx * scale;
  const dy = y + h / 2 - cy * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// An empty panel: a sunset gradient with a dashed frame and a prompt.
function drawEmptyPanel(ctx, rect, grade, label) {
  const { x, y, w, h } = rect;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#2a1745');
  g.addColorStop(0.55, '#57204e');
  g.addColorStop(1, '#1c0f2e');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.setLineDash([Math.max(8, w * 0.02), Math.max(6, w * 0.015)]);
  ctx.strokeRect(x + w * 0.04, y + h * 0.06, w * 0.92, h * 0.88);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(13, w * 0.045)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label || '＋ ADD PHOTO', x + w / 2, y + h / 2);
}

// Warm wash + cool shadows over one panel, so every photo shares the grade.
function gradePanel(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  let wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.shadowTint;
  ctx.fillRect(x, y, w, h);
}

// The synthwave sun: a gradient disc sliced by horizontal gaps.
function drawSynthSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.5, '#ff7a18');
  g.addColorStop(1, grade.accent);
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20, 8, 32, 0.9)';
  let gap = r * 0.06;
  for (let i = 0; i < 5; i++) {
    const yy = cy + r * 0.05 + i * r * 0.17;
    ctx.fillRect(cx - r, yy, r * 2, gap);
    gap *= 1.45;
  }
  ctx.restore();
}

// Fit the title text to the zone, then paint it in the chosen style.
function drawTitleBlock(ctx, zone, state, grade, W) {
  const { x, y, w, h } = zone;
  const title = (state.title || 'UNTITLED').toUpperCase();
  const sub = state.subtitle || '';
  const base = Math.min(h * 0.52, w / Math.max(4, title.length * 0.62)) * (state.titleScale || 1);
  let size = base;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = zone.align === 'center' ? 'center' : 'left';
  const tx = zone.align === 'center' ? x + w / 2 : x;
  const setFont = (s) => { ctx.font = `900 ${s}px ${TITLE_FONT}`; };
  setFont(size);
  // Shrink until the title fits the zone.
  const maxW = w * 0.98;
  while (size > 12 && ctx.measureText(title).width > maxW) {
    size *= 0.94;
    setFont(size);
  }
  const titleY = y + h * 0.52;
  try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older canvas */ }

  // A faint synthwave sun behind the title, right side, for the poster feel.
  if (!zone.overPhoto) {
    const sunR = h * 0.42;
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawSynthSun(ctx, x + w - sunR * 0.9, y + h * 0.42, sunR, grade);
    ctx.restore();
  }

  // Outline + glow under the letters, then the fill per style.
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.shadowColor = grade.titleGlow;
  ctx.shadowBlur = size * 0.35;
  ctx.strokeText(title, tx, titleY);
  ctx.shadowBlur = 0;
  if (state.titleStyle === 'sunset') {
    const g = ctx.createLinearGradient(tx, titleY - size, tx, titleY + size * 0.15);
    g.addColorStop(0, '#fff7d6');
    g.addColorStop(0.45, '#ffb020');
    g.addColorStop(1, grade.accent);
    ctx.fillStyle = g;
  } else if (state.titleStyle === 'neon') {
    ctx.fillStyle = '#0b0616';
    ctx.strokeStyle = grade.accent2;
    ctx.lineWidth = Math.max(2, size * 0.03);
    ctx.strokeText(title, tx, titleY);
  } else if (state.titleStyle === 'chrome') {
    const g = ctx.createLinearGradient(tx, titleY - size, tx, titleY);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#c9d4e6');
    g.addColorStop(0.55, '#5b6b85');
    g.addColorStop(1, '#eef3fb');
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillText(title, tx, titleY);
  ctx.restore();

  // Script subtitle + neon rule under it.
  if (sub) {
    const subSize = Math.max(14, size * 0.42);
    ctx.save();
    ctx.font = `italic 700 ${subSize}px ${SCRIPT_FONT}`;
    ctx.textAlign = zone.align === 'center' ? 'center' : 'left';
    ctx.fillStyle = grade.accent2;
    ctx.shadowColor = grade.accent2;
    ctx.shadowBlur = subSize * 0.4;
    ctx.fillText(sub, tx, titleY + subSize * 1.25);
    ctx.restore();
    const ruleY = titleY + subSize * 1.75;
    const ruleW = Math.min(w * 0.5, ctx.measureText(title).width * 0.6);
    const rx = zone.align === 'center' ? tx - ruleW / 2 : tx;
    ctx.save();
    ctx.fillStyle = grade.accent;
    ctx.fillRect(rx, ruleY, ruleW, Math.max(2, size * 0.02));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx + ruleW + size * 0.12, ruleY + Math.max(2, size * 0.02) / 2, Math.max(3, size * 0.03), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
}

// Halftone dots along the top edge and the title zone.
function drawHalftone(ctx, W, H, grade) {
  const step = Math.max(14, W * 0.014);
  ctx.save();
  ctx.fillStyle = grade.accent;
  for (let yy = 0; yy < H * 0.10; yy += step) {
    for (let xx = 0; xx < W; xx += step) {
      const r = Math.max(1, (1 - yy / (H * 0.10)) * step * 0.22);
      ctx.globalAlpha = 0.35 * (1 - yy / (H * 0.10));
      ctx.beginPath();
      ctx.arc(xx + step / 2, yy + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Paint the whole cover. photos is an array of HTMLImageElements (or nulls).
// opts.highlightPanel draws a cyan selection ring around one panel (editor
// preview only — never on an export).
export function drawCover(ctx, W, H, state, opts = {}) {
  const grade = gradeFor(state);
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = grade.bg;
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state, W, H);
  const gap = state.frame ? Math.max(4, W * 0.008) : 0;

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const rot = rect.rot || 0;
    ctx.save();
    if (rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    // White frame border around the panel, like a poster print.
    if (state.frame) {
      ctx.fillStyle = '#f8f4ff';
      ctx.fillRect(-gap, -gap, rect.w + gap * 2, rect.h + gap * 2);
      ctx.fillStyle = '#12081f';
      ctx.fillRect(-gap * 0.4, -gap * 0.4, rect.w + gap * 0.8, rect.h + gap * 0.8);
    }
    const img = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (img) {
      drawPhotoIntoPanel(ctx, img, local, panel);
      gradePanel(ctx, local, grade);
    } else {
      drawEmptyPanel(ctx, local, grade, '＋ ADD PHOTO');
    }
    // Thin neon edge on the panel.
    ctx.strokeStyle = grade.accent;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(0, 0, rect.w, rect.h);
    ctx.globalAlpha = 1;
    // Selection ring for the editor preview (never on an export).
    if (opts.highlightPanel === i) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, W * 0.006);
      ctx.setLineDash([Math.max(10, W * 0.012), Math.max(6, W * 0.008)]);
      ctx.strokeRect(-gap * 1.5, -gap * 1.5, rect.w + gap * 3, rect.h + gap * 3);
      ctx.setLineDash([]);
    }
    ctx.restore();
  });

  // Title block (drawn after panels so it sits on top in the strip layout).
  const zone = titleRect(state, W, H);
  if (zone.overPhoto) {
    // A dark scrim behind the title so it reads over the photo.
    const scrim = ctx.createLinearGradient(0, zone.y - H * 0.04, 0, zone.y + zone.h);
    scrim.addColorStop(0, 'rgba(8, 4, 18, 0)');
    scrim.addColorStop(0.35, 'rgba(8, 4, 18, 0.55)');
    scrim.addColorStop(1, 'rgba(8, 4, 18, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, zone.y - H * 0.04, W, zone.h + H * 0.04);
  }
  drawTitleBlock(ctx, zone, state, grade, W);

  if (state.halftone) drawHalftone(ctx, W, H, grade);

  if (state.grain) {
    const tile = getGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (state.vignette) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5,2,12,0.5)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// Render the cover to a fresh canvas at export size and return it.
export function renderCoverCanvas(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), W, H, state);
  return canvas;
}
