// Opt-in inset content for the WordPress embed; backgrounds retain full width.
(() => {
  if (new URLSearchParams(location.search).get('layout') !== 'wordpress') return;
  document.documentElement.dataset.embedLayout = 'wordpress';
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== 'https://sites.gatech.edu' || event.data?.type !== 'euga-content-insets') return;
    const {left, right} = event.data;
    if (![left, right].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) || left + right > window.innerWidth - 280) return;
    document.documentElement.style.setProperty('--embed-left', `${left}px`);
    document.documentElement.style.setProperty('--embed-right', `${right}px`);
  });
})();
