// Experimental vector mark. The approved wordmark and colleague's source files are separate.
// The globe and individual stars have stable SVG groups for later animation.
const alternateDefaults = Object.freeze({
  markSize: 220, gap: 36, markY: 0, textY: 0,
  starRadius: 76, starSize: 8.5, starSweep: 180, starY: 0,
  globeRadius: 76, globeX: 0, globeY: 0,
  outlineStroke: 2.5, gridStroke: 1.6, horizonStroke: 2.5,
  titleSize: 40, subtitleSize: 26, lineGap: 6,
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
  { title: 'Typography', fields: [
    ['titleSize', 'Program-name size', 28, 50, 1, 'px'],
    ['subtitleSize', 'Study-abroad size', 18, 38, 1, 'px'],
    ['lineGap', 'Space between lines', 0, 24, 1, 'px'],
  ] },
];

const svgNS = 'http://www.w3.org/2000/svg';
const alternateValues = { ...alternateDefaults };
const alternateInputs = new Map();
const alternateOutputs = new Map();
const alternateControls = document.querySelector('#alternate-controls');
const alternateStage = document.querySelector('#alternate-stage');
const alternateArtboard = document.querySelector('#alternate-artboard');
const alternateLockup = document.querySelector('#alternate-lockup');
const alternateMark = document.querySelector('#alternate-mark');
const alternateStars = document.querySelector('#alternate-stars');
const alternateStatus = document.querySelector('#alternate-status');

function alternateFormat(value, unit) {
  return `${Number(value).toString()}${unit}`;
}

function alternateFitPreview() {
  const width = alternateStage.clientWidth;
  const scale = Math.min(1, width / 880);
  alternateArtboard.style.left = `${(width - 880 * scale) / 2}px`;
  alternateArtboard.style.transform = `scale(${scale})`;
  alternateStage.style.height = `${400 * scale}px`;
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
    ['mark-size', 'markSize'], ['gap', 'gap'], ['mark-y', 'markY'],
    ['type-y', 'textY'], ['title-size', 'titleSize'],
    ['subtitle-size', 'subtitleSize'], ['line-gap', 'lineGap'],
  ]) alternateLockup.style.setProperty(`--alternate-${property}`, `${value[key]}px`);
  renderStars(value);
  renderGlobe(value);
  for (const group of alternateGroups) for (const [key, , , , , unit] of group.fields) {
    alternateOutputs.get(key).textContent = alternateFormat(value[key], unit);
  }
  const original = Object.keys(alternateDefaults).every(key => value[key] === alternateDefaults[key]);
  alternateStatus.textContent = original ? 'Showing concept defaults' : 'Preview adjusted · approved logo unchanged';
}

for (const group of alternateGroups) {
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
    labelNode.append(output);
    const input = document.createElement('input');
    input.id = `alternate-${key}`;
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(alternateDefaults[key]);
    input.addEventListener('input', () => {
      alternateValues[key] = Number(input.value);
      alternateRender();
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
    alternateInputs.set(key, input);
    alternateOutputs.set(key, output);
  }
  alternateControls.append(fieldset);
}

document.querySelector('#alternate-reset').addEventListener('click', () => {
  for (const [key, baseline] of Object.entries(alternateDefaults)) {
    alternateValues[key] = baseline;
    alternateInputs.get(key).value = String(baseline);
  }
  alternateRender();
});

document.querySelector('#alternate-export').addEventListener('click', () => {
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
