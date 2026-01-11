/**
 * Progress reporting utilities for async optimization.
 * Handles throttled updates to avoid UI blocking.
 */

/**
 * Create a progress reporter with throttling.
 * @param {Function} onProgress - Callback for progress updates
 * @param {number} throttleMs - Minimum ms between updates (default 50)
 * @returns {Object} Progress reporter instance
 */
export const createProgressReporter = (onProgress, throttleMs = 50) => {
  let lastUpdate = 0;
  let iterations = 0;
  let restartContext = {};

  return {
    /**
     * Increment iteration counter.
     */
    tick() {
      iterations++;
    },

    /**
     * Get current iteration count.
     * @returns {number}
     */
    getIterations() {
      return iterations;
    },

    /**
     * Set restart context that will be included in all reports.
     * @param {number} restart - Current restart number (1-indexed)
     * @param {number} totalRestarts - Total number of restarts
     */
    setRestartContext(restart, totalRestarts) {
      restartContext = { restart, totalRestarts };
    },

    /**
     * Report progress if enough time has passed since last update.
     * Yields to event loop to keep UI responsive.
     * @param {string} phase - Current phase name
     * @param {number} progress - Progress percentage (0-100)
     * @param {number} bestScore - Current best score
     * @param {Object} extra - Additional data to include
     */
    async report(phase, progress, bestScore, extra = {}) {
      const now = Date.now();
      if (now - lastUpdate > throttleMs) {
        lastUpdate = now;
        onProgress({ phase, progress, iterations, bestScore, ...restartContext, ...extra });
        await new Promise(r => setTimeout(r, 0));
      }
    },

    /**
     * Force an immediate progress report (no throttling).
     * @param {string} phase
     * @param {number} progress
     * @param {number} bestScore
     * @param {Object} extra
     */
    async reportNow(phase, progress, bestScore, extra = {}) {
      lastUpdate = Date.now();
      onProgress({ phase, progress, iterations, bestScore, ...restartContext, ...extra });
      await new Promise(r => setTimeout(r, 0));
    }
  };
};
