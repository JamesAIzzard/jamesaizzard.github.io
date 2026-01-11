/**
 * Scoring utilities for evaluating solution quality.
 * Handles fairness (variance) and satisfaction (preference) metrics.
 */

/**
 * Get participants with quota > 0 (active participants for fairness calculation).
 * @param {Object[]} participants
 * @returns {Object[]}
 */
export const getActiveParticipants = (participants) => {
  return participants.filter(p => (p.paQuota || 0) > 0);
};

/**
 * Calculate utilization ratio for a participant.
 * @param {string} personId
 * @param {Object} paTotals - { personId: totalPA }
 * @param {Object[]} participants
 * @returns {number}
 */
export const getUtilization = (personId, paTotals, participants) => {
  const p = participants.find(x => x.id === personId);
  const quota = p?.paQuota || 0;
  if (quota === 0) return 0;
  return (paTotals[personId] || 0) / quota;
};

/**
 * Calculate variance of utilization across active participants.
 * Lower variance = more even workload distribution.
 * @param {Object} paTotals
 * @param {Object[]} activeParticipants
 * @returns {number}
 */
export const calculateVariance = (paTotals, activeParticipants) => {
  if (activeParticipants.length === 0) return 0;

  const ratios = activeParticipants.map(p => {
    const quota = p.paQuota || 0;
    if (quota === 0) return 0;
    return (paTotals[p.id] || 0) / quota;
  });

  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
};

/**
 * Calculate total preference score for an assignment.
 * @param {Object} assignment - { shiftId: personId }
 * @param {Object} preferences - { personId: { shiftId: score } }
 * @returns {number}
 */
export const calculatePreferenceScore = (assignment, preferences) => {
  let score = 0;
  for (const [shiftId, personId] of Object.entries(assignment)) {
    score += preferences[personId]?.[shiftId] ?? 0;
  }
  return score;
};

/**
 * Weight for variance in combined objective function.
 * Higher = more emphasis on even distribution vs preferences.
 */
export const VARIANCE_WEIGHT = 100;

/**
 * Evaluate a solution's quality as a single comparable value.
 * Higher is better (combines negative variance with positive preference).
 * @param {Object} assignment
 * @param {Object} paTotals
 * @param {Object[]} activeParticipants
 * @param {Object} preferences
 * @returns {number}
 */
export const evaluateSolution = (assignment, paTotals, activeParticipants, preferences) => {
  const variance = calculateVariance(paTotals, activeParticipants);
  const prefScore = calculatePreferenceScore(assignment, preferences);
  // Negative variance (lower is better) + preference score (higher is better)
  return -variance * VARIANCE_WEIGHT + prefScore;
};

/**
 * Compare two solutions, returns true if solution A is better than B.
 * @param {Object} solutionA
 * @param {Object} solutionB
 * @param {Object[]} activeParticipants
 * @param {Object} preferences
 * @returns {boolean}
 */
export const isBetterSolution = (solutionA, solutionB, activeParticipants, preferences) => {
  if (!solutionB) return true;
  if (!solutionA) return false;

  const scoreA = evaluateSolution(solutionA.assignment, solutionA.paTotals, activeParticipants, preferences);
  const scoreB = evaluateSolution(solutionB.assignment, solutionB.paTotals, activeParticipants, preferences);

  return scoreA > scoreB;
};
