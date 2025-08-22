(function () {
  function hexToRgb(hex) {
    if (!hex) return { r: 14, g: 20, b: 22 }; // default fallback #0e1416
    const h = hex.trim().replace(/^#/, "");
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return { r, g, b };
    }
    if (h.length >= 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return { r, g, b };
    }
    return { r: 14, g: 20, b: 22 };
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function initHeaderFade() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const bgVar = rootStyles.getPropertyValue('--bg-solid').trim();
    const { r, g, b } = hexToRgb(bgVar || '#0e1416');

    let ticking = false;
    // Calculate a sensible distance to reach full opacity
    const maxBase = () => Math.max(80, Math.round((header.offsetHeight || 56) * 1.5));
    let max = maxBase();

    function update() {
      const y = window.scrollY || window.pageYOffset || 0;
      const p = clamp(y / max, 0, 1);
      header.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${p.toFixed(3)})`;
      header.style.boxShadow = p > 0 ? `0 6px 20px rgba(0,0,0,${(0.28 * p).toFixed(3)})` : 'none';
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    function onResize() {
      max = maxBase();
      update();
    }

    // Initial paint and listeners
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderFade);
  } else {
    initHeaderFade();
  }
})();

