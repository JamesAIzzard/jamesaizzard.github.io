// Pill Switcher: builds pills from panel <h2>s, toggles panels,
// and provides scroll buttons for horizontal overflow.
(function () {
  function initPillSwitcher(container) {
    const buttons = container.querySelector('.pill-buttons');
    const panelsWrap = container.querySelector('.pill-switcher-panels');
    if (!buttons || !panelsWrap) return;

    // Wrap buttons in a scrollable wrapper with left/right controls
    const wrap = document.createElement('div');
    wrap.className = 'pill-buttons-wrap';
    buttons.parentNode.insertBefore(wrap, buttons);
    wrap.appendChild(buttons);

    const leftBtn = document.createElement('button');
    leftBtn.className = 'pill-scroll pill-scroll-left';
    leftBtn.type = 'button';
    leftBtn.setAttribute('aria-label', 'Scroll left');
    leftBtn.innerHTML = '<span aria-hidden="true">❮</span>';

    const rightBtn = document.createElement('button');
    rightBtn.className = 'pill-scroll pill-scroll-right';
    rightBtn.type = 'button';
    rightBtn.setAttribute('aria-label', 'Scroll right');
    rightBtn.innerHTML = '<span aria-hidden="true">❯</span>';

    wrap.appendChild(leftBtn);
    wrap.appendChild(rightBtn);

    // Build pill buttons from panels
    const panels = Array.from(panelsWrap.querySelectorAll('.panel'));
    if (!panels.length) return;

    buttons.setAttribute('role', 'tablist');
    buttons.setAttribute('aria-label', 'Manufacturing experience');

    const pills = [];
    let activeIndex = Math.max(0, panels.findIndex(p => p.classList.contains('active')));
    if (activeIndex === -1) activeIndex = 0;

    panels.forEach((panel, i) => {
      if (!panel.id) panel.id = `panel-${i + 1}`;
      const heading = panel.querySelector('.panel-text h2, h2');
      const label = heading ? heading.textContent.trim() : `Panel ${i + 1}`;

      const btn = document.createElement('button');
      btn.className = 'pill-btn';
      btn.type = 'button';
      btn.textContent = label;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel.id);
      btn.dataset.target = panel.id;

      // Link tab to panel for a11y
      btn.id = `tab-${panel.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', btn.id);
      if (!panel.classList.contains('active')) panel.setAttribute('hidden', '');

      pills.push(btn);
      buttons.appendChild(btn);
    });

    function setActive(index, focus = true) {
      if (index < 0 || index >= panels.length) return;
      activeIndex = index;
      panels.forEach((panel, i) => {
        const selected = i === index;
        panel.classList.toggle('active', selected);
        if (selected) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
        const btn = pills[i];
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-selected', String(selected));
        btn.tabIndex = selected ? 0 : -1;
      });
      if (focus) pills[index].focus();
    }

    pills.forEach((btn, i) => {
      btn.addEventListener('click', () => setActive(i, false));
    });

    // Keyboard navigation for pills
    buttons.addEventListener('keydown', (e) => {
      const KEY = e.key;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(KEY)) return;
      e.preventDefault();
      let next = activeIndex;
      if (KEY === 'ArrowLeft') next = Math.max(0, activeIndex - 1);
      if (KEY === 'ArrowRight') next = Math.min(pills.length - 1, activeIndex + 1);
      if (KEY === 'Home') next = 0;
      if (KEY === 'End') next = pills.length - 1;
      setActive(next);
      ensureVisible(pills[next]);
    });

    // Initial active state
    setActive(activeIndex, false);

    // Scrolling controls
    const scrollAmount = () => Math.max(160, Math.floor(buttons.clientWidth * 0.6));

    function updateArrows() {
      const max = buttons.scrollWidth - buttons.clientWidth;
      const x = Math.round(buttons.scrollLeft);
      const atStart = x <= 1;
      const atEnd = x >= max - 1;
      const noOverflow = max <= 0;
      if (noOverflow) {
        leftBtn.style.display = 'none';
        rightBtn.style.display = 'none';
      } else {
        leftBtn.style.display = '';
        rightBtn.style.display = '';
        leftBtn.disabled = atStart;
        rightBtn.disabled = atEnd;
      }
    }

    function ensureVisible(el) {
      const bRect = buttons.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      if (eRect.left < bRect.left) {
        buttons.scrollBy({ left: eRect.left - bRect.left - 16, behavior: 'smooth' });
      } else if (eRect.right > bRect.right) {
        buttons.scrollBy({ left: eRect.right - bRect.right + 16, behavior: 'smooth' });
      }
    }

    leftBtn.addEventListener('click', () => {
      buttons.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      buttons.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    buttons.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    // Initial arrow state after layout
    requestAnimationFrame(updateArrows);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pill-switcher-container').forEach(initPillSwitcher);
  });
})();
