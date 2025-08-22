const header = document.querySelector(".site-header");

// Build pill buttons dynamically from available panels
const buildPills = () => {
  const pillsContainer = document.querySelector(".pill-buttons");
  const panels = Array.from(document.querySelectorAll(".panel"));
  if (!pillsContainer || panels.length === 0) return;

  // Determine initially active panel
  const initiallyActive = document.querySelector(".panel.active") || panels[0];

  // Clear any existing pills
  pillsContainer.innerHTML = "";

  panels.forEach((panel, idx) => {
    const id = panel.id || `panel-${idx + 1}`;
    if (!panel.id) panel.id = id;
    const titleEl = panel.querySelector("h2");
    const label = titleEl ? titleEl.textContent.trim() : id;

    const btn = document.createElement("button");
    btn.className = "pill";
    btn.type = "button";
    btn.dataset.target = id;
    btn.textContent = label;
    if (panel === initiallyActive) btn.classList.add("active");
    pillsContainer.appendChild(btn);
  });

  const pills = Array.from(pillsContainer.querySelectorAll(".pill"));
  const handleClick = (pill) => {
    pills.forEach(p => p.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const target = document.getElementById(pill.dataset.target);
    if (target) target.classList.add("active");
  };

  pills.forEach(pill => pill.addEventListener("click", () => handleClick(pill)));
};

document.addEventListener("DOMContentLoaded", buildPills);

const toggleHeaderOnScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 10);
};

// Enhance pill scroller with arrow buttons and better UX
const enhancePillScroller = () => {
  const pillsContainer = document.querySelector('.pill-buttons');
  if (!pillsContainer) return;

  // Wrap the pill buttons in a positioned container for arrows
  if (!pillsContainer.parentElement.classList.contains('pill-scroll-wrap')) {
    const wrap = document.createElement('div');
    wrap.className = 'pill-scroll-wrap';
    pillsContainer.parentElement.insertBefore(wrap, pillsContainer);
    wrap.appendChild(pillsContainer);

    // Create nav buttons with inline SVG chevrons
    const mkBtn = (dir) => {
      const btn = document.createElement('button');
      btn.className = `pill-nav pill-nav--${dir}`;
      btn.type = 'button';
      btn.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
      btn.innerHTML = dir === 'left'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6L9 12L15 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6L15 12L9 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; 
      return btn;
    };

    const leftBtn = mkBtn('left');
    const rightBtn = mkBtn('right');
    wrap.appendChild(leftBtn);
    wrap.appendChild(rightBtn);

    const scrollAmount = () => Math.max(160, Math.floor(wrap.clientWidth * 0.7));

    leftBtn.addEventListener('click', () => {
      pillsContainer.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      pillsContainer.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    const updateArrows = () => {
      const maxScroll = pillsContainer.scrollWidth - pillsContainer.clientWidth;
      const x = pillsContainer.scrollLeft;
      const atStart = x <= 1;
      const atEnd = x >= maxScroll - 1;
      leftBtn.disabled = atStart;
      rightBtn.disabled = atEnd;
      wrap.classList.toggle('has-overflow', maxScroll > 2);
    };

    pillsContainer.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(pillsContainer);
    ro.observe(wrap);
    // Initial state
    updateArrows();
  }
};

document.addEventListener('DOMContentLoaded', enhancePillScroller);

window.addEventListener("scroll", toggleHeaderOnScroll, { passive: true });
window.addEventListener("load", toggleHeaderOnScroll);
