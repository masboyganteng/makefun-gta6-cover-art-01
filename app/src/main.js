// Vice Cover Studio — editor wiring: photos in, panels, caption, grade, size,
// and one-click PNG export. All work offline; photos are read on this machine.

import {
  POST_SIZES, createDefaultState, assignPhotoToPanel, fillAllPanels,
  spreadPhotosAcrossPanels, resetPanelCrop, panSelectedPanel, zoomSelectedPanel,
  serialiseState, restoreState, clamp, randomiseCover,
} from './state.js';
import { LAYOUTS, LAYOUT_IDS, applyLayout, panelAt, layoutRects } from './layouts.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { drawCover, renderCoverCanvas } from './render.js';
import { parseShotParams, loadSamplePhotos, loadImage, applyShotParams } from './shots.js';

const $ = (id) => document.getElementById(id);
const state = createDefaultState();
const preview = $('preview');
const previewCtx = preview.getContext('2d');
const params = parseShotParams();
const isShotCover = params.shot === 'cover';

let saveTimer = 0;

function status(msg) {
  $('status').textContent = msg;
}

// ---- preview rendering ----
// The preview canvas is sized to the post size's aspect at ~960 px long side.
function previewSize() {
  const size = POST_SIZES[state.sizeId];
  const longSide = 960;
  const scale = longSide / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function renderPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(previewCtx, w, h, state, { highlightPanel: state.selectedPanel });
  $('exportSizeLabel').textContent = POST_SIZES[state.sizeId].sub;
  $('zoomSlider').value = Math.round((state.panels[state.selectedPanel]?.zoom || 1) * 100);
  scheduleSave();
}

function scheduleSave() {
  if (isShotCover) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem('vice-cover-studio', serialiseState(state)); } catch { /* private mode */ }
  }, 400);
}

// ---- choice grids ----
function buildChoiceGrid(el, items, activeId, onPick) {
  el.innerHTML = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice' + (item.id === activeId ? ' active' : '');
    btn.innerHTML = `${item.swatch ? `<span class="grade-swatch" style="display:block;background:${item.swatch}"></span>` : ''}<span class="name">${item.name}</span><span class="sub">${item.sub}</span>`;
    btn.addEventListener('click', () => { onPick(item.id); buildChoiceGrid(el, items, item.id, onPick); });
    el.appendChild(btn);
  }
}

function buildLayoutGrid() {
  buildChoiceGrid($('layoutGrid'), LAYOUT_IDS.map((id) => ({ id, ...LAYOUTS[id] })), state.layoutId, (id) => {
    applyLayout(state, id);
    renderPreview(); renderPanelBar();
    status(`Layout: ${LAYOUTS[id].name}.`);
  });
}

function buildGradeGrid() {
  buildChoiceGrid($('gradeGrid'), GRADE_IDS.map((id) => ({ id, ...GRADES[id] })), state.gradeId, (id) => {
    state.gradeId = id;
    renderPreview();
    status(`Grade: ${GRADES[id].name}.`);
  });
}

function buildSizeGrid() {
  buildChoiceGrid($('sizeGrid'), Object.entries(POST_SIZES).map(([id, s]) => ({ id, name: s.label, sub: s.sub })), state.sizeId, (id) => {
    state.sizeId = id;
    renderPreview();
    status(`Post size: ${POST_SIZES[id].label} ${POST_SIZES[id].sub}.`);
  });
}

// ---- photos ----
function photoThumbURL(img) {
  return img.currentSrc || img.src;
}

function renderPhotoRow() {
  const row = $('photoRow');
  row.innerHTML = '';
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'photo-thumb' + (i === state.activePhoto ? ' active' : '');
    thumb.src = photoThumbURL(img);
    thumb.alt = `Photo ${i + 1}`;
    thumb.title = `Place photo ${i + 1} in the selected panel`;
    thumb.addEventListener('click', () => {
      assignPhotoToPanel(state, state.selectedPanel, i);
      renderPreview(); renderPhotoRow();
      status(`Photo ${i + 1} placed in panel ${state.selectedPanel + 1}.`);
    });
    row.appendChild(thumb);
  });
}

function addPhotos(images) {
  if (!images.length) return;
  const firstNew = state.photos.length;
  state.photos.push(...images);
  if (state.photos.length === images.length) {
    // First photos ever: fill every panel with the first one.
    fillAllPanels(state, 0);
  } else if (images.length > 1) {
    spreadPhotosAcrossPanels(state);
  }
  state.activePhoto = firstNew;
  renderPhotoRow(); renderPreview();
  status(`${images.length} photo${images.length > 1 ? 's' : ''} loaded — click a panel, then drag to crop.`);
}

async function loadFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (!files.length) { status('That file is not an image — try a JPG or PNG.'); return; }
  const loaded = [];
  for (const file of files) {
    try {
      const url = URL.createObjectURL(file);
      loaded.push(await loadImage(url));
    } catch { /* skip unreadable files */ }
  }
  addPhotos(loaded);
}

async function loadSamples() {
  status('Loading sample photos…');
  const loaded = await loadSamplePhotos();
  if (!loaded.length) { status('Sample photos could not be loaded.'); return; }
  addPhotos(loaded);
}

// ---- panels ----
function renderPanelBar() {
  const bar = $('panelBar');
  bar.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'panel-chip' + (i === state.selectedPanel ? ' active' : '');
    const photoLabel = panel.photo >= 0 ? `photo ${panel.photo + 1}` : 'empty';
    chip.textContent = `Panel ${i + 1} · ${photoLabel}`;
    chip.addEventListener('click', () => {
      state.selectedPanel = i;
      renderPreview(); renderPanelBar();
    });
    bar.appendChild(chip);
  });
}

// Convert a pointer event to cover coordinates on the preview canvas.
function eventToCover(e) {
  const rect = preview.getBoundingClientRect();
  const sx = preview.width / rect.width;
  const sy = preview.height / rect.height;
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
}

function drawnPhotoSize(img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (panel.zoom || 1);
  return { dw: iw * scale, dh: ih * scale };
}

let drag = null;
preview.addEventListener('pointerdown', (e) => {
  const p = eventToCover(e);
  const hit = panelAt(state, p.x, p.y, preview.width, preview.height);
  if (hit >= 0) {
    state.selectedPanel = hit;
    renderPanelBar();
  }
  drag = { x: p.x, y: p.y, moved: false, panel: hit };
  preview.setPointerCapture(e.pointerId);
  preview.classList.add('dragging');
});
preview.addEventListener('pointermove', (e) => {
  if (!drag || drag.panel < 0) return;
  const p = eventToCover(e);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  if (!drag.moved) return;
  const panel = state.panels[drag.panel];
  const img = panel && panel.photo >= 0 ? state.photos[panel.photo] : null;
  if (!img) return;
  const rects = layoutRects(state, preview.width, preview.height);
  const { dw, dh } = drawnPhotoSize(img, rects[drag.panel], panel);
  // Dragging the photo moves it: centre point shifts opposite the drag.
  panSelectedPanel(state, dx / dw, dy / dh);
  drag.x = p.x; drag.y = p.y;
  renderPreview();
});
preview.addEventListener('pointerup', (e) => {
  preview.classList.remove('dragging');
  if (drag && !drag.moved && drag.panel >= 0) {
    state.selectedPanel = drag.panel;
    renderPreview(); renderPanelBar();
  }
  drag = null;
});
preview.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selectedPanel];
  if (!panel || panel.photo < 0) return;
  zoomSelectedPanel(state, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.92));
  renderPreview();
}, { passive: false });

// ---- export ----
function exportPNG() {
  const size = POST_SIZES[state.sizeId];
  const canvas = renderCoverCanvas(state, size.w, size.h);
  canvas.toBlob((blob) => {
    if (!blob) { status('Export failed — try again.'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-cover-${size.file}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    status(`Exported ${size.label} PNG ${size.sub} — check your downloads.`);
  }, 'image/png');
}

// ---- controls ----
function bindControls() {
  $('photoInput').addEventListener('change', (e) => loadFiles(e.target.files));
  const dz = $('dropzone');
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault(); dz.classList.remove('over');
    loadFiles(e.dataTransfer.files);
  });
  $('sampleBtn').addEventListener('click', loadSamples);
  $('clearPhotosBtn').addEventListener('click', () => {
    state.photos = [];
    state.panels.forEach((p) => { p.photo = -1; });
    renderPhotoRow(); renderPreview();
    status('Photos cleared.');
  });
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
  $('titleStyleSelect').addEventListener('change', (e) => { state.titleStyle = e.target.value; renderPreview(); });
  $('titleSizeSlider').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value) / 100;
    renderPreview();
  });
  $('zoomSlider').addEventListener('input', (e) => {
    zoomSelectedPanel(state, Number(e.target.value) / 100);
    renderPreview();
  });
  for (const [id, key] of [['halftoneToggle', 'halftone'], ['grainToggle', 'grain'], ['vignetteToggle', 'vignette'], ['frameToggle', 'frame']]) {
    $(id).addEventListener('change', (e) => { state[key] = e.target.checked; renderPreview(); });
  }
  $('fitBtn').addEventListener('click', () => {
    resetPanelCrop(state);
    renderPreview();
    status('Selected panel crop reset.');
  });
  $('shufflePhotosBtn').addEventListener('click', () => {
    spreadPhotosAcrossPanels(state);
    renderPreview(); renderPanelBar();
    status('Photos shuffled across the panels.');
  });
  $('exportBtn').addEventListener('click', exportPNG);
  $('exportBtn2').addEventListener('click', exportPNG);
  $('randomizeBtn').addEventListener('click', () => {
    const fresh = randomiseCover(state);
    applyLayout(state, fresh.layoutId);
    state.gradeId = fresh.gradeId;
    state.titleStyle = fresh.titleStyle;
    state.title = fresh.title;
    state.subtitle = fresh.subtitle;
    state.titleScale = fresh.titleScale;
    spreadPhotosAcrossPanels(state);
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('titleSizeSlider').value = Math.round(state.titleScale * 100);
    $('titleStyleSelect').value = state.titleStyle;
    buildLayoutGrid(); buildGradeGrid();
    renderPreview(); renderPanelBar();
    status(`Randomized: ${fresh.title} — hit Export when you like it.`);
  });
}

// ---- boot ----
async function boot() {
  bindControls();
  buildLayoutGrid(); buildGradeGrid(); buildSizeGrid();
  renderPanelBar();

  // Restore last session (caption, layout, grade…) when not in a shot scene.
  if (!params.demo && !params.shot) {
    try {
      const saved = localStorage.getItem('vice-cover-studio');
      if (saved) restoreState(state, saved);
    } catch { /* ignore */ }
  }
  applyShotParams(state, params);

  // Sync the controls with the (possibly restored / shot) state.
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('titleStyleSelect').value = state.titleStyle;
  $('titleSizeSlider').value = Math.round(state.titleScale * 100);
  $('halftoneToggle').checked = state.halftone;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  $('frameToggle').checked = state.frame;
  buildLayoutGrid(); buildGradeGrid(); buildSizeGrid();

  if (params.demo || params.shot) {
    const loaded = await loadSamplePhotos(params.photo || undefined);
    if (loaded.length) {
      addPhotos(loaded);
      // Spread the samples across the panels so the cover shows both photos.
      spreadPhotosAcrossPanels(state);
      renderPhotoRow(); renderPreview(); renderPanelBar();
    }
    if (isShotCover) {
      // Full-frame cover: render at export size into the preview canvas.
      const size = POST_SIZES[state.sizeId];
      preview.width = size.w;
      preview.height = size.h;
      drawCover(previewCtx, size.w, size.h, state);
      document.title = `Vice Cover — ${state.title}`;
    }
    status(params.shot === 'editor' ? 'Editor loaded with sample photos.' : 'Cover rendered.');
    return;
  }

  renderPhotoRow();
  renderPreview();
  status(state.photos.length ? 'Welcome back — your cover is ready.' : 'Load a photo to begin — or try the samples below.');
}

boot();
