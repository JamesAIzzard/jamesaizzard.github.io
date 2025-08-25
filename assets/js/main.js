// Randomize positions and sizes of lighting patches for .panel-surface--lit
// Generates subtle variability each load while staying within safe bounds.
(function () {
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pct(v) { return `${Math.round(v)}%`; }

  function applyRandomLighting(el) {
    // Bias Y near the top; X spread across
    const aX = rand(18, 42);
    const aY = rand(-6, 18);
    const bX = rand(58, 84);
    const bY = rand(-10, 12);

    // Sizes as percentages of element's box
    const aW = rand(52, 72); // width%
    const aH = rand(34, 48); // height%
    const bW = rand(36, 56);
    const bH = rand(26, 40);

    // Alpha/blur strength
    const aAlpha = (rand(0.32, 0.44)).toFixed(2);
    const bAlpha = (rand(0.24, 0.36)).toFixed(2);
    const blur = Math.round(rand(30, 44));

    el.style.setProperty('--lit-a-x', pct(aX));
    el.style.setProperty('--lit-a-y', pct(aY));
    el.style.setProperty('--lit-b-x', pct(bX));
    el.style.setProperty('--lit-b-y', pct(bY));
    el.style.setProperty('--lit-a-w', pct(aW));
    el.style.setProperty('--lit-a-h', pct(aH));
    el.style.setProperty('--lit-b-w', pct(bW));
    el.style.setProperty('--lit-b-h', pct(bH));
    el.style.setProperty('--lit-a-alpha', aAlpha);
    el.style.setProperty('--lit-b-alpha', bAlpha);
    el.style.setProperty('--lit-blur', `${blur}px`);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.panel-surface--lit').forEach(applyRandomLighting);
  });
})();
