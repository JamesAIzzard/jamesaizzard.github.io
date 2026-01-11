/**
 * Simulated annealing strategy.
 * Probabilistically accepts worse moves to escape local optima,
 * with acceptance probability decreasing over time (cooling).
 */

import { canAssign } from '../utils/constraints.js';
import {
  calculateVariance,
  calculatePreferenceScore,
  getActiveParticipants,
  VARIANCE_WEIGHT
} from '../utils/scoring.js';

/**
 * Default simulated annealing configuration.
 */
export const DEFAULT_SA_CONFIG = {
  initialTemp: 15,
  coolingRate: 0.995,
  minTemp: 0.01,
  iterationsPerTemp: 75
};

/**
 * Perform simulated annealing to escape local optima.
 *
 * @param {Object} solution - { assignment, paTotals }
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @param {Object} config - SA parameters
 * @param {Object} progressReporter
 * @param {number} progressStart
 * @param {number} progressEnd
 * @returns {Promise<{assignment: Object, paTotals: Object}>}
 */
export const simulatedAnnealing = async (
  solution,
  shifts,
  participants,
  preferences,
  conflictMap,
  config,
  progressReporter,
  progressStart = 70,
  progressEnd = 100
) => {
  const {
    initialTemp = DEFAULT_SA_CONFIG.initialTemp,
    coolingRate = DEFAULT_SA_CONFIG.coolingRate,
    minTemp = DEFAULT_SA_CONFIG.minTemp,
    iterationsPerTemp = DEFAULT_SA_CONFIG.iterationsPerTemp
  } = config;

  const activeParticipants = getActiveParticipants(participants);

  // Clone solution
  let assignment = { ...solution.assignment };
  let paTotals = { ...solution.paTotals };

  // Track best solution found
  let bestAssignment = { ...assignment };
  let bestPaTotals = { ...paTotals };
  let bestScore = evaluateScore(assignment, paTotals, activeParticipants, preferences);

  let temp = initialTemp;
  const totalSteps = Math.ceil(Math.log(minTemp / initialTemp) / Math.log(coolingRate));
  let step = 0;

  while (temp > minTemp) {
    for (let i = 0; i < iterationsPerTemp; i++) {
      progressReporter.tick();

      // Generate a random neighbour move
      const move = generateRandomMove(assignment, shifts, participants, preferences, conflictMap);
      if (!move) continue;

      // Calculate score change
      const currentScore = evaluateScore(assignment, paTotals, activeParticipants, preferences);
      const { newAssignment, newPaTotals } = applyMove(assignment, paTotals, move, shifts);
      const newScore = evaluateScore(newAssignment, newPaTotals, activeParticipants, preferences);

      const delta = newScore - currentScore;

      // Accept if better, or probabilistically if worse
      if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
        assignment = newAssignment;
        paTotals = newPaTotals;

        // Track best
        if (newScore > bestScore) {
          bestAssignment = { ...assignment };
          bestPaTotals = { ...paTotals };
          bestScore = newScore;
        }
      }
    }

    // Cool down
    temp *= coolingRate;
    step++;

    const progress = progressStart + ((step / totalSteps) * (progressEnd - progressStart));
    await progressReporter.report(
      'annealing',
      Math.min(progress, progressEnd),
      calculatePreferenceScore(bestAssignment, preferences)
    );
  }

  // Report final progress to avoid jumps when transitioning to next phase/restart
  await progressReporter.reportNow('annealing', progressEnd, calculatePreferenceScore(bestAssignment, preferences));

  // Return best found, not final state
  return { assignment: bestAssignment, paTotals: bestPaTotals };
};

/**
 * Evaluate solution score (higher is better).
 */
const evaluateScore = (assignment, paTotals, activeParticipants, preferences) => {
  const variance = calculateVariance(paTotals, activeParticipants);
  const prefScore = calculatePreferenceScore(assignment, preferences);
  return -variance * VARIANCE_WEIGHT + prefScore;
};

/**
 * Generate a random valid move (reassignment or swap).
 */
const generateRandomMove = (assignment, shifts, participants, preferences, conflictMap) => {
  // 70% chance single reassignment, 30% chance swap
  if (Math.random() < 0.7) {
    return generateRandomReassignment(assignment, shifts, participants, preferences, conflictMap);
  } else {
    return generateRandomSwap(assignment, shifts, participants, preferences, conflictMap);
  }
};

/**
 * Generate a random valid single-shift reassignment.
 */
const generateRandomReassignment = (assignment, shifts, participants, preferences, conflictMap) => {
  // Pick a random assigned shift
  const assignedShifts = shifts.filter(s => assignment[s.id]);
  if (assignedShifts.length === 0) return null;

  const shift = assignedShifts[Math.floor(Math.random() * assignedShifts.length)];
  const currentPerson = assignment[shift.id];

  // Find valid candidates
  const candidates = participants.filter(p =>
    p.id !== currentPerson &&
    (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
    canAssign(p.id, shift.id, assignment, conflictMap)
  );

  if (candidates.length === 0) return null;

  const newPerson = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    type: 'reassign',
    shiftId: shift.id,
    fromPerson: currentPerson,
    toPerson: newPerson.id,
    shiftPa: shift.pa || 0
  };
};

/**
 * Generate a random valid pair swap.
 */
const generateRandomSwap = (assignment, shifts, participants, preferences, conflictMap) => {
  const assignedShifts = shifts.filter(s => assignment[s.id]);
  if (assignedShifts.length < 2) return null;

  // Pick two random different shifts
  const idx1 = Math.floor(Math.random() * assignedShifts.length);
  let idx2 = Math.floor(Math.random() * (assignedShifts.length - 1));
  if (idx2 >= idx1) idx2++;

  const shiftA = assignedShifts[idx1];
  const shiftB = assignedShifts[idx2];
  const personA = assignment[shiftA.id];
  const personB = assignment[shiftB.id];

  if (personA === personB) return null;

  // Check preferences allow swap
  if ((preferences[personA]?.[shiftB.id] ?? 0) === 0) return null;
  if ((preferences[personB]?.[shiftA.id] ?? 0) === 0) return null;

  // Check conflicts
  const tempAssignment = { ...assignment };
  delete tempAssignment[shiftA.id];
  delete tempAssignment[shiftB.id];
  if (!canAssign(personA, shiftB.id, tempAssignment, conflictMap)) return null;
  tempAssignment[shiftB.id] = personA;
  if (!canAssign(personB, shiftA.id, tempAssignment, conflictMap)) return null;

  return {
    type: 'swap',
    shiftAId: shiftA.id,
    shiftBId: shiftB.id,
    personA,
    personB
  };
};

/**
 * Apply a move and return new state (without mutating input).
 */
const applyMove = (assignment, paTotals, move, shifts) => {
  const newAssignment = { ...assignment };
  const newPaTotals = { ...paTotals };

  if (move.type === 'reassign') {
    newAssignment[move.shiftId] = move.toPerson;
    newPaTotals[move.fromPerson] -= move.shiftPa;
    newPaTotals[move.toPerson] = (newPaTotals[move.toPerson] || 0) + move.shiftPa;
  } else if (move.type === 'swap') {
    newAssignment[move.shiftAId] = move.personB;
    newAssignment[move.shiftBId] = move.personA;
    // PA totals unchanged for swaps
  }

  return { newAssignment, newPaTotals };
};
