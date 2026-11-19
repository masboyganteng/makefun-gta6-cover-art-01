// Vice Cover Studio — panel layouts. Each layout is a set of rectangles in
// fractions of the cover (x, y, w, h in 0..1) plus a title zone. The renderer
// draws the photos into these slots and the title block into the title zone.

export const LAYOUTS = {
  hero: {
    name: 'Hero + 3',
    sub: 'Big hero, three scenes',
    // Classic GTA poster: one large hero panel left, three stacked panels right,
    // title band across the bottom.
    panels: [
      { x: 0.03, y: 0.03, w: 0.60, h: 0.68 },
      { x: 0.66, y: 0.03, w: 0.31, h: 0.21 },
      { x: 0.66, y: 0.27, w: 0.31, h: 0.21 },
      { x: 0.66, y: 0.51, w: 0.31, h: 0.20 },
    ],
    title: { x: 0.03, y: 0.74, w: 0.94, h: 0.23, align: 'left' },
  },
  grid: {
    name: 'Four Grid',
    sub: 'Even 2 × 2 poster',
    panels: [
      { x: 0.03, y: 0.03, w: 0.455, h: 0.33 },
      { x: 0.515, y: 0.03, w: 0.455, h: 0.33 },
      { x: 0.03, y: 0.385, w: 0.455, h: 0.33 },
      { x: 0.515, y: 0.385, w: 0.455, h: 0.33 },
    ],
    title: { x: 0.03, y: 0.735, w: 0.94, h: 0.235, align: 'center' },
  },
  tilt: {
    name: 'Tilted Snaps',
    sub: 'Scattered snapshots',
    // Overlapping snapshots, slightly rotated, like photos tossed on a table.
    // The two top snaps lean apart; the two bottom ones tuck under them.
    panels: [
      { x: 0.04, y: 0.03, w: 0.52, h: 0.45, rot: -3 },
      { x: 0.52, y: 0.08, w: 0.44, h: 0.37, rot: 2.5 },
      { x: 0.07, y: 0.43, w: 0.42, h: 0.30, rot: 2 },
      { x: 0.53, y: 0.41, w: 0.40, h: 0.32, rot: -2 },
    ],
    title: { x: 0.03, y: 0.76, w: 0.94, h: 0.21, align: 'center' },
  },
  strip: {
    name: 'Full-Bleed',
    sub: 'One hero, film strip',
    // One photo fills the whole cover; a strip of three small panels sits
    // across the lower third, title over the top.
    panels: [
      { x: 0, y: 0, w: 1, h: 1 },
      { x: 0.03, y: 0.66, w: 0.30, h: 0.20 },
      { x: 0.35, y: 0.66, w: 0.30, h: 0.20 },
      { x: 0.67, y: 0.66, w: 0.30, h: 0.20 },
    ],
    title: { x: 0.03, y: 0.05, w: 0.94, h: 0.20, align: 'left', overPhoto: true },
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

export function layoutFor(state) {
  return LAYOUTS[state.layoutId] || LAYOUTS.hero;
}

// Pixel rectangles for a layout at a given cover size.
export function layoutRects(state, W, H) {
  const layout = layoutFor(state);
  return layout.panels.map((p) => ({
    x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H, rot: p.rot || 0,
  }));
}

export function titleRect(state, W, H) {
  const t = layoutFor(state).title;
  return { x: t.x * W, y: t.y * H, w: t.w * W, h: t.h * H, align: t.align, overPhoto: !!t.overPhoto };
}

// Hit-test: which panel index contains point (px, py) on a W×H cover?
export function panelAt(state, px, py, W, H) {
  const rects = layoutRects(state, W, H);
  // Later panels are drawn on top, so test them first.
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

// Rebuild the panel list when the layout changes, keeping each photo and
// crop where it was (extra panels start on the first photo).
export function applyLayout(state, layoutId) {
  const next = LAYOUTS[layoutId] || LAYOUTS.hero;
  const old = state.panels;
  state.layoutId = layoutId;
  state.panels = next.panels.map((_, i) => {
    const keep = old[i];
    if (keep) return keep;
    return { photo: old.length ? old[0].photo : -1, zoom: 1, cx: 0.5, cy: 0.5 };
  });
  if (state.selectedPanel >= state.panels.length) state.selectedPanel = 0;
}
