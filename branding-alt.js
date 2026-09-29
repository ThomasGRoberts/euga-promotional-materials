// Experimental vector mark. Approved wordmark and colleague source files are separate.
// Icon defaults match the user's exported eu-stars-globe-concept-mark.svg (2026-09-29 19:09).
// Stable globe and star groups support animation without changing final vector geometry.
const alternateDefaults = Object.freeze({
  markSize: 220, gap: 36, markY: 0, textY: 0,
  starRadius: 75, starSize: 11, starSweep: 164, starY: -8,
  globeRadius: 76, globeX: 0, globeY: 0,
  outlineStroke: 3.4, gridStroke: 1.6, horizonStroke: 1.6,
});

const animationDefaults = Object.freeze({
  overallSpeed: 1, appearDuration: 250, rotationDuration: 850,
  disintegrationDuration: 650, starDuration: 800, revealDuration: 600,
  stageSpacing: 50, globeTurns: 1, fragmentDrift: 16,
});

const alternateGroups = [
  { title: 'Overall lockup', fields: [
    ['markSize', 'Mark size', 150, 260, 1, 'px'],
    ['gap', 'Mark–text gap', 0, 90, 1, 'px'],
    ['markY', 'Mark vertical shift', -40, 40, 1, 'px'],
    ['textY', 'Text vertical shift', -40, 40, 1, 'px'],
  ] },
  { title: 'EU stars', fields: [
    ['starRadius', 'Star-circle radius', 55, 96, 1, ' units'],
    ['starSize', 'Star size', 4, 13, 0.5, ' units'],
    ['starSweep', 'Arc extent', 130, 180, 1, '°'],
    ['starY', 'Stars vertical shift', -25, 25, 1, ' units'],
  ] },
  { title: 'Globe', fields: [
    ['globeRadius', 'Globe radius', 55, 84, 1, ' units'],
    ['globeX', 'Globe horizontal shift', -15, 15, 1, ' units'],
    ['globeY', 'Globe vertical shift', -15, 15, 1, ' units'],
    ['outlineStroke', 'Outer-circle stroke', 0.5, 5, 0.1, ' units'],
    ['gridStroke', 'Grid stroke', 0.4, 4, 0.1, ' units'],
    ['horizonStroke', 'Horizon stroke', 0.5, 5, 0.1, ' units'],
  ] },
];

const animationGroups = [{ title: 'Motion timing and character', fields: [
  ['overallSpeed', 'Overall speed', 0.6, 1.6, 0.05, '×'],
  ['appearDuration', 'Globe appearance', 150, 650, 25, ' ms'],
  ['rotationDuration', 'Polar rotation', 400, 1500, 25, ' ms'],
  ['disintegrationDuration', 'Upper-globe disintegration', 350, 1200, 25, ' ms'],
  ['starDuration', 'Star assembly', 450, 1400, 25, ' ms'],
  ['revealDuration', 'Wordmark unfurl', 300, 1100, 25, ' ms'],
  ['stageSpacing', 'Stage spacing (− = overlap)', -250, 300, 10, ' ms'],
  ['globeTurns', 'Polar turns', 0.5, 2, 0.1, '×'],
  ['fragmentDrift', 'Fragment drift', 6, 28, 1, ' units'],
] }];

const svgNS = 'http://www.w3.org/2000/svg';
const alternateValues = { ...alternateDefaults };
const animationValues = { ...animationDefaults };
const alternateInputs = new Map();
const alternateOutputs = new Map();
const animationInputs = new Map();
const animationOutputs = new Map();
const alternateControls = document.querySelector('#alternate-controls');
const alternateStage = document.querySelector('#alternate-stage');
const alternateArtboard = document.querySelector('#alternate-artboard');
const alternateLockup = document.querySelector('#alternate-lockup');
const alternateMark = document.querySelector('#alternate-mark');
const alternateStars = document.querySelector('#alternate-stars');
const alternateStatus = document.querySelector('#alternate-status');
const alternateType = document.querySelector('#alternate-type');
const alternateGlobeMotion = document.querySelector('#alternate-globe-motion');
const alternateHorizon = document.querySelector('#alternate-horizon');
const alternateGlobeClip = document.querySelector('#alternate-globe-clip');
const alternateOutline = document.querySelector('#alternate-globe-outline');
const alternateStaticGrid = document.querySelector('#alternate-grid');
let animationFrame = 0;
let animationStarted = 0;
let currentLayout = 'two-line';
let temporaryRotationGrid = null;
let temporaryFragments = null;

function alternateFormat(value, unit) {
  return `${Number(value).toString()}${unit}`;
}

function alternateFitPreview() {
  const width = alternateStage.clientWidth;
  const artboardWidth = currentLayout === 'single-line' ? 1240 : 880;
  const artboardHeight = currentLayout === 'single-line' ? 300 : 400;
  const scale = Math.min(1, width / artboardWidth);
  alternateArtboard.style.left = `${(width - artboardWidth * scale) / 2}px`;
  alternateArtboard.style.transform = `scale(${scale})`;
  alternateStage.style.height = `${artboardHeight * scale}px`;
}

function setSvg(id, attributes) {
  const node = document.getElementById(id);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
}

function makeStarPath(radius) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? radius * 0.43 : radius;
    points.push(`${(Math.cos(angle) * r).toFixed(3)} ${(Math.sin(angle) * r).toFixed(3)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

function renderStars(value) {
  const path = makeStarPath(value.starSize);
  // Seven independently addressable stars allow later fly-in/settle animation.
  for (let i = 0; i < 7; i++) {
    let star = alternateStars.children[i];
    if (!star) {
      star = document.createElementNS(svgNS, 'g');
      star.setAttribute('data-star-index', String(i));
      star.setAttribute('data-animation-part', 'star');
      star.append(document.createElementNS(svgNS, 'path'));
      alternateStars.append(star);
    }
    const angle = (270 - value.starSweep / 2 + i * value.starSweep / 6) * Math.PI / 180;
    const x = 110 + value.starRadius * Math.cos(angle);
    const y = 118 + value.starY + value.starRadius * Math.sin(angle);
    star.setAttribute('transform', `translate(${x.toFixed(3)} ${y.toFixed(3)})`);
    star.firstElementChild.setAttribute('d', path);
  }
}

function renderGlobe(value) {
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  setSvg('alternate-globe-clip', { y, height: 220 - y });
  setSvg('alternate-globe-outline', { cx: x, cy: y, r, 'stroke-width': value.outlineStroke });
  setSvg('alternate-longitude-one', { cx: x, cy: y, rx: (r * 0.42).toFixed(3), ry: r });
  setSvg('alternate-longitude-two', { cx: x, cy: y, rx: (r * 0.72).toFixed(3), ry: r });
  setSvg('alternate-meridian', { x1: x, x2: x, y1: y, y2: y + r });
  for (const [index, fraction] of [['one', 0.38], ['two', 0.72]]) {
    const dy = r * fraction;
    const halfWidth = Math.sqrt(r * r - dy * dy) * 0.97;
    setSvg(`alternate-latitude-${index}`, {
      d: `M ${(x - halfWidth).toFixed(3)} ${(y + dy).toFixed(3)} Q ${x} ${(y + dy + r * 0.08).toFixed(3)} ${(x + halfWidth).toFixed(3)} ${(y + dy).toFixed(3)}`,
    });
  }
  document.querySelector('#alternate-grid').setAttribute('stroke-width', String(value.gridStroke));
  setSvg('alternate-horizon', { x1: x - r, x2: x + r, y1: y, y2: y, 'stroke-width': value.horizonStroke });
}

function alternateRender() {
  const value = alternateValues;
  for (const [property, key] of [
    ['mark-size', 'markSize'], ['gap', 'gap'], ['mark-y', 'markY'], ['type-y', 'textY'],
  ]) alternateLockup.style.setProperty(`--alternate-${property}`, `${value[key]}px`);
  renderStars(value);
  renderGlobe(value);
  for (const group of alternateGroups) for (const [key, , , , , unit] of group.fields) {
    alternateOutputs.get(key).textContent = alternateFormat(value[key], unit);
  }
  const original = Object.keys(alternateDefaults).every(key => value[key] === alternateDefaults[key]);
  alternateStatus.textContent = original ? 'Showing your tuned icon' : 'Icon adjusted · approved logo unchanged';
}

function finishAnimation() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  animationStarted = 0;
  temporaryRotationGrid?.remove();
  temporaryFragments?.remove();
  temporaryRotationGrid = null;
  temporaryFragments = null;
  alternateGlobeMotion.removeAttribute('transform');
  alternateOutline.removeAttribute('stroke-dasharray');
  alternateOutline.removeAttribute('stroke-dashoffset');
  document.querySelector('#alternate-globe-window').style.removeProperty('opacity');
  alternateStaticGrid.style.removeProperty('opacity');
  alternateHorizon.style.removeProperty('opacity');
  alternateHorizon.removeAttribute('stroke-dasharray');
  alternateHorizon.removeAttribute('stroke-dashoffset');
  alternateType.style.removeProperty('clip-path');
  alternateType.style.removeProperty('transform');
  for (const star of alternateStars.children) star.style.removeProperty('opacity');
  renderStars(alternateValues);
  renderGlobe(alternateValues);
}

const clamp = value => Math.max(0, Math.min(1, value));
const easeOut = value => 1 - Math.pow(1 - clamp(value), 3);
const easeInOut = value => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

function makeSvg(tag, attributes = {}) {
  const node = document.createElementNS(svgNS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  return node;
}

function meridianPath(x, y, radius, degrees, from = -1, to = 1) {
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const latitude = from + (to - from) * i / 20;
    const px = x + radius * Math.sin(degrees * Math.PI / 180) * Math.sqrt(Math.max(0, 1 - latitude * latitude));
    points.push(`${i ? 'L' : 'M'} ${px.toFixed(3)} ${(y + radius * latitude).toFixed(3)}`);
  }
  return points.join(' ');
}

function createRotationGrid(value) {
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  const group = makeSvg('g', { id: 'alternate-rotation-grid', fill: 'none', stroke: '#003057', 'stroke-width': value.gridStroke });
  const meridians = [-46, -25, 0, 25, 46].map(() => {
    const path = makeSvg('path');
    group.append(path);
    return path;
  });
  for (const fraction of [-0.72, -0.38, 0.38, 0.72]) {
    const dy = r * fraction;
    const halfWidth = Math.sqrt(r * r - dy * dy) * 0.97;
    const direction = fraction < 0 ? -1 : 1;
    group.append(makeSvg('path', { d: `M ${(x - halfWidth).toFixed(3)} ${(y + dy).toFixed(3)} Q ${x} ${(y + dy + direction * r * 0.08).toFixed(3)} ${(x + halfWidth).toFixed(3)} ${(y + dy).toFixed(3)}` }));
  }
  alternateGlobeMotion.append(group);
  return { group, meridians };
}

function renderRotationGrid(paths, value, progress) {
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const phase = 360 * animationValues.globeTurns * easeInOut(progress);
  for (let i = 0; i < paths.length; i++) {
    const degrees = [-46, -25, 0, 25, 46][i] + phase;
    paths[i].setAttribute('d', meridianPath(x, y, value.globeRadius, degrees));
    paths[i].style.opacity = String(0.22 + 0.78 * Math.max(0, Math.cos(degrees * Math.PI / 180)));
  }
}

function createUpperFragments(value) {
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  const group = makeSvg('g', { id: 'alternate-upper-fragments', fill: 'none', stroke: '#003057', 'stroke-linecap': 'round' });
  const fragments = [];
  function addFragment(d, width, index) {
    const path = makeSvg('path', { d, 'stroke-width': width });
    group.append(path);
    fragments.push({ path, index });
  }
  for (let i = 0; i < 10; i++) {
    const points = [];
    for (let j = 0; j <= 4; j++) {
      const angle = Math.PI + Math.PI * (i + j / 4) / 10;
      points.push(`${j ? 'L' : 'M'} ${(x + r * Math.cos(angle)).toFixed(3)} ${(y + r * Math.sin(angle)).toFixed(3)}`);
    }
    addFragment(points.join(' '), value.outlineStroke, i);
  }
  for (const degrees of [-46, -25, 0, 25, 46]) {
    for (const [from, to] of [[-0.95, -0.7], [-0.66, -0.43], [-0.39, -0.14]]) {
      addFragment(meridianPath(x, y, r, degrees, from, to), value.gridStroke, fragments.length);
    }
  }
  document.querySelector('#alternate-globe').append(group);
  return { group, fragments };
}

function motionTimeline(motion) {
  const appear = { start: 0, end: motion.appearDuration };
  const rotation = { start: Math.max(0, appear.end + motion.stageSpacing) };
  rotation.end = rotation.start + motion.rotationDuration;
  const disintegration = { start: Math.max(0, rotation.end + motion.stageSpacing) };
  disintegration.end = disintegration.start + motion.disintegrationDuration;
  const stars = { start: Math.max(0, disintegration.end + motion.stageSpacing) };
  stars.end = stars.start + motion.starDuration;
  const text = { start: Math.max(0, stars.end + motion.stageSpacing) };
  text.end = text.start + motion.revealDuration;
  return { appear, rotation, disintegration, stars, text, end: text.end };
}

function renderMotionSummary() {
  const duration = motionTimeline(animationValues).end / animationValues.overallSpeed / 1000;
  const handoff = animationValues.stageSpacing < 0 ? `${Math.abs(animationValues.stageSpacing)} ms overlap` : `${animationValues.stageSpacing} ms gap`;
  document.querySelector('#animation-summary').textContent = `Approx. ${duration.toFixed(2)} seconds total · ${handoff} between stages. Negative spacing makes stages overlap.`;
}

function replayAnimation() {
  finishAnimation();
  renderMotionSummary();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const value = alternateValues;
  const motion = animationValues;
  const timeline = motionTimeline(motion);
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  const rotationGrid = createRotationGrid(value);
  const upper = createUpperFragments(value);
  temporaryRotationGrid = rotationGrid.group;
  temporaryFragments = upper.group;
  upper.group.style.display = 'none';
  const circumference = 2 * Math.PI * r;
  function frame(now) {
    if (!animationStarted) animationStarted = now;
    const t = (now - animationStarted) * motion.overallSpeed;
    const appearing = easeOut(t / motion.appearDuration);
    const rotating = clamp((t - timeline.rotation.start) / motion.rotationDuration);
    const dissolving = clamp((t - timeline.disintegration.start) / motion.disintegrationDuration);
    const dissolvingEase = easeInOut(dissolving);
    alternateOutline.setAttribute('stroke-dasharray', String(circumference));
    alternateOutline.setAttribute('stroke-dashoffset', String(circumference * (1 - appearing)));
    rotationGrid.group.style.opacity = String(appearing * (1 - dissolvingEase));
    renderRotationGrid(rotationGrid.meridians, value, rotating);
    alternateStaticGrid.style.opacity = String(dissolvingEase);
    // At the handoff, discrete upper arcs continue the circle while the lower clip settles.
    const brokenAway = dissolving > 0.08;
    const clipY = brokenAway ? y : y - r;
    alternateGlobeClip.setAttribute('y', String(clipY));
    alternateGlobeClip.setAttribute('height', String(220 - clipY));
    upper.group.style.display = dissolving > 0 ? '' : 'none';
    upper.group.style.opacity = String(Math.min(1, dissolving / 0.08));
    const fragmentProgress = clamp((dissolving - 0.08) / 0.92);
    for (const { path, index } of upper.fragments) {
      const stagger = (index % 7) * 0.035;
      const p = easeInOut((fragmentProgress - stagger) / (1 - stagger));
      const dx = ((index % 5) - 2) * 1.5 * p;
      const dy = -motion.fragmentDrift * (0.7 + (index % 4) * 0.13) * p;
      path.setAttribute('transform', `translate(${dx.toFixed(3)} ${dy.toFixed(3)})`);
      path.style.opacity = String(Math.pow(1 - p, 1.25));
    }
    alternateHorizon.style.opacity = String(dissolvingEase);
    alternateHorizon.setAttribute('stroke-dasharray', String(2 * r));
    alternateHorizon.setAttribute('stroke-dashoffset', String(2 * r * (1 - dissolvingEase)));
    const starPieceDuration = Math.min(300, motion.starDuration * 0.42);
    const starStep = (motion.starDuration - starPieceDuration) / 6;
    for (let i = 0; i < 7; i++) {
      const star = alternateStars.children[i];
      const p = easeOut((t - timeline.stars.start - i * starStep) / starPieceDuration);
      const angle = (270 - value.starSweep / 2 + i * value.starSweep / 6) * Math.PI / 180;
      const startAngle = angle - 0.4;
      const startRadius = value.starRadius + 20;
      const finalX = 110 + value.starRadius * Math.cos(angle);
      const finalY = 118 + value.starY + value.starRadius * Math.sin(angle);
      const startX = 110 + startRadius * Math.cos(startAngle);
      const startY = 118 + value.starY + startRadius * Math.sin(startAngle);
      const px = startX + (finalX - startX) * p;
      const py = startY + (finalY - startY) * p;
      star.setAttribute('transform', `translate(${px.toFixed(3)} ${py.toFixed(3)}) scale(${(0.65 + 0.35 * p).toFixed(3)})`);
      star.style.opacity = String(p);
    }
    const reveal = easeOut((t - timeline.text.start) / motion.revealDuration);
    alternateType.style.clipPath = `inset(0 ${(100 * (1 - reveal)).toFixed(3)}% 0 0)`;
    alternateType.style.transform = `translate(${(-18 * (1 - reveal)).toFixed(3)}px, ${value.textY}px)`;
    if (t >= timeline.end) finishAnimation();
    else animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}

function buildControls(groups, values, target, onInput, recordInputs, recordOutputs) {
  for (const group of groups) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'alternate-control-group';
    const legend = document.createElement('legend');
    legend.textContent = group.title;
    fieldset.append(legend);
    for (const [key, label, min, max, step, unit] of group.fields) {
      const wrapper = document.createElement('div');
      wrapper.className = 'alternate-control';
      const labelNode = document.createElement('label');
      labelNode.htmlFor = `alternate-${key}`;
      labelNode.append(document.createTextNode(label));
      const output = document.createElement('output');
      output.htmlFor = `alternate-${key}`;
      output.textContent = alternateFormat(values[key], unit);
      labelNode.append(output);
      const input = document.createElement('input');
      input.id = `alternate-${key}`;
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(values[key]);
      input.addEventListener('input', () => {
        values[key] = Number(input.value);
        output.textContent = alternateFormat(values[key], unit);
        onInput();
      });
      const ends = document.createElement('div');
      ends.className = 'range-ends';
      const low = document.createElement('span');
      low.textContent = alternateFormat(min, unit);
      const high = document.createElement('span');
      high.textContent = alternateFormat(max, unit);
      ends.append(low, high);
      wrapper.append(labelNode, input, ends);
      fieldset.append(wrapper);
      recordInputs.set(key, input);
      recordOutputs.set(key, output);
    }
    target.append(fieldset);
  }
}

buildControls(alternateGroups, alternateValues, alternateControls, () => {
  finishAnimation();
  alternateRender();
}, alternateInputs, alternateOutputs);
buildControls(animationGroups, animationValues, document.querySelector('#animation-controls'), replayAnimation, animationInputs, animationOutputs);

for (const button of document.querySelectorAll('.alternate-layout-switch button')) {
  button.addEventListener('click', () => {
    currentLayout = button.dataset.layout;
    for (const item of document.querySelectorAll('.alternate-layout-switch button')) {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    }
    alternateArtboard.dataset.layout = currentLayout;
    alternateLockup.dataset.layout = currentLayout;
    alternateFitPreview();
    replayAnimation();
  });
}

document.querySelector('#alternate-replay').addEventListener('click', replayAnimation);
document.querySelector('#alternate-motion-reset').addEventListener('click', () => {
  for (const [key, baseline] of Object.entries(animationDefaults)) {
    animationValues[key] = baseline;
    animationInputs.get(key).value = String(baseline);
  }
  for (const group of animationGroups) for (const [key, , , , , unit] of group.fields) {
    animationOutputs.get(key).textContent = alternateFormat(animationValues[key], unit);
  }
  replayAnimation();
});

document.querySelector('#alternate-reset').addEventListener('click', () => {
  finishAnimation();
  for (const [key, baseline] of Object.entries(alternateDefaults)) {
    alternateValues[key] = baseline;
    alternateInputs.get(key).value = String(baseline);
  }
  alternateRender();
});

document.querySelector('#alternate-export').addEventListener('click', () => {
  finishAnimation();
  const svg = alternateMark.cloneNode(true);
  svg.removeAttribute('id');
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'eu-stars-globe-concept-mark.svg';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

alternateRender();
alternateFitPreview();
new ResizeObserver(alternateFitPreview).observe(alternateStage);
window.addEventListener('resize', alternateFitPreview);
document.fonts.ready.then(replayAnimation);
