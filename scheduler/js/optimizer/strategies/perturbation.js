/**
 * Perturbation strategy for solution diversification.
 * Applies random modifications to escape local optima regions.
 */

import { canAssign } from '../utils/constraints.js';

/**
 * Perturb a solution by making random valid modifications.
 * Used in multi-start to explore different regions of the search space.
 *
 * @param {Object} solution - { assignment, paTotals }
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @param {number} strength - Fraction of shifts to perturb (0-1, default 0.2)
 * @returns {{assignment: Object, paTotals: Object}}
 */
export const perturbSolution = (
  solution,
  shifts,
  participants,
  preferences,
  conflictMap,
  strength = 0.2
) => {
  const assignment = { ...solution.assignment };
  const paTotals = { ...solution.paTotals };

  // Determine number of perturbations
  const assignedShifts = shifts.filter(s => assignment[s.id]);
  const numPerturbations = Math.max(1, Math.floor(assignedShifts.length * strength));

  // Shuffle and take first N shifts to perturb
  const shuffled = [...assignedShifts].sort(() => Math.random() - 0.5);
  const toPerturb = shuffled.slice(0, numPerturbations);

  for (const shift of toPerturb) {
    const currentPerson = assignment[shift.id];
    if (!currentPerson) continue;

    // Find alternative candidates
    const candidates = participants.filter(p =>
      p.id !== currentPerson &&
      (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
      canAssign(p.id, shift.id, assignment, conflictMap)
    );

    if (candidates.length === 0) continue;

    // Pick a random candidate
    const newPerson = candidates[Math.floor(Math.random() * candidates.length)];

    // Update assignment
    paTotals[currentPerson] -= shift.pa || 0;
    paTotals[newPerson.id] = (paTotals[newPerson.id] || 0) + (shift.pa || 0);
    assignment[shift.id] = newPerson.id;
  }

  return { assignment, paTotals };
};

/**
 * Create a completely randomized valid solution.
 * Useful as an alternative starting point for restarts.
 *
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @param {Map<string, Set<string>>} conflictMap
 * @returns {{assignment: Object, paTotals: Object}}
 */
export const createRandomSolution = (shifts, participants, preferences, conflictMap) => {
  const assignment = {};
  const paTotals = {};
  participants.forEach(p => paTotals[p.id] = 0);

  // Random order
  const shuffledShifts = [...shifts].sort(() => Math.random() - 0.5);

  for (const shift of shuffledShifts) {
    const candidates = participants.filter(p =>
      (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
      canAssign(p.id, shift.id, assignment, conflictMap)
    );

    if (candidates.length === 0) continue;

    // Random selection weighted slightly by preference
    const weights = candidates.map(c => preferences[c.id]?.[shift.id] ?? 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;

    let selected = candidates[0];
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selected = candidates[i];
        break;
      }
    }

    assignment[shift.id] = selected.id;
    paTotals[selected.id] += shift.pa || 0;
  }

  return { assignment, paTotals };
};
