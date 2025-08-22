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

  function initHamburger() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const row = header.querySelector('.header-row');
    const nav = header.querySelector('.main-nav');
    if (!row || !nav) return;

    // Ensure nav has an id for aria-controls
    if (!nav.id) nav.id = 'primary-nav';

    // Create toggle button once
    let btn = header.querySelector('.nav-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'nav-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', nav.id);
      btn.setAttribute('aria-label', 'Toggle menu');
      btn.innerHTML = '<span class="bars" aria-hidden="true"></span>';
      // Insert before the nav so it sits just right of the brand
      row.insertBefore(btn, nav);
    }

    const BREAKPOINT = 860;

    function openMenu() {
      nav.classList.add('open');
      header.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      // Animate natural height
      nav.style.maxHeight = nav.scrollHeight + 'px';
      // Trap focus to nav on small screens (basic)
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onDocClick);
    }

    function closeMenu() {
      nav.classList.remove('open');
      header.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      nav.style.maxHeight = '0px';
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onDocClick);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeMenu();
        btn.focus();
      }
    }

    function onDocClick(e) {
      if (!nav.classList.contains('open')) return;
      const isInside = nav.contains(e.target) || btn.contains(e.target);
      if (!isInside) closeMenu();
    }

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    // Close the menu if we grow beyond the breakpoint
    function onResize() {
      const w = window.innerWidth || document.documentElement.clientWidth || 0;
      if (w > BREAKPOINT) {
        closeMenu();
      } else if (nav.classList.contains('open')) {
        // Recalculate height if still open at small widths
        nav.style.maxHeight = nav.scrollHeight + 'px';
      }
    }
    window.addEventListener('resize', onResize);

    // Ensure collapsed state on init
    nav.style.maxHeight = '0px';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      initHeaderFade();
      initHamburger();
    });
  } else {
    initHeaderFade();
    initHamburger();
  }
})();

