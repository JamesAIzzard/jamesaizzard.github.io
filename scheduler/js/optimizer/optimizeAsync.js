export const optimizeAsync = async (shifts, participants, preferences, onProgress) => {
  if (shifts.length === 0 || participants.length === 0) return null;

  // Find shifts where nobody is available (all preferences are 0)
  const unavailableShifts = shifts.filter(shift =>
    participants.every(p => (preferences[p.id]?.[shift.id] ?? 0) === 0)
  );

  if (unavailableShifts.length > 0) {
    return { failed: true, unavailableShifts };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  // Convert time string "HH:MM" to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if two shifts overlap in time (same date required)
  const shiftsOverlap = (shiftA, shiftB) => {
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

  // Build conflict map (which shifts overlap with each other)
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

  // Check if a person can be assigned to a shift without time conflicts
  const canAssign = (personId, shiftId, assignment) => {
    const conflicts = conflictMap.get(shiftId);
    if (!conflicts) return true;
    for (const conflictingId of conflicts) {
      if (assignment[conflictingId] === personId) return false;
    }
    return true;
  };

  // Get participants with quota > 0 (active participants for fairness calculation)
  const activeParticipants = participants.filter(p => (p.paQuota || 0) > 0);

  // Calculate utilization ratio for a participant
  const getUtilization = (personId, paTotals) => {
    const p = participants.find(x => x.id === personId);
    const quota = p?.paQuota || 0;
    if (quota === 0) return 0;
    return (paTotals[personId] || 0) / quota;
  };

  // Calculate variance of utilization across active participants (lower = more even)
  const calculateVariance = (paTotals) => {
    if (activeParticipants.length === 0) return 0;
    const ratios = activeParticipants.map(p => getUtilization(p.id, paTotals));
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    return ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
  };

  // Calculate total preference score
  const calculateScore = (assignment) => {
    let score = 0;
    for (const [shiftId, personId] of Object.entries(assignment)) {
      score += preferences[personId]?.[shiftId] ?? 0;
    }
    return score;
  };

  // Progress tracking
  let lastProgressUpdate = Date.now();
  let iterations = 0;

  const updateProgress = async (phase, progress, score) => {
    const now = Date.now();
    if (now - lastProgressUpdate > 50) {
      lastProgressUpdate = now;
      onProgress({ phase, progress, iterations, bestScore: score });
      await new Promise(r => setTimeout(r, 0));
    }
  };

  // ============================================
  // PHASE 1: GREEDY ASSIGNMENT (prioritize even distribution)
  // ============================================
  // Assign each shift to the person with the lowest utilization ratio
  // who is available and has a preference > 0

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
    iterations++;

    if (i % 10 === 0) {
      await updateProgress('greedy', Math.floor((i / sortedShifts.length) * 30), 0);
    }

    // Find all valid candidates (preference > 0 and no time conflict)
    const candidates = participants.filter(p =>
      (preferences[p.id]?.[shift.id] ?? 0) > 0 &&
      canAssign(p.id, shift.id, assignment)
    );

    if (candidates.length === 0) continue;

    // Sort by utilization (lowest first), then by preference (highest first) as tiebreaker
    candidates.sort((a, b) => {
      const utilA = getUtilization(a.id, paTotals);
      const utilB = getUtilization(b.id, paTotals);
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

  // ============================================
  // PHASE 2: LOCAL SEARCH (swap pairs to improve)
  // ============================================
  // Try swapping assignments between pairs of shifts
  // Accept swaps that either:
  //   1. Reduce variance (more even distribution)
  //   2. Keep same variance but improve preference score

  const VARIANCE_WEIGHT = 100; // How much we value evenness over preferences
  let improved = true;
  let pass = 0;
  const maxPasses = 50;

  while (improved && pass < maxPasses) {
    improved = false;
    pass++;

    await updateProgress('local-search', 30 + Math.floor((pass / maxPasses) * 70), calculateScore(assignment));

    // Try reassigning each shift to a better person
    for (const shift of shifts) {
      iterations++;
      const currentPerson = assignment[shift.id];
      if (!currentPerson) continue;

      const currentVariance = calculateVariance(paTotals);
      const currentPref = preferences[currentPerson]?.[shift.id] ?? 0;

      let bestMove = null;
      let bestImprovement = 0;

      for (const candidate of participants) {
        if (candidate.id === currentPerson) continue;
        if ((preferences[candidate.id]?.[shift.id] ?? 0) === 0) continue;
        if (!canAssign(candidate.id, shift.id, assignment)) continue;

        // Calculate new state
        const newPaTotals = { ...paTotals };
        newPaTotals[currentPerson] -= shift.pa || 0;
        newPaTotals[candidate.id] = (newPaTotals[candidate.id] || 0) + (shift.pa || 0);

        const newVariance = calculateVariance(newPaTotals);
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

    // Try swapping pairs of assignments
    for (let i = 0; i < shifts.length && pass < maxPasses; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        iterations++;
        const shiftA = shifts[i];
        const shiftB = shifts[j];
        const personA = assignment[shiftA.id];
        const personB = assignment[shiftB.id];

        if (!personA || !personB || personA === personB) continue;

        // Check if swap is valid (both can do each other's shift preference-wise)
        const prefAforB = preferences[personA]?.[shiftB.id] ?? 0;
        const prefBforA = preferences[personB]?.[shiftA.id] ?? 0;
        if (prefAforB === 0 || prefBforA === 0) continue;

        // Check for time conflicts after swap
        const tempAssignment = { ...assignment };
        delete tempAssignment[shiftA.id];
        delete tempAssignment[shiftB.id];
        if (!canAssign(personA, shiftB.id, tempAssignment)) continue;
        tempAssignment[shiftB.id] = personA;
        if (!canAssign(personB, shiftA.id, tempAssignment)) continue;

        // Calculate improvement
        const oldPref = (preferences[personA]?.[shiftA.id] ?? 0) + (preferences[personB]?.[shiftB.id] ?? 0);
        const newPref = prefAforB + prefBforA;

        // Variance doesn't change for swaps (same people, same total PAs)
        // So just check preference improvement
        if (newPref > oldPref) {
          assignment[shiftA.id] = personB;
          assignment[shiftB.id] = personA;
          improved = true;
        }
      }
    }
  }

  // ============================================
  // RETURN RESULTS
  // ============================================

  const finalScore = calculateScore(assignment);
  const finalVariance = calculateVariance(paTotals);

  // Check if any quotas were not met
  const quotasNotMet = activeParticipants.some(p => (paTotals[p.id] || 0) < (p.paQuota || 0));

  onProgress({ phase: 'complete', progress: 100, iterations, bestScore: finalScore });

  return {
    assignment,
    score: finalScore,
    paTotals,
    quotasNotMet,
    variance: finalVariance
  };
};
