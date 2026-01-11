import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Users, Grid3X3, Zap, Save, Upload, Layers, RotateCcw, AlertTriangle } from 'lucide-react';

import { getMonday, jumpToShiftsWeek } from './utils/dateUtils.js';
import { saveToFile, loadFromFile } from './utils/fileUtils.js';
import { optimizeAsync } from './optimizer/index.js';
import { generateExampleData } from './data/exampleData.js';

import {
  useStore,
  replaceState,
  resetState,
  updateState,
  getStateForExport
} from './store.js';

import { TemplatesTab } from './components/tabs/TemplatesTab.js';
import { ParticipantsTab } from './components/tabs/ParticipantsTab.js';
import { PreferencesTab } from './components/tabs/PreferencesTab.js';
import { ResultsTab } from './components/tabs/ResultsTab.js';

const { useState } = React;
const h = React.createElement;

function ShiftOptimizer() {
  const [tab, setTab] = useState('templates');

  // Use centralized store - UI auto-updates when store changes
  const store = useStore();
  const { shiftTypes, days, weekPatterns, shifts, participants, preferences, solution } = store;

  // Setters that update the store
  const setShiftTypes = (v) => updateState({ shiftTypes: v });
  const setDays = (v) => updateState({ days: v });
  const setWeekPatterns = (v) => updateState({ weekPatterns: v });
  const setShifts = (v) => updateState({ shifts: v });
  const setParticipants = (v) => updateState({ participants: v });
  const setPreferences = (v) => updateState({ preferences: v });
  const setResult = (v) => updateState({ solution: v });

  // Calendar navigation state (UI-only, not persisted)
  const [resultsWeekStart, setResultsWeekStart] = useState(() => getMonday(new Date()));
  const [prefsWeekStart, setPrefsWeekStart] = useState(() => getMonday(new Date()));

  // Optimization state (UI-only)
  const [optimizationError, setOptimizationError] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(null);
  const [warningModal, setWarningModal] = useState(null);

  const jumpAllCalendarsToShifts = (shiftList) => {
    const weekStart = jumpToShiftsWeek(shiftList);
    if (weekStart) {
      setResultsWeekStart(new Date(weekStart));
      setPrefsWeekStart(new Date(weekStart));
    }
  };

  const handleSave = () => {
    const data = getStateForExport();
    saveToFile(data);
  };

  const handleLoad = async () => {
    try {
      const data = await loadFromFile();
      if (!data) return;

      // Replace entire store - UI auto-updates via subscription
      replaceState(data);

      // Jump calendars to loaded shifts
      if (data.shifts) {
        jumpAllCalendarsToShifts(data.shifts);
      }

      setOptimizationError(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadExample = () => {
    const data = generateExampleData();
    replaceState({
      shiftTypes: data.shiftTypes,
      days: data.days || [],
      weekPatterns: data.weekPatterns,
      shifts: data.shifts,
      participants: data.participants,
      preferences: data.preferences,
      solution: null
    });
    jumpAllCalendarsToShifts(data.shifts);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      resetState();
      setOptimizationError(null);
    }
  };

  // Check for participants with no shift types who have a quota
  const getParticipantsWithNoShiftTypes = () => {
    return participants.filter(p =>
      (p.paQuota || 0) > 0 &&
      p.shiftTypeIds &&
      p.shiftTypeIds.length === 0
    );
  };

  const doRunOptimizer = async () => {
    setWarningModal(null);

    // Pre-solve capacity check
    const totalPaRequired = shifts.reduce((sum, s) => sum + (s.pa || 0), 0);
    const totalPaCapacity = participants.reduce((sum, p) => sum + (p.paQuota || 0), 0);

    if (totalPaRequired > totalPaCapacity) {
      setTab('results');
      setResult(null);
      setOptimizationError({
        message: 'Insufficient PA capacity',
        capacityShortfall: {
          required: totalPaRequired,
          available: totalPaCapacity,
          shortfall: totalPaRequired - totalPaCapacity
        }
      });
      return;
    }

    setIsOptimizing(true);
    setOptimizeProgress({ phase: 'greedy', progress: 0, iterations: 0, bestScore: null });
    setTab('results');

    // Small delay to let UI update before heavy computation
    await new Promise(r => setTimeout(r, 50));

    const res = await optimizeAsync(shifts, participants, preferences, (progress) => {
      setOptimizeProgress(progress);
    });

    setIsOptimizing(false);
    setOptimizeProgress(null);

    if (res === null) {
      setResult(null);
      setOptimizationError({ message: 'No shifts or participants defined.' });
    } else if (res.failed) {
      setResult(null);
      setOptimizationError({ message: 'Unable to create a schedule', unavailableShifts: res.unavailableShifts });
    } else {
      setResult(res);
      setOptimizationError(null);
    }
  };

  const runOptimizer = async () => {
    const problemParticipants = getParticipantsWithNoShiftTypes();
    if (problemParticipants.length > 0) {
      setWarningModal({ participants: problemParticipants });
      return;
    }
    doRunOptimizer();
  };

  const tabs = [
    { id: 'templates', label: 'Rota Builder', icon: Layers },
    { id: 'participants', label: 'People', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: Grid3X3 },
    { id: 'results', label: 'Results', icon: Zap },
  ];

  return h('div', { className: 'min-h-screen bg-slate-50 p-6' },
    h('div', { className: 'max-w-4xl mx-auto' },
      // Header
      h('div', { className: 'flex flex-wrap items-center justify-between gap-3 mb-6' },
        h('h1', { className: 'text-2xl font-bold text-slate-800' }, "Rota-Optimiser"),
        h('div', { className: 'flex flex-wrap gap-2' },
          h('button', {
            onClick: handleSave,
            className: 'px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2'
          }, h(Save, { size: 16 }), 'Save'),
          h('button', {
            onClick: handleLoad,
            className: 'px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2'
          }, h(Upload, { size: 16 }), 'Load'),
          h('button', {
            onClick: loadExample,
            className: 'px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium'
          }, 'Example'),
          h('button', {
            onClick: handleReset,
            className: 'px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center gap-2'
          }, h(RotateCcw, { size: 16 }), 'Reset')
        )
      ),

      // Tabs
      h('div', { className: 'flex flex-wrap gap-2 mb-6' },
        tabs.map(({ id, label, icon: Icon }) =>
          h('button', {
            key: id,
            onClick: () => setTab(id),
            className: `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base sm:px-4 ${
              tab === id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`
          },
            h(Icon, { size: 18 }),
            label
          )
        )
      ),

      // Content
      h('div', { className: 'bg-white rounded-xl shadow-sm p-6' },
        tab === 'templates' && h(TemplatesTab, {
          shiftTypes,
          setShiftTypes,
          days,
          setDays,
          weekPatterns,
          setWeekPatterns,
          shifts,
          setShifts,
          participants,
          preferences,
          setPreferences,
          jumpAllCalendarsToShifts,
          setTab
        }),

        tab === 'participants' && h(ParticipantsTab, {
          participants,
          setParticipants,
          preferences,
          setPreferences,
          shiftTypes
        }),

        tab === 'preferences' && h(PreferencesTab, {
          shifts,
          participants,
          preferences,
          setPreferences,
          prefsWeekStart,
          setPrefsWeekStart,
          runOptimizer,
          isOptimizing
        }),

        tab === 'results' && h(ResultsTab, {
          shifts,
          participants,
          preferences,
          result: solution,
          optimizationError,
          isOptimizing,
          optimizeProgress,
          resultsWeekStart,
          setResultsWeekStart
        })
      ),

      // Warning modal for participants with no shift types
      warningModal && h('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
        h('div', { className: 'bg-white rounded-xl shadow-xl max-w-md w-full p-6' },
          h('div', { className: 'flex items-start gap-3 mb-4' },
            h(AlertTriangle, { size: 24, className: 'text-amber-500 flex-shrink-0' }),
            h('div', null,
              h('h3', { className: 'font-semibold text-lg text-slate-800' }, 'Some participants can\'t be assigned'),
              h('p', { className: 'text-slate-600 text-sm mt-1' },
                'The following participants have a PA quota but no shift types assigned. They won\'t receive any shifts:'
              )
            )
          ),
          h('div', { className: 'bg-amber-50 rounded-lg p-3 mb-4' },
            h('ul', { className: 'text-sm text-amber-800 space-y-1' },
              warningModal.participants.map(p =>
                h('li', { key: p.id, className: 'flex justify-between' },
                  h('span', { className: 'font-medium' }, p.name),
                  h('span', { className: 'text-amber-600' }, `${p.paQuota} PA quota`)
                )
              )
            )
          ),
          h('p', { className: 'text-slate-500 text-sm mb-4' },
            'You can fix this by editing them on the People tab to add shift types, or setting their quota to 0.'
          ),
          h('div', { className: 'flex gap-3' },
            h('button', {
              onClick: () => setWarningModal(null),
              className: 'flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium'
            }, 'Cancel'),
            h('button', {
              onClick: () => doRunOptimizer(),
              className: 'flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium'
            }, 'Run Anyway')
          )
        )
      )
    )
  );
}

// Mount the app
const root = createRoot(document.getElementById('root'));
root.render(h(ShiftOptimizer));
