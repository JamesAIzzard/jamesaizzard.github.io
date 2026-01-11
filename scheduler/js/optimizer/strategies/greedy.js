/**
 * Greedy construction strategy for initial solution.
 * Assigns shifts prioritizing even workload distribution.
 */

import { canAssign } from '../utils/constraints.js';
import { getUtilization } from '../utils/scoring.js';

/**
 * Build an initial solution using greedy assignment.
 * Prioritizes even distribution by assigning to lowest-utilization candidates.
 *
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @param {Object} progressReporter
 * @param {number} progressStart - Starting progress percentage
 * @param {number} progressEnd - Ending progress percentage
 * @returns {Promise<{assignment: Object, paTotals: Object}>}
 */
export const buildGreedySolution = async (
  shifts,
  participants,
  preferences,
  conflictMap,
  progressReporter,
  progressStart = 0,
  progressEnd = 30
) => {
  const assignment = {};
  const paTotals = {};
  participants.forEach(p => paTotals[p.id] = 0);

  // Sort shifts by difficulty (fewer available candidates first)
  const sortedShifts = [...shifts].sort((a, b) => {
    const aChoices = participants.filter(p => (preferences[p.id]?.[a.id] ?? 0) > 0).length;
    const bChoices = participants.filter(p => (preferences[p.id]?.[b.id] ?? 0) > 0).length;
    return aChoices - bChoices;
  });

  for (let i = 0; i < sortedShifts.length; i++) {
    const shift = sortedShifts[i];
    progressReporter.tick();

    if (i % 10 === 0) {
      const progress = progressStart + ((i / sortedShifts.length) * (progressEnd - progressStart));
      await progressReporter.report('greedy', progress, 0);
    }

    // Find all valid candidates (preference > 0 and no time conflict)
    const candidates = participants.filter(p =>
      (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
      canAssign(p.id, shift.id, assignment, conflictMap)
    );

    if (candidates.length === 0) continue;

    // Sort by utilization (lowest first), then by preference (highest first)
    candidates.sort((a, b) => {
      const utilA = getUtilization(a.id, paTotals, participants);
      const utilB = getUtilization(b.id, paTotals, participants);
      if (Math.abs(utilA - utilB) > 0.001) return utilA - utilB;
      // Tiebreaker: higher preference wins
      const prefA = preferences[a.id]?.[shift.id] ?? 0;
      const prefB = preferences[b.id]?.[shift.id] ?? 0;
      return prefB - prefA;
    });

    const selected = candidates[0];
    assignment[shift.id] = selected.id;
    paTotals[selected.id] += shift.pa || 0;
  }

  // Report final progress to avoid jumps when transitioning to next phase
  await progressReporter.reportNow('greedy', progressEnd, 0);

  return { assignment, paTotals };
};

/**
 * Build a randomized greedy solution for multi-start.
 * Introduces controlled randomness in candidate selection.
 *
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @param {number} randomness - 0 = deterministic, 1 = fully random (default 0.3)
 * @returns {{assignment: Object, paTotals: Object}}
 */
export const buildRandomizedGreedySolution = (
  shifts,
  participants,
  preferences,
  conflictMap,
  randomness = 0.3
) => {
  const assignment = {};
  const paTotals = {};
  participants.forEach(p => paTotals[p.id] = 0);

  // Shuffle shifts with some randomness
  const sortedShifts = [...shifts].sort((a, b) => {
    const aChoices = participants.filter(p => (preferences[p.id]?.[a.id] ?? 0) > 0).length;
    const bChoices = participants.filter(p => (preferences[p.id]?.[b.id] ?? 0) > 0).length;
    // Add randomness to ordering
    return (aChoices - bChoices) + (Math.random() - 0.5) * randomness * 10;
  });

  for (const shift of sortedShifts) {
    const candidates = participants.filter(p =>
      (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
      canAssign(p.id, shift.id, assignment, conflictMap)
    );

    if (candidates.length === 0) continue;

    // Sort with randomness
    candidates.sort((a, b) => {
      const utilA = getUtilization(a.id, paTotals, participants);
      const utilB = getUtilization(b.id, paTotals, participants);
      const prefA = preferences[a.id]?.[shift.id] ?? 0;
      const prefB = preferences[b.id]?.[shift.id] ?? 0;

      const scoreA = -utilA * 100 + prefA;
      const scoreB = -utilB * 100 + prefB;

      // Add randomness
      return (scoreB - scoreA) + (Math.random() - 0.5) * randomness * 50;
    });

    const selected = candidates[0];
    assignment[shift.id] = selected.id;
    paTotals[selected.id] += shift.pa || 0;
  }

  return { assignment, paTotals };
};
