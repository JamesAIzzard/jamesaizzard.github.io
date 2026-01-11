/**
 * Centralized data store for the scheduler application.
 * Maintains all application state in a single JSON structure
 * and persists to localStorage.
 */

const STORAGE_KEY = 'scheduler_data';
const CURRENT_VERSION = 5;

/**
 * Default empty state structure
 */
const createEmptyState = () => ({
  version: CURRENT_VERSION,

  // Shift type definitions (e.g., "ICU", "A&E")
  shiftTypes: [],

  // Day patterns with their shift assignments
  // Each day: { id, name, shifts: [{ id, name, time, duration, pa, shiftTypeId }] }
  days: [],

  // Week patterns mapping weekdays to day patterns
  // Each pattern: { id, name, days: { mon, tue, wed, thu, fri, sat, sun } }
  weekPatterns: [],

  // Generated shifts (instances from templates)
  // Each shift: { id, name, date, time, duration, endTime, pa, shiftTypeId }
  shifts: [],

  // Participants (doctors) with their capabilities
  // Each participant: { id, name, paQuota, shiftTypeIds: [] }
  participants: [],

  // Preferences: nested object { participantId: { shiftId: rating } }
  // Rating: 0 = unavailable, 1-5 = preference level
  preferences: {},

  // Current solution from optimizer
  // { assignment: { shiftId: participantId }, paTotals: { participantId: total }, score }
  solution: null
});

/**
 * The current state - initialized from localStorage or empty
 */
let state = loadFromStorage();

/**
 * Subscribers to state changes
 */
const subscribers = new Set();

/**
 * Load state from localStorage
 */
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateState(parsed);
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return createEmptyState();
}

/**
 * Migrate state from older versions
 */
function migrateState(data) {
  const empty = createEmptyState();

  // Handle version 4 or earlier (had 'result' instead of 'solution')
  if (data.version <= 4 && data.result) {
    data.solution = data.result;
    delete data.result;
  }

  // Merge with empty state to ensure all fields exist
  return {
    ...empty,
    ...data,
    version: CURRENT_VERSION
  };
}

/**
 * Save state to localStorage
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
  subscribers.forEach(callback => callback(state));
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Called with new state on each change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Get the current state (read-only snapshot)
 */
export function getState() {
  return state;
}

/**
 * Get the full state as JSON for saving to file
 */
export function getStateForExport() {
  return { ...state };
}

/**
 * Update state with partial changes and persist
 * @param {Object} updates - Partial state to merge
 */
export function updateState(updates) {
  state = { ...state, ...updates };
  saveToStorage();
  notifySubscribers();
}

/**
 * Replace entire state (for loading from file)
 * @param {Object} newState - Complete new state
 */
export function replaceState(newState) {
  state = migrateState(newState);
  saveToStorage();
  notifySubscribers();
}

/**
 * Reset to empty state
 */
export function resetState() {
  state = createEmptyState();
  saveToStorage();
  notifySubscribers();
}

// Individual field setters for convenience

export function setShiftTypes(shiftTypes) {
  updateState({ shiftTypes });
}

export function setDays(days) {
  updateState({ days });
}

export function setWeekPatterns(weekPatterns) {
  updateState({ weekPatterns });
}

export function setShifts(shifts) {
  updateState({ shifts });
}

export function setParticipants(participants) {
  updateState({ participants });
}

export function setPreferences(preferences) {
  updateState({ preferences });
}

export function setSolution(solution) {
  updateState({ solution });
}

/**
 * Update a single preference
 * @param {string} participantId
 * @param {string} shiftId
 * @param {number} value - 0-5 rating
 */
export function updatePreference(participantId, shiftId, value) {
  const newPrefs = {
    ...state.preferences,
    [participantId]: {
      ...state.preferences[participantId],
      [shiftId]: value
    }
  };
  updateState({ preferences: newPrefs });
}

/**
 * Clear solution (useful before re-optimizing)
 */
export function clearSolution() {
  updateState({ solution: null });
}

// React hook for using the store
import * as React from 'react';

/**
 * React hook to subscribe to store changes
 * @returns {Object} Current state
 */
export function useStore() {
  const [currentState, setCurrentState] = React.useState(state);

  React.useEffect(() => {
    const unsubscribe = subscribe(newState => {
      setCurrentState({ ...newState });
    });
    return unsubscribe;
  }, []);

  return currentState;
}

/**
 * React hook for a specific field with setter
 * @param {string} field - Field name in state
 * @returns {[any, Function]} [value, setter]
 */
export function useStoreField(field) {
  const [value, setValue] = React.useState(state[field]);

  React.useEffect(() => {
    const unsubscribe = subscribe(newState => {
      setValue(newState[field]);
    });
    return unsubscribe;
  }, [field]);

  const setter = React.useCallback((newValue) => {
    updateState({ [field]: newValue });
  }, [field]);

  return [value, setter];
}
