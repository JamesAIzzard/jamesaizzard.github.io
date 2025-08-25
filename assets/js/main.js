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

// Simple, seamless marquee for horizontally scrolling chip lists
(function () {
  function debounce(fn, delay) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), delay); };
  }

  function initMarquee(mq) {
    const track = mq.querySelector('.marquee-track');
    if (!track) return;

    // Capture the original items so we can rebuild on resize
    const originals = Array.from(track.children).map(node => node.cloneNode(true));

    function build() {
      // Reset to originals
      track.innerHTML = '';
      // Append one sequence and measure its width
      originals.forEach(n => track.appendChild(n.cloneNode(true)));
      const sequenceWidth = track.scrollWidth;

      // Append additional sequences until we can cover container + one full sequence
      while (track.scrollWidth < mq.clientWidth + sequenceWidth) {
        originals.forEach(n => track.appendChild(n.cloneNode(true)));
      }

      // Set animation distance and duration based on one sequence width (px/sec)
      const pxPerSec = Number(mq.getAttribute('data-speed') || 80); // lower = slower
      const duration = Math.max(sequenceWidth / pxPerSec, 12); // min 12s to avoid dizzying speed

      track.style.setProperty('--marquee-shift', `${Math.round(sequenceWidth)}px`);
      track.style.setProperty('--marquee-duration', `${duration}s`);
    }

    build();
    // Rebuild on resize
    window.addEventListener('resize', debounce(build, 150));

    // Rebuild after page assets (fonts/images) load to capture final sizes
    window.addEventListener('load', build, { once: true });

    // Pause on hover for usability
    mq.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    mq.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.marquee').forEach(initMarquee);
  });
})();
