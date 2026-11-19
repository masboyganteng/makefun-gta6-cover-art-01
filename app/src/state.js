// Vice Cover Studio — cover state: photos, panels, caption, grade, size.
// A cover is plain data; the renderer in render.js draws it at any pixel size.

export const POST_SIZES = {
  square: { label: 'Square', sub: '1080 × 1080', w: 1080, h: 1080, file: '1080x1080' },
  portrait: { label: 'Portrait', sub: '1080 × 1350', w: 1080, h: 1350, file: '1080x1350' },
  wide: { label: 'Wide', sub: '1920 × 1080', w: 1920, h: 1080, file: '1920x1080' },
};

export const TITLE_STYLES = {
  sunset: 'Sunset gradient',
  neon: 'Neon outline',
  solid: 'Solid white',
  chrome: 'Chrome',
};

// One panel: which photo it shows (index into state.photos, -1 = empty),
// plus a cover-fit crop: zoom >= 1 and a centre point (cx, cy in 0..1).
export function makePanel(photo = -1) {
  return { photo, zoom: 1, cx: 0.5, cy: 0.5 };
}

export function createDefaultState() {
  return {
    layoutId: 'hero',
    gradeId: 'sunset',
    sizeId: 'square',
    title: 'SUNSET HEIST',
    subtitle: 'Vice City',
    titleStyle: 'sunset',
    titleScale: 1,
    halftone: true,
    grain: true,
    vignette: true,
    frame: true,
    // photos live outside the serialisable state (HTMLImageElements)
    photos: [],
    // one panel per layout slot; layouts.js rebuilds this when the layout changes
    panels: [makePanel(0), makePanel(0), makePanel(0), makePanel(0)],
    selectedPanel: 0,
    activePhoto: 0,
  };
}

// Assign a photo to a panel, keeping its crop.
export function assignPhotoToPanel(state, panelIndex, photoIndex) {
  if (!state.panels[panelIndex]) return;
  state.panels[panelIndex].photo = photoIndex;
  state.activePhoto = photoIndex;
}

// Fill every panel with one photo (the classic single-photo cover).
export function fillAllPanels(state, photoIndex) {
  for (const panel of state.panels) panel.photo = photoIndex;
  state.activePhoto = photoIndex;
}

// Spread the loaded photos across the panels, round-robin.
export function spreadPhotosAcrossPanels(state) {
  const n = state.photos.length;
  if (n === 0) return;
  state.panels.forEach((panel, i) => { panel.photo = i % n; });
}

// Reset the selected panel's crop to the photo's centre.
export function resetPanelCrop(state, panelIndex = state.selectedPanel) {
  const panel = state.panels[panelIndex];
  if (!panel) return;
  panel.zoom = 1; panel.cx = 0.5; panel.cy = 0.5;
}

// Pan the selected panel by a fraction of the panel (dragging the photo).
export function panSelectedPanel(state, dxFraction, dyFraction) {
  const panel = state.panels[state.selectedPanel];
  if (!panel || panel.photo < 0) return;
  panel.cx = clamp(panel.cx - dxFraction, 0, 1);
  panel.cy = clamp(panel.cy - dyFraction, 0, 1);
}

// Zoom the selected panel; zoom 1 shows the whole photo, 3 is a tight crop.
export function zoomSelectedPanel(state, zoom) {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  panel.zoom = clamp(zoom, 1, 3);
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// A few invented titles for the Randomize button to cycle through.
export const SAMPLE_TITLES = [
  { title: 'SUNSET HEIST', subtitle: 'Vice City' },
  { title: 'NEON SHORE', subtitle: 'Vice City' },
  { title: 'PALM & CHROME', subtitle: 'Vice City' },
  { title: 'NIGHT SHIFT', subtitle: 'Vice City' },
  { title: 'PIER PRESSURE', subtitle: 'Vice City' },
  { title: 'GOLDEN GETAWAY', subtitle: 'Vice City' },
];

// Shuffle layout, grade, title style and title into a fresh combination.
export function randomiseCover(state, random = Math.random) {
  const pick = (arr) => arr[Math.floor(random() * arr.length)];
  const title = pick(SAMPLE_TITLES);
  return {
    layoutId: pick(['hero', 'grid', 'tilt', 'strip']),
    gradeId: pick(['sunset', 'neon', 'vice', 'dusk', 'gold']),
    titleStyle: pick(['sunset', 'neon', 'solid', 'chrome']),
    title: title.title,
    subtitle: title.subtitle,
    titleScale: 0.85 + random() * 0.35,
  };
}

// The state that can be saved (photos are reloaded, not serialised).
export function serialiseState(state) {
  const { photos, ...rest } = state;
  return JSON.stringify({ ...rest, panels: state.panels });
}

export function restoreState(state, json) {
  try {
    const saved = JSON.parse(json);
    if (!saved || typeof saved !== 'object') return false;
    for (const key of ['layoutId', 'gradeId', 'sizeId', 'title', 'subtitle', 'titleStyle',
      'titleScale', 'halftone', 'grain', 'vignette', 'frame', 'selectedPanel']) {
      if (saved[key] !== undefined) state[key] = saved[key];
    }
    if (Array.isArray(saved.panels)) {
      state.panels = saved.panels.map((p) => ({
        photo: typeof p.photo === 'number' ? p.photo : -1,
        zoom: clamp(Number(p.zoom) || 1, 1, 3),
        cx: clamp(Number(p.cx) || 0.5, 0, 1),
        cy: clamp(Number(p.cy) || 0.5, 0, 1),
      }));
    }
    return true;
  } catch {
    return false;
  }
}
