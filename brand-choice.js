// One shared choice for every live material. A query override is used only for exports.
(() => {
  const key = 'euga-program-brand';
  const sources = {
    standard: 'assets/branding/program-wordmark.svg',
    concept: 'assets/branding/concept-wordmark.svg',
  };
  const params = new URLSearchParams(location.search);
  const override = params.get('brand');
  const valid = value => Object.hasOwn(sources, value) ? value : null;
  const current = () => valid(override) || valid(localStorage.getItem(key)) || 'concept';
  function apply(root = document) {
    const choice = current();
    root.querySelectorAll('[data-brand-logo]').forEach(image => {
      const src = sources[choice];
      image.dataset.brandChoice = choice;
      if (image.getAttribute('src') !== src) image.setAttribute('src', src);
    });
    root.querySelectorAll('[data-download-standard][data-download-concept]').forEach(link => {
      link.href = link.dataset[choice === 'concept' ? 'downloadConcept' : 'downloadStandard'];
    });
    document.dispatchEvent(new CustomEvent('euga:brand-change', { detail: { choice } }));
  }
  function select(choice) {
    if (!valid(choice)) return;
    localStorage.setItem(key, choice);
    apply();
  }
  window.EUGABranding = { current, select, apply, logoSrc: () => sources[current()] };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => apply());
  else apply();
  window.addEventListener('storage', event => { if (event.key === key) apply(); });
})();
