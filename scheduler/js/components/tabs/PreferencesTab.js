import * as React from 'react';
import { Star, Zap } from 'lucide-react';
import { WeekNavigation } from '../ui/WeekNavigation.js';
import { PreferenceModal } from '../PreferenceModal.js';
import { getWeekDates, formatDateKey, groupShiftsByDate, navigateWeek, jumpToShiftsWeek, DAY_NAMES } from '../../utils/dateUtils.js';

const { useState } = React;
const h = React.createElement;

export const PreferencesTab = ({
  shifts,
  participants,
  preferences,
  setPreferences,
  prefsWeekStart,
  setPrefsWeekStart,
  runOptimizer,
  isOptimizing
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [prefModal, setPrefModal] = useState(null);

  const updatePref = (pId, sId, value) => {
    setPreferences({
      ...preferences,
      [pId]: { ...preferences[pId], [sId]: value }
    });
  };

  const handleNavigate = (direction) => {
    setPrefsWeekStart(prev => navigateWeek(prev, direction));
  };

  const handleJumpToShifts = () => {
    const weekStart = jumpToShiftsWeek(shifts);
    if (weekStart) setPrefsWeekStart(weekStart);
  };

  if (shifts.length === 0 && participants.length === 0) {
    return h('div', null,
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Set Preferences'),
      h('div', { className: 'text-center py-8' },
        h('p', { className: 'text-slate-500' }, 'Add shifts and participants first.')
      )
    );
  }

  if (shifts.length === 0) {
    return h('div', null,
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Set Preferences'),
      h('div', { className: 'text-center py-8' },
        h('p', { className: 'text-slate-500' }, 'Go to the Rota Builder tab and use "Generate Shifts" to create shifts first.')
      )
    );
  }

  if (participants.length === 0) {
    return h('div', null,
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Set Preferences'),
      h('div', { className: 'text-center py-8' },
        h('p', { className: 'text-slate-500' }, 'Go to the People tab to add participants first.')
      )
    );
  }

  const groupedShifts = groupShiftsByDate(shifts);

  return h('div', null,
    h('h2', { className: 'text-lg font-semibold mb-4' }, 'Set Preferences'),
    h('p', { className: 'text-slate-500 mb-4' }, 'Select a person, then rate each shift: 0 stars = cannot do, 5 stars = would love to'),

    // Participant selector
    h('div', { className: 'mb-4' },
      h('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Select Person'),
      h('div', { className: 'flex flex-wrap gap-2' },
        participants.map((p) =>
          h('button', {
            key: p.id,
            onClick: () => setSelectedParticipant(p.id),
            className: `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedParticipant === p.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`
          }, p.name, ' (', p.paQuota, ' PA)')
        )
      )
    ),

    // Week navigation
    selectedParticipant && h(WeekNavigation, {
      weekStart: prefsWeekStart,
      onNavigate: handleNavigate,
      onJumpToShifts: handleJumpToShifts,
      hasShifts: shifts.length > 0
    }),

    // Preferences calendar grid
    selectedParticipant && h('div', { className: 'overflow-x-auto' },
      h('div', { className: 'grid grid-cols-7 gap-2 min-w-[700px]' },
        getWeekDates(prefsWeekStart).map((date) => {
          const dateKey = formatDateKey(date);
          const dayShifts = groupedShifts[dateKey] || [];
          const isToday = formatDateKey(new Date()) === dateKey;

          return h('div', {
            key: dateKey,
            className: `border rounded-lg p-2 min-h-[120px] ${isToday ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`
          },
            h('div', { className: `text-center mb-2 pb-2 border-b ${isToday ? 'border-indigo-200' : 'border-slate-100'}` },
              h('div', { className: 'text-xs text-slate-500' }, DAY_NAMES[date.getDay()]),
              h('div', { className: `font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-700'}` }, date.getDate())
            ),
            h('div', { className: 'space-y-2' },
              dayShifts.map((s) => {
                const pref = preferences[selectedParticipant]?.[s.id] ?? 0;
                const participant = participants.find(p => p.id === selectedParticipant);
                const canDoShift = !participant?.shiftTypeIds || participant.shiftTypeIds.length === 0 ||
                  (s.shiftTypeId && participant.shiftTypeIds.includes(s.shiftTypeId));

                if (!canDoShift) {
                  return h('div', {
                    key: s.id,
                    className: 'w-full text-left p-2 rounded text-xs bg-slate-200 opacity-50 cursor-not-allowed'
                  },
                    h('div', { className: 'font-medium text-slate-500 truncate line-through' }, s.name),
                    s.time && h('div', { className: 'text-slate-400' },
                      s.time, s.endTime ? ` → ${s.endTime}` : ''
                    ),
                    h('div', { className: 'text-slate-400 font-medium' }, s.pa, ' PA'),
                    h('div', { className: 'text-xs text-red-400 mt-1 font-medium' }, 'Not qualified')
                  );
                }

                return h('button', {
                  key: s.id,
                  onClick: () => setPrefModal({ shift: s, participantId: selectedParticipant }),
                  className: `w-full text-left p-2 rounded text-xs cursor-pointer transition-colors hover:ring-2 hover:ring-indigo-300 ${pref > 0 ? 'bg-emerald-50' : 'bg-slate-100'}`
                },
                  h('div', { className: 'font-medium text-slate-700 truncate' }, s.name),
                  s.time && h('div', { className: 'text-slate-500' },
                    s.time, s.endTime ? ` → ${s.endTime}` : ''
                  ),
                  h('div', { className: 'text-indigo-600 font-medium' }, s.pa, ' PA'),
                  h('div', { className: 'flex gap-0.5 mt-1' },
                    [1, 2, 3, 4, 5].map((star) =>
                      h(Star, {
                        key: star,
                        size: 12,
                        className: star <= pref ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      })
                    )
                  )
                );
              })
            )
          );
        })
      )
    ),

    // Preference Modal
    prefModal && selectedParticipant && h(PreferenceModal, {
      shift: prefModal.shift,
      participant: participants.find(p => p.id === selectedParticipant),
      preference: preferences[selectedParticipant]?.[prefModal.shift.id] ?? 0,
      onSave: (value) => updatePref(selectedParticipant, prefModal.shift.id, value),
      onClose: () => setPrefModal(null)
    }),

    !selectedParticipant && h('p', { className: 'text-slate-500 text-center py-8' }, 'Select a person above to set their preferences'),

    // Optimize button
    shifts.length > 0 && participants.length > 0 &&
      h('button', {
        onClick: runOptimizer,
        disabled: isOptimizing,
        className: `mt-6 w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
          isOptimizing
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`
      }, h(Zap, { size: 20 }), isOptimizing ? ' Optimizing...' : ' Optimize Schedule')
  );
};
