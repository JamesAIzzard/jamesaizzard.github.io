/**
 * Local search strategy (hill climbing).
 * Iteratively improves solution through single-shift reassignment and pair swaps.
 */

import { canAssign } from '../utils/constraints.js';
import {
  calculateVariance,
  calculatePreferenceScore,
  getActiveParticipants,
  VARIANCE_WEIGHT
} from '../utils/scoring.js';

/**
 * Perform local search to improve a solution.
 * Accepts only strictly improving moves (hill climbing).
 *
 * @param {Object} solution - { assignment, paTotals }
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @param {Object} config - { maxPasses }
 * @param {Object} progressReporter
 * @param {number} progressStart
 * @param {number} progressEnd
 * @returns {Promise<{assignment: Object, paTotals: Object}>}
 */
export const localSearch = async (
  solution,
  shifts,
  participants,
  preferences,
  conflictMap,
  config,
  progressReporter,
  progressStart = 30,
  progressEnd = 70
) => {
  const { maxPasses = 100 } = config;
  const activeParticipants = getActiveParticipants(participants);

  // Clone solution to avoid mutating input
  const assignment = { ...solution.assignment };
  const paTotals = { ...solution.paTotals };

  let improved = true;
  let pass = 0;

  while (improved && pass < maxPasses) {
    improved = false;
    pass++;

    const progress = progressStart + ((pass / maxPasses) * (progressEnd - progressStart));
    await progressReporter.report('local-search', progress, calculatePreferenceScore(assignment, preferences));

    // Try single-shift reassignment
    improved = await trySingleReassignments(
      assignment, paTotals, shifts, participants,
      preferences, conflictMap, activeParticipants, progressReporter
    ) || improved;

    // Try pair swaps
    improved = tryPairSwaps(
      assignment, shifts, participants, preferences, conflictMap
    ) || improved;
  }

  // Report final progress to avoid jumps when transitioning to next phase
  await progressReporter.reportNow('local-search', progressEnd, calculatePreferenceScore(assignment, preferences));

  return { assignment, paTotals };
};

/**
 * Try reassigning each shift to a better person.
 * @returns {boolean} Whether any improvement was made
 */
const trySingleReassignments = async (
  assignment, paTotals, shifts, participants,
  preferences, conflictMap, activeParticipants, progressReporter
) => {
  let improved = false;

  for (const shift of shifts) {
    progressReporter.tick();
    const currentPerson = assignment[shift.id];
    if (!currentPerson) continue;

    const currentVariance = calculateVariance(paTotals, activeParticipants);
    const currentPref = preferences[currentPerson]?.[shift.id] ?? 0;

    let bestMove = null;
    let bestImprovement = 0;

    for (const candidate of participants) {
      if (candidate.id === currentPerson) continue;
      if ((preferences[candidate.id]?.[shift.id] ?? 0) === 0) continue;
      if (!canAssign(candidate.id, shift.id, assignment, conflictMap)) continue;

      // Calculate new state
      const newPaTotals = { ...paTotals };
      newPaTotals[currentPerson] -= shift.pa || 0;
      newPaTotals[candidate.id] = (newPaTotals[candidate.id] || 0) + (shift.pa || 0);

      const newVariance = calculateVariance(newPaTotals, activeParticipants);
      const newPref = preferences[candidate.id]?.[shift.id] ?? 0;

      // Calculate improvement (positive = better)
      const varianceImprovement = (currentVariance - newVariance) * VARIANCE_WEIGHT;
      const prefImprovement = newPref - currentPref;
      const totalImprovement = varianceImprovement + prefImprovement;

      if (totalImprovement > bestImprovement) {
        bestImprovement = totalImprovement;
        bestMove = { personId: candidate.id, paTotals: newPaTotals };
      }
    }

    if (bestMove) {
      assignment[shift.id] = bestMove.personId;
      Object.assign(paTotals, bestMove.paTotals);
      improved = true;
    }
  }

  return improved;
};

/**
 * Try swapping assignments between pairs of shifts.
 * @returns {boolean} Whether any improvement was made
 */
const tryPairSwaps = (assignment, shifts, participants, preferences, conflictMap) => {
  let improved = false;

  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const shiftA = shifts[i];
      const shiftB = shifts[j];
      const personA = assignment[shiftA.id];
      const personB = assignment[shiftB.id];

      if (!personA || !personB || personA === personB) continue;

      // Check if swap is valid preference-wise
      const prefAforB = preferences[personA]?.[shiftB.id] ?? 0;
      const prefBforA = preferences[personB]?.[shiftA.id] ?? 0;
      if (prefAforB === 0 || prefBforA === 0) continue;

      // Check for time conflicts after swap
      const tempAssignment = { ...assignment };
      delete tempAssignment[shiftA.id];
      delete tempAssignment[shiftB.id];
      if (!canAssign(personA, shiftB.id, tempAssignment, conflictMap)) continue;
      tempAssignment[shiftB.id] = personA;
      if (!canAssign(personB, shiftA.id, tempAssignment, conflictMap)) continue;

      // Calculate improvement (variance unchanged for swaps)
      const oldPref = (preferences[personA]?.[shiftA.id] ?? 0) + (preferences[personB]?.[shiftB.id] ?? 0);
      const newPref = prefAforB + prefBforA;

      if (newPref > oldPref) {
        assignment[shiftA.id] = personB;
        assignment[shiftB.id] = personA;
        improved = true;
      }
    }
  }

  return improved;
};
