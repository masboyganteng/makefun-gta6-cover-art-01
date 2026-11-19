// Vice Cover Studio — colour grades. A grade is a set of canvas overlays that
// turn any photo into a Vice City neon-sunset look: a warm gradient wash, a
// cool shadow tint, a neon accent pair for the title and frame, and a
// background colour for the cover's bare areas.

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sub: 'Golden hour',
    swatch: 'linear-gradient(135deg,#ff9a3c,#ff2e88 55%,#7b2ff7)',
    bg: '#1c0f2e',
    // warm wash from the top, magenta pooling at the bottom
    washTop: 'rgba(255, 154, 60, 0.20)',
    washBottom: 'rgba(255, 46, 136, 0.30)',
    shadowTint: 'rgba(64, 32, 120, 0.16)',
    accent: '#ff2e88',
    accent2: '#ffb020',
    titleGlow: 'rgba(255, 46, 136, 0.55)',
  },
  neon: {
    name: 'Neon Nights',
    sub: 'Pink × cyan',
    swatch: 'linear-gradient(135deg,#ff2e88,#22d3ee 60%,#0b1030)',
    bg: '#070a1c',
    washTop: 'rgba(255, 46, 136, 0.22)',
    washBottom: 'rgba(34, 211, 238, 0.26)',
    shadowTint: 'rgba(8, 12, 48, 0.28)',
    accent: '#22d3ee',
    accent2: '#ff2e88',
    titleGlow: 'rgba(34, 211, 238, 0.6)',
  },
  vice: {
    name: 'Vice',
    sub: 'Pink + teal dusk',
    swatch: 'linear-gradient(135deg,#ff7ad9,#7b2ff7 50%,#12e6c8)',
    bg: '#160a24',
    washTop: 'rgba(255, 122, 217, 0.20)',
    washBottom: 'rgba(18, 230, 200, 0.18)',
    shadowTint: 'rgba(48, 16, 96, 0.20)',
    accent: '#ff7ad9',
    accent2: '#12e6c8',
    titleGlow: 'rgba(255, 122, 217, 0.55)',
  },
  dusk: {
    name: 'Dusk',
    sub: 'Purple night',
    swatch: 'linear-gradient(135deg,#7b2ff7,#1b1040 60%,#ff2e88)',
    bg: '#0e0a20',
    washTop: 'rgba(123, 47, 247, 0.24)',
    washBottom: 'rgba(255, 46, 136, 0.20)',
    shadowTint: 'rgba(10, 8, 32, 0.30)',
    accent: '#a78bfa',
    accent2: '#ff2e88',
    titleGlow: 'rgba(167, 139, 250, 0.55)',
  },
  gold: {
    name: 'Gold Hour',
    sub: 'Warm chrome',
    swatch: 'linear-gradient(135deg,#ffd166,#ff7a18 55%,#8a3b12)',
    bg: '#241208',
    washTop: 'rgba(255, 209, 102, 0.24)',
    washBottom: 'rgba(255, 122, 24, 0.26)',
    shadowTint: 'rgba(96, 40, 8, 0.18)',
    accent: '#ffb020',
    accent2: '#ff7a18',
    titleGlow: 'rgba(255, 176, 32, 0.55)',
  },
  // A grade is also the cover's bare background: every grade's bg is dark
  // enough that white panel frames and the title always read against it.
};

export const GRADE_IDS = Object.keys(GRADES);

export function gradeFor(state) {
  return GRADES[state.gradeId] || GRADES.sunset;
}
