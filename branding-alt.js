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
  disintegrationDuration: 650, starDuration: 900, revealDuration: 600,
  stageSpacing: 50, globeTurns: 1, starLaunchAngle: 140,
  textLead: 300, lineDelay: 180,
});

const svgNS = 'http://www.w3.org/2000/svg';
const alternateValues = { ...alternateDefaults };
const animationValues = { ...animationDefaults };
const alternateStage = document.querySelector('#alternate-stage');
const alternateArtboard = document.querySelector('#alternate-artboard');
const alternateLockup = document.querySelector('#alternate-lockup');
const alternateMark = document.querySelector('#alternate-mark');
const alternateStars = document.querySelector('#alternate-stars');
const alternateStatus = document.querySelector('#alternate-status');
const choiceVisual = document.querySelector('#concept-choice-visual');
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
let temporaryUpperWithdrawal = null;
let temporaryUpperClip = null;

function fitChoicePreview() {
  const preview = choiceVisual.firstElementChild;
  if (!preview) return;
  const width = preview.dataset.layout === 'single-line' ? 1440 : 1120;
  const height = preview.dataset.layout === 'single-line' ? 300 : 400;
  const scale = Math.min(1, choiceVisual.clientWidth / width);
  preview.style.left = '0px';
  preview.style.transform = `scale(${scale})`;
  choiceVisual.style.height = `${height * scale}px`;
}

function syncChoicePreview() {
  const preview = alternateArtboard.cloneNode(true);
  preview.id = 'brand-preview-artboard';
  for (const node of preview.querySelectorAll('[id]')) node.id = `brand-preview-${node.id}`;
  for (const node of preview.querySelectorAll('*')) {
    for (const attribute of node.attributes) {
      if (attribute.value.includes('url(#alternate-')) {
        node.setAttribute(attribute.name, attribute.value.replaceAll('url(#alternate-', 'url(#brand-preview-alternate-'));
      }
    }
  }
  preview.querySelector('#brand-preview-alternate-mark').setAttribute('data-brand-preview-mark', '');
  choiceVisual.replaceChildren(preview);
  fitChoicePreview();
}

function alternateFitPreview() {
  const width = alternateStage.clientWidth;
  const artboardWidth = currentLayout === 'single-line' ? 1440 : 1120;
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
  alternateStatus.textContent = 'Showing your tuned icon';
}

function finishAnimation() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  animationStarted = 0;
  temporaryRotationGrid?.remove();
  temporaryUpperWithdrawal?.remove();
  temporaryUpperClip?.remove();
  temporaryRotationGrid = null;
  temporaryUpperWithdrawal = null;
  temporaryUpperClip = null;
  alternateGlobeMotion.removeAttribute('transform');
  alternateOutline.removeAttribute('stroke-dasharray');
  alternateOutline.removeAttribute('stroke-dashoffset');
  document.querySelector('#alternate-globe-window').style.removeProperty('opacity');
  alternateStaticGrid.style.removeProperty('opacity');
  alternateHorizon.style.removeProperty('opacity');
  alternateHorizon.removeAttribute('stroke-dasharray');
  alternateHorizon.removeAttribute('stroke-dashoffset');
  for (const line of alternateType.querySelectorAll('.alternate-two-line > div,.alternate-single-line')) {
    line.style.removeProperty('clip-path');
    line.style.removeProperty('transform');
  }
  for (const star of alternateStars.children) star.style.removeProperty('opacity');
  renderStars(alternateValues);
  renderGlobe(alternateValues);
  syncChoicePreview();
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

function meridianPath(x, y, radius, degrees) {
  // Orthographic projection of a meridian is an exact half-ellipse, not a polyline.
  const projectedRadius = radius * Math.sin(degrees * Math.PI / 180);
  if (Math.abs(projectedRadius) < 0.01) return `M ${x} ${y - radius} L ${x} ${y + radius}`;
  const sweep = projectedRadius > 0 ? 1 : 0;
  return `M ${x} ${y - radius} A ${Math.abs(projectedRadius).toFixed(4)} ${radius} 0 0 ${sweep} ${x} ${y + radius}`;
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

function createUpperWithdrawal(value, rotatingGrid) {
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  const clip = makeSvg('clipPath', { id: 'alternate-upper-window' });
  clip.append(makeSvg('rect', { x: 0, y: 0, width: 220, height: y }));
  alternateMark.querySelector('defs').append(clip);
  const group = makeSvg('g', { id: 'alternate-upper-withdrawal', 'clip-path': 'url(#alternate-upper-window)', fill: 'none', stroke: '#003057' });
  const motion = makeSvg('g', { id: 'alternate-upper-withdrawal-motion' });
  motion.append(makeSvg('circle', { cx: x, cy: y, r, 'stroke-width': value.outlineStroke }));
  const upperGrid = rotatingGrid.cloneNode(true);
  upperGrid.removeAttribute('id');
  upperGrid.style.removeProperty('opacity');
  motion.append(upperGrid);
  group.append(motion);
  document.querySelector('#alternate-globe').append(group);
  return { group, motion, clip };
}

function motionTimeline(motion) {
  const appear = { start: 0, end: motion.appearDuration };
  const rotation = { start: Math.max(0, appear.end + motion.stageSpacing) };
  rotation.end = rotation.start + motion.rotationDuration;
  const disintegration = { start: Math.max(0, rotation.end + motion.stageSpacing) };
  disintegration.end = disintegration.start + motion.disintegrationDuration;
  const stars = { start: Math.max(0, disintegration.end + motion.stageSpacing) };
  stars.end = stars.start + motion.starDuration;
  const text = { start: Math.max(0, stars.end + motion.stageSpacing - motion.textLead) };
  text.end = text.start + motion.revealDuration + (currentLayout === 'two-line' ? motion.lineDelay : 0);
  return { appear, rotation, disintegration, stars, text, end: Math.max(text.end, stars.end, disintegration.end, rotation.end, appear.end) };
}

function replayAnimation() {
  finishAnimation();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const value = alternateValues;
  const motion = animationValues;
  const timeline = motionTimeline(motion);
  const x = 110 + value.globeX;
  const y = 118 + value.globeY;
  const r = value.globeRadius;
  const rotationGrid = createRotationGrid(value);
  temporaryRotationGrid = rotationGrid.group;
  let upper = null;
  const circumference = 2 * Math.PI * r;
  const fullTop = y - r - Math.max(4, value.outlineStroke);
  const activeLines = currentLayout === 'two-line'
    ? [...alternateType.querySelectorAll('.alternate-two-line > div')]
    : [alternateType.querySelector('.alternate-single-line')];
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
    if (t >= timeline.disintegration.start && !upper) {
      upper = createUpperWithdrawal(value, rotationGrid.group);
      temporaryUpperWithdrawal = upper.group;
      temporaryUpperClip = upper.clip;
    }
    // The upper strokes retreat toward the equator; the lower half stays in place.
    const clipY = upper ? y : fullTop;
    alternateGlobeClip.setAttribute('y', String(clipY));
    alternateGlobeClip.setAttribute('height', String(220 - clipY));
    if (upper) {
      const remainingHeight = 1 - 0.96 * dissolvingEase;
      upper.motion.setAttribute('transform', `translate(0 ${y * (1 - remainingHeight)}) scale(1 ${remainingHeight})`);
      upper.group.style.opacity = String(1 - easeInOut(clamp((dissolving - 0.28) / 0.72)));
    }
    alternateHorizon.style.opacity = String(dissolvingEase);
    alternateHorizon.setAttribute('stroke-dasharray', String(2 * r));
    alternateHorizon.setAttribute('stroke-dashoffset', String(2 * r * (1 - dissolvingEase)));
    const starPieceDuration = Math.min(600, motion.starDuration * 0.55);
    const starStep = (motion.starDuration - starPieceDuration) / 6;
    for (let i = 0; i < 7; i++) {
      const star = alternateStars.children[i];
      const p = easeInOut((t - timeline.stars.start - i * starStep) / starPieceDuration);
      const finalAngle = 270 - value.starSweep / 2 + i * value.starSweep / 6;
      const angle = (motion.starLaunchAngle + (finalAngle - motion.starLaunchAngle) * p) * Math.PI / 180;
      const radius = value.starRadius + 28 * (1 - easeOut(p)) + 7 * Math.sin(Math.PI * p);
      const px = 110 + radius * Math.cos(angle);
      const py = 118 + value.starY + radius * Math.sin(angle);
      star.setAttribute('transform', `translate(${px.toFixed(3)} ${py.toFixed(3)}) scale(${(0.5 + 0.5 * easeOut(p)).toFixed(3)})`);
      star.style.opacity = String(clamp(p * 1.7));
    }
    for (let i = 0; i < activeLines.length; i++) {
      const start = timeline.text.start + (i === 1 ? motion.lineDelay : 0);
      const reveal = easeOut((t - start) / motion.revealDuration);
      activeLines[i].style.clipPath = `inset(0 ${(100 * (1 - reveal)).toFixed(3)}% 0 0)`;
      activeLines[i].style.transform = `translateX(${(-18 * (1 - reveal)).toFixed(3)}px)`;
    }
    if (t >= timeline.end) finishAnimation();
    else animationFrame = requestAnimationFrame(frame);
  }
  animationFrame = requestAnimationFrame(frame);
}

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

alternateRender();
alternateFitPreview();
new ResizeObserver(alternateFitPreview).observe(alternateStage);
new ResizeObserver(fitChoicePreview).observe(choiceVisual);
window.addEventListener('resize', alternateFitPreview);
document.fonts.ready.then(replayAnimation);

const brandToggle = document.querySelector('#brand-toggle');
function renderBrandChoice() {
  const choice = window.EUGABranding.current();
  const concept = choice === 'concept';
  brandToggle.setAttribute('aria-checked', String(concept));
  document.querySelector('#approved-branding').hidden = concept;
  document.querySelector('#concept-branding').hidden = !concept;
  document.querySelectorAll('[data-select-brand]').forEach(button => {
    const selected = button.dataset.selectBrand === choice;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector('#brand-choice-note').textContent = `Selected for all materials: ${concept ? 'Stars + Globe' : 'EU/UN Flags'}`;
  if (concept) {
    alternateFitPreview();
    // The isolated presentation view starts exactly once, after its font is ready.
    if (!document.documentElement.classList.contains('motion-only')) replayAnimation();
  } else finishAnimation();
}
brandToggle.addEventListener('click', () => window.EUGABranding.select(window.EUGABranding.current() === 'concept' ? 'standard' : 'concept'));
document.querySelectorAll('[data-select-brand]').forEach(button => button.addEventListener('click', () => window.EUGABranding.select(button.dataset.selectBrand)));
document.addEventListener('euga:brand-change', renderBrandChoice);
renderBrandChoice();
