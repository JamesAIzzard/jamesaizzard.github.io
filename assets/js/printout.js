(function () {
  // Randomize slight rotation for elements with class "printout".
  // Defaults: base = 0deg (centered), range = ±1.25deg.
  // Optional per-element overrides via data attributes:
  //   data-tilt-base="<number>" (degrees, shifts center; allow negative)
  //   data-tilt-range="<number>" (degrees for ±range)
  function randomAngle(base, range) {
    return base + (Math.random() * 2 - 1) * range;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.printout').forEach((el) => {
      const baseAttr = el.getAttribute('data-tilt-base');
      const rangeAttr = el.getAttribute('data-tilt-range');
      const base = baseAttr !== null && baseAttr !== '' ? parseFloat(baseAttr) : 0;
      const range = rangeAttr !== null && rangeAttr !== '' ? parseFloat(rangeAttr) : 1.25;

      const angle = randomAngle(base, range);
      el.style.setProperty('--angle', angle.toFixed(2) + 'deg');
    });
  });
})();
