// Vice Cover Studio — screenshot / demo scenes. The app reads its own query
// string so a headless browser can capture a real cover or the editor:
//   ?demo=1            load the bundled sample photos and render a cover
//   ?shot=cover&photo=pier&caption=Sunset%20Heist   full-frame exported cover
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen   the editor at work
//   &size=square|portrait|wide   which post size the cover scene shows
//   &layout=hero|grid|tilt|strip&grade=sunset|neon|vice|dusk|gold

import { POST_SIZES } from './state.js';
import { LAYOUT_IDS } from './layouts.js';
import { GRADE_IDS } from './grades.js';

export const SAMPLE_PHOTOS = [
  { name: 'boulevard', src: './samples/boulevard.jpg' },
  { name: 'pier', src: './samples/pier.jpg' },
];

export function parseShotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    demo: q.get('demo') === '1',
    shot: q.get('shot') || '',
    photo: q.get('photo') || '',
    caption: q.get('caption') || '',
    size: POST_SIZES[q.get('size')] ? q.get('size') : 'square',
    layout: LAYOUT_IDS.includes(q.get('layout')) ? q.get('layout') : '',
    grade: GRADE_IDS.includes(q.get('grade')) ? q.get('grade') : '',
  };
}

// Load an image file by URL and resolve with the HTMLImageElement.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

// Load the bundled samples (or one named sample first), in order.
export async function loadSamplePhotos(preferredName) {
  const ordered = [...SAMPLE_PHOTOS];
  if (preferredName) {
    ordered.sort((a, b) => (a.name === preferredName ? 0 : 1) - (b.name === preferredName ? 0 : 1));
  }
  const loaded = [];
  for (const sample of ordered) {
    try {
      loaded.push(await loadImage(sample.src));
    } catch {
      // A missing sample is skipped; the cover still renders with the rest.
    }
  }
  return loaded;
}

// Apply the shot/demo query to the state before the first render.
export function applyShotParams(state, params) {
  if (params.caption) state.title = params.caption.toUpperCase();
  if (params.layout) state.layoutId = params.layout;
  if (params.grade) state.gradeId = params.grade;
  if (params.size) state.sizeId = params.size;
  if (params.shot === 'cover') document.body.classList.add('shot-cover');
  return params.shot === 'cover' || params.demo;
}
