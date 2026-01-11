/**
 * Main optimizer orchestrator.
 * Coordinates multiple search strategies with random restarts.
 */

import { buildConflictMap, findUnavailableShifts } from './utils/constraints.js';
import { createProgressReporter } from './utils/progress.js';
import {
  calculatePreferenceScore,
  calculateVariance,
  getActiveParticipants,
  isBetterSolution
} from './utils/scoring.js';

import { buildGreedySolution, buildRandomizedGreedySolution } from './strategies/greedy.js';
import { localSearch } from './strategies/localSearch.js';
import { simulatedAnnealing, DEFAULT_SA_CONFIG } from './strategies/simulatedAnnealing.js';
import { perturbSolution } from './strategies/perturbation.js';

/**
 * Default optimizer configuration.
 */
const DEFAULT_CONFIG = {
  restarts: 5,
  localSearch: {
    maxPasses: 100
  },
  annealing: DEFAULT_SA_CONFIG,
  perturbationStrength: 0.25
};

/**
 * Main optimization entry point.
 * Runs multiple restarts, each with greedy -> local search -> simulated annealing.
 *
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences - { personId: { shiftId: score } }
 * @param {Function} onProgress - Progress callback
 * @param {Object} config - Optional configuration overrides
 * @returns {Promise<Object|null>} Solution or null if no valid solution
 */
export const optimizeAsync = async (
  shifts,
  participants,
  preferences,
  onProgress,
  config = {}
) => {
  // Merge config with defaults
  const cfg = {
    ...DEFAULT_CONFIG,
    ...config,
    localSearch: { ...DEFAULT_CONFIG.localSearch, ...config.localSearch },
    annealing: { ...DEFAULT_CONFIG.annealing, ...config.annealing }
  };

  // Early exit conditions
  if (shifts.length === 0 || participants.length === 0) return null;

  const unavailableShifts = findUnavailableShifts(shifts, participants, preferences);
  if (unavailableShifts.length > 0) {
    return { failed: true, unavailableShifts };
  }

  // Build constraints once
  const conflictMap = buildConflictMap(shifts);
  const activeParticipants = getActiveParticipants(participants);
  const progressReporter = createProgressReporter(onProgress);

  let bestSolution = null;

  // Multi-start optimization
  for (let restart = 0; restart < cfg.restarts; restart++) {
    // Calculate progress range for this restart
    const restartProgress = (restart / cfg.restarts) * 100;
    const nextRestartProgress = ((restart + 1) / cfg.restarts) * 100;

    // Set restart context for all progress reports in this iteration
    progressReporter.setRestartContext(restart + 1, cfg.restarts);

    // Report restart start
    await progressReporter.reportNow(
      'greedy',
      restartProgress,
      bestSolution ? calculatePreferenceScore(bestSolution.assignment, preferences) : 0
    );

    // Phase 1: Build initial solution
    let solution;
    if (restart === 0) {
      // First restart: use deterministic greedy
      solution = await buildGreedySolution(
        shifts, participants, preferences, conflictMap,
        progressReporter,
        restartProgress,
        restartProgress + (nextRestartProgress - restartProgress) * 0.1
      );
    } else {
      // Subsequent restarts: use randomized greedy
      solution = buildRandomizedGreedySolution(
        shifts, participants, preferences, conflictMap,
        0.3 + (restart * 0.1) // Increase randomness with each restart
      );
    }

    // Phase 2: Local search
    solution = await localSearch(
      solution,
      shifts, participants, preferences, conflictMap,
      cfg.localSearch,
      progressReporter,
      restartProgress + (nextRestartProgress - restartProgress) * 0.1,
      restartProgress + (nextRestartProgress - restartProgress) * 0.5
    );

    // Phase 3: Simulated annealing
    solution = await simulatedAnnealing(
      solution,
      shifts, participants, preferences, conflictMap,
      cfg.annealing,
      progressReporter,
      restartProgress + (nextRestartProgress - restartProgress) * 0.5,
      nextRestartProgress
    );

    // Track best solution
    if (isBetterSolution(solution, bestSolution, activeParticipants, preferences)) {
      bestSolution = solution;
    }

    // Optional: Apply perturbation for diversity in next restart
    // (already handled by randomized greedy)
  }

  // Final results
  const finalScore = calculatePreferenceScore(bestSolution.assignment, preferences);
  const finalVariance = calculateVariance(bestSolution.paTotals, activeParticipants);

  // Check if any quotas were not met
  const quotasNotMet = activeParticipants.some(
    p => (bestSolution.paTotals[p.id] || 0) < (p.paQuota || 0)
  );

  onProgress({
    phase: 'complete',
    progress: 100,
    iterations: progressReporter.getIterations(),
    bestScore: finalScore
  });

  return {
    assignment: bestSolution.assignment,
    score: finalScore,
    paTotals: bestSolution.paTotals,
    quotasNotMet,
    variance: finalVariance
  };
};
