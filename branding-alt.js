// Logo 3e is a preview-only reconstruction of the supplied colleague specification.
// The approved program-wordmark.svg and the supplied reference files stay untouched.
const alternateDefaults = Object.freeze({
  markSize: 220,
  gap: 36,
  markY: 0,
  textY: 0,
  starRadius: 86,
  starScale: 1,
  gtScale: 1,
  gridStroke: 2,
  horizonHeight: 6,
  titleSize: 40,
  subtitleSize: 26,
  lineGap: 6,
});

const alternateGroups = [
  { title: 'Composition', fields: [
    ['markSize', 'Mark size', 150, 260, 1, 'px'],
    ['gap', 'Mark–text gap', 0, 90, 1, 'px'],
    ['markY', 'Mark vertical shift', -40, 40, 1, 'px'],
    ['textY', 'Text vertical shift', -40, 40, 1, 'px'],
  ] },
  { title: 'Horizon mark', fields: [
    ['starRadius', 'Star arc radius', 75, 100, 1, ' units'],
    ['starScale', 'Star size', 0.65, 1.45, 0.01, '×'],
    ['gtScale', 'GT size', 0.7, 1.5, 0.01, '×'],
    ['gridStroke', 'Globe grid stroke', 0.5, 4, 0.1, ' units'],
    ['horizonHeight', 'Horizon thickness', 2, 12, 0.5, ' units'],
  ] },
  { title: 'Typography', fields: [
    ['titleSize', 'Program-name size', 28, 50, 1, 'px'],
    ['subtitleSize', 'Study-abroad size', 18, 38, 1, 'px'],
    ['lineGap', 'Space between lines', 0, 24, 1, 'px'],
  ] },
];

const alternateValues = { ...alternateDefaults };
const alternateInputs = new Map();
const alternateOutputs = new Map();
const alternateControls = document.querySelector('#alternate-controls');
const alternateStage = document.querySelector('#alternate-stage');
const alternateArtboard = document.querySelector('#alternate-artboard');
const alternateLockup = document.querySelector('#alternate-lockup');
const alternateStars = [...document.querySelectorAll('#alternate-stars polygon')];
const alternateGrid = document.querySelector('#alternate-grid');
const alternateHorizon = document.querySelector('#alternate-horizon');
const alternateGt = document.querySelector('#alternate-gt');
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

function alternateRender() {
  const value = alternateValues;
  alternateLockup.style.setProperty('--alternate-mark-size', `${value.markSize}px`);
  alternateLockup.style.setProperty('--alternate-gap', `${value.gap}px`);
  alternateLockup.style.setProperty('--alternate-mark-y', `${value.markY}px`);
  alternateLockup.style.setProperty('--alternate-type-y', `${value.textY}px`);
  alternateLockup.style.setProperty('--alternate-title-size', `${value.titleSize}px`);
  alternateLockup.style.setProperty('--alternate-subtitle-size', `${value.subtitleSize}px`);
  alternateLockup.style.setProperty('--alternate-line-gap', `${value.lineGap}px`);

  for (const star of alternateStars) {
    const angle = Number(star.dataset.angle) * Math.PI / 180;
    const dx = (value.starRadius - alternateDefaults.starRadius) * Math.cos(angle);
    const dy = (value.starRadius - alternateDefaults.starRadius) * Math.sin(angle);
    const cx = Number(star.dataset.cx);
    const cy = Number(star.dataset.cy);
    if (value.starRadius === alternateDefaults.starRadius && value.starScale === 1) {
      star.removeAttribute('transform');
    } else {
      star.setAttribute('transform', `translate(${dx.toFixed(3)} ${dy.toFixed(3)}) translate(${cx} ${cy}) scale(${value.starScale}) translate(${-cx} ${-cy})`);
    }
  }
  if (value.gtScale === 1) alternateGt.removeAttribute('transform');
  else alternateGt.setAttribute('transform', `translate(110 99) scale(${value.gtScale}) translate(-110 -99)`);
  alternateGrid.setAttribute('stroke-width', String(value.gridStroke));
  alternateHorizon.setAttribute('y', String(128 - value.horizonHeight / 2));
  alternateHorizon.setAttribute('height', String(value.horizonHeight));
  alternateHorizon.setAttribute('rx', String(value.horizonHeight / 2));

  for (const group of alternateGroups) for (const [key, , , , , unit] of group.fields) {
    alternateOutputs.get(key).textContent = alternateFormat(value[key], unit);
  }
  const original = Object.keys(alternateDefaults).every(key => value[key] === alternateDefaults[key]);
  alternateStatus.textContent = original ? "Showing colleague's original values" : 'Preview adjusted · original files unchanged';
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

alternateRender();
alternateFitPreview();
new ResizeObserver(alternateFitPreview).observe(document.querySelector('.alternate-preview-shell'));
