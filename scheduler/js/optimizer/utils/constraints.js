/**
 * Constraint handling utilities for the scheduler optimizer.
 * Manages time conflicts and assignment validation.
 */

/**
 * Convert time string "HH:MM" to minutes since midnight.
 * @param {string} timeStr
 * @returns {number}
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if two shifts overlap in time (same date required).
 * Handles overnight shifts correctly.
 * @param {Object} shiftA
 * @param {Object} shiftB
 * @returns {boolean}
 */
export const shiftsOverlap = (shiftA, shiftB) => {
  if (shiftA.date !== shiftB.date) return false;
  if (shiftA.id === shiftB.id) return false;

  const startA = timeToMinutes(shiftA.time);
  const startB = timeToMinutes(shiftB.time);
  const durationA = (shiftA.duration || 0) * 60;
  const durationB = (shiftB.duration || 0) * 60;
  let endA = startA + durationA;
  let endB = startB + durationB;

  const isOvernightA = endA > 24 * 60;
  const isOvernightB = endB > 24 * 60;

  if (!isOvernightA && !isOvernightB) {
    return startA < endB && endA > startB;
  }

  // Handle overnight shifts
  const periodsA = isOvernightA ? [[startA, 24 * 60], [0, endA - 24 * 60]] : [[startA, endA]];
  const periodsB = isOvernightB ? [[startB, 24 * 60], [0, endB - 24 * 60]] : [[startB, endB]];

  for (const [aStart, aEnd] of periodsA) {
    for (const [bStart, bEnd] of periodsB) {
      if (aStart < bEnd && aEnd > bStart) return true;
    }
  }
  return false;
};

/**
 * Build a map of which shifts conflict with each other (overlapping times).
 * @param {Object[]} shifts
 * @returns {Map<string, Set<string>>}
 */
export const buildConflictMap = (shifts) => {
  const conflictMap = new Map();

  for (const shift of shifts) {
    conflictMap.set(shift.id, new Set());
  }

  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      if (shiftsOverlap(shifts[i], shifts[j])) {
        conflictMap.get(shifts[i].id).add(shifts[j].id);
        conflictMap.get(shifts[j].id).add(shifts[i].id);
      }
    }
  }

  return conflictMap;
};

/**
 * Check if a person can be assigned to a shift without time conflicts.
 * @param {string} personId
 * @param {string} shiftId
 * @param {Object} assignment - Current shift assignments { shiftId: personId }
 * @param {Map<string, Set<string>>} conflictMap
 * @returns {boolean}
 */
export const canAssign = (personId, shiftId, assignment, conflictMap) => {
  const conflicts = conflictMap.get(shiftId);
  if (!conflicts) return true;

  for (const conflictingId of conflicts) {
    if (assignment[conflictingId] === personId) return false;
  }
  return true;
};

/**
 * Find shifts where nobody is available (all preferences are 0).
 * @param {Object[]} shifts
 * @param {Object[]} participants
 * @param {Object} preferences
 * @returns {Object[]}
 */
export const findUnavailableShifts = (shifts, participants, preferences) => {
  return shifts.filter(shift =>
    participants.every(p => (preferences[p.id]?.[shift.id] ?? 0) === 0)
  );
};
