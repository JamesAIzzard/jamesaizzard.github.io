import * as React from 'react';
import { Search, Star, X } from 'lucide-react';
import { WeekNavigation } from '../ui/WeekNavigation.js';
import { getWeekDates, formatDateKey, groupShiftsByDate, navigateWeek, jumpToShiftsWeek, DAY_NAMES } from '../../utils/dateUtils.js';

const { useState } = React;
const h = React.createElement;

// Calculate end time from start time and duration (hours)
const calculateEndTime = (startTime, durationHours) => {
  if (!startTime || !durationHours) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

export const ResultsTab = ({
  shifts,
  participants,
  preferences,
  result,
  optimizationError,
  isOptimizing,
  optimizeProgress,
  resultsWeekStart,
  setResultsWeekStart
}) => {
  const [doctorSearch, setDoctorSearch] = useState('');

  const handleNavigate = (direction) => {
    setResultsWeekStart(prev => navigateWeek(prev, direction));
  };

  const handleJumpToShifts = () => {
    const weekStart = jumpToShiftsWeek(shifts);
    if (weekStart) setResultsWeekStart(weekStart);
  };

  // Optimizing state
  if (isOptimizing) {
    return h('div', null,
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Optimized Schedule'),
      h('div', { className: 'py-12' },
        h('div', { className: 'flex flex-col items-center gap-4' },
          // Spinner
          h('div', { className: 'w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin' }),
          // Phase indicator
          h('p', { className: 'text-lg font-medium text-slate-700' },
            optimizeProgress?.phase === 'greedy' ? 'Building initial schedule...' :
            optimizeProgress?.phase === 'local-search' ? 'Improving assignments...' :
            optimizeProgress?.phase === 'annealing' ? 'Fine-tuning schedule...' :
            'Optimizing...'
          ),
          // Restart indicator
          optimizeProgress?.totalRestarts && h('p', { className: 'text-sm text-slate-500' },
            `Pass ${optimizeProgress.restart || 1} of ${optimizeProgress.totalRestarts}`
          ),
          // Progress bar
          h('div', { className: 'w-full max-w-md' },
            h('div', { className: 'h-3 bg-slate-200 rounded-full overflow-hidden' },
              h('div', {
                className: 'h-full bg-indigo-600 transition-all duration-150',
                style: { width: `${optimizeProgress?.progress || 0}%` }
              })
            ),
            h('div', { className: 'flex justify-between mt-2 text-sm text-slate-500' },
              h('span', null, `${(optimizeProgress?.progress || 0).toFixed(3)}% complete`),
              h('span', null, `${(optimizeProgress?.iterations || 0).toLocaleString()} iterations`)
            )
          ),
          // Best score so far
          optimizeProgress?.bestScore !== null && h('p', { className: 'text-sm text-emerald-600' },
            `Best score found: ${optimizeProgress.bestScore}`
          )
        )
      )
    );
  }

  // No result yet
  if (!result) {
    if (optimizationError) {
      return h('div', null,
        h('h2', { className: 'text-lg font-semibold mb-4' }, 'Optimized Schedule'),
        h('div', { className: 'p-4 bg-red-50 border border-red-200 rounded-lg' },
          h('p', { className: 'text-red-800 font-medium' }, optimizationError.message),
          optimizationError.capacityShortfall && h('div', { className: 'mt-3' },
            h('div', { className: 'grid grid-cols-3 gap-4 text-center' },
              h('div', null,
                h('div', { className: 'text-2xl font-bold text-red-700' }, optimizationError.capacityShortfall.required),
                h('div', { className: 'text-xs text-red-600' }, 'PA Required')
              ),
              h('div', null,
                h('div', { className: 'text-2xl font-bold text-amber-600' }, optimizationError.capacityShortfall.available),
                h('div', { className: 'text-xs text-amber-600' }, 'PA Available')
              ),
              h('div', null,
                h('div', { className: 'text-2xl font-bold text-red-700' }, optimizationError.capacityShortfall.shortfall),
                h('div', { className: 'text-xs text-red-600' }, 'Shortfall')
              )
            ),
            h('p', { className: 'mt-3 text-sm text-red-600' }, 'Add more participants or increase PA quotas to cover all shifts.')
          ),
          optimizationError.unavailableShifts && h('div', { className: 'mt-2' },
            h('p', { className: 'text-red-600 text-sm' }, 'The following shifts have no one available:'),
            h('ul', { className: 'mt-1 text-red-600 text-sm list-disc list-inside' },
              optimizationError.unavailableShifts.map(shift =>
                h('li', { key: shift.id }, `${shift.name} (${shift.date}${shift.time ? ' ' + shift.time : ''})`)
              )
            )
          )
        )
      );
    }

    return h('div', null,
      h('h2', { className: 'text-lg font-semibold mb-4' }, 'Optimized Schedule'),
      h('p', { className: 'text-slate-500 text-center py-8' }, 'Run the optimizer to see results')
    );
  }

  // Results view
  const groupedShifts = groupShiftsByDate(shifts);

  return h('div', null,
    h('h2', { className: 'text-lg font-semibold mb-4' }, 'Optimized Schedule'),

    // Doctor search
    h('div', { className: 'mb-4' },
      h('div', { className: 'relative' },
        h(Search, { size: 16, className: 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' }),
        h('input', {
          type: 'text',
          placeholder: 'Search doctors...',
          value: doctorSearch,
          onChange: (e) => setDoctorSearch(e.target.value),
          className: `w-full pl-9 ${doctorSearch ? 'pr-9' : 'pr-3'} py-2 border rounded-lg`
        }),
        doctorSearch && h('button', {
          type: 'button',
          onClick: () => setDoctorSearch(''),
          className: 'absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded'
        }, h(X, { size: 16 }))
      )
    ),

    result.quotasNotMet && h('div', { className: 'mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg' },
      h('span', { className: 'text-amber-800 font-medium' }, 'Could not satisfy all PA quotas. Showing best possible assignment.')
    ),

    h('div', { className: 'mb-4 p-4 bg-emerald-50 rounded-lg' },
      h('span', { className: 'text-emerald-800 font-medium' }, `Total Satisfaction Score: ${result.score}`)
    ),

    h('h3', { className: 'font-medium text-slate-700 mb-2' }, 'PA Summary'),

    // Check for over-quota participants
    (() => {
      const overQuota = participants.filter(p => (result.paTotals[p.id] || 0) > p.paQuota);
      return overQuota.length > 0 && h('div', { className: 'mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg' },
        h('p', { className: 'text-amber-800 font-medium text-sm' },
          `${overQuota.length} participant${overQuota.length > 1 ? 's' : ''} assigned more than their quota`
        )
      );
    })(),

    h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6' },
      participants
        .filter(p => !doctorSearch || p.name.toLowerCase().includes(doctorSearch.toLowerCase()))
        .map((p) => {
          const assigned = result.paTotals[p.id] || 0;
          const underQuota = assigned < p.paQuota;
          const overQuota = assigned > p.paQuota;
          const isHighlighted = doctorSearch && p.name.toLowerCase().includes(doctorSearch.toLowerCase());
          const bgColor = overQuota ? 'bg-amber-50 border border-amber-300' : underQuota ? 'bg-red-50' : 'bg-emerald-50';
          const textColor = overQuota ? 'text-amber-700' : underQuota ? 'text-red-700' : 'text-emerald-700';
          const icon = overQuota ? '' : underQuota ? '' : '';
          const isFiltered = doctorSearch && doctorSearch.toLowerCase() === p.name.toLowerCase();
          return h('button', {
            key: p.id,
            type: 'button',
            onClick: () => setDoctorSearch(isFiltered ? '' : p.name),
            className: `p-3 rounded-lg cursor-pointer transition-all text-left w-full ${bgColor} ${isHighlighted ? 'ring-2 ring-indigo-400' : ''} hover:ring-2 hover:ring-indigo-300`
          },
            h('div', { className: 'font-medium' }, p.name),
            h('div', { className: `text-sm ${textColor}` },
              assigned, ' / ', p.paQuota, ' PA ', icon,
              overQuota && h('span', { className: 'ml-1 text-xs' }, `(+${(assigned - p.paQuota).toFixed(1)} over)`)
            )
          );
        })
    ),

    h('h3', { className: 'font-medium text-slate-700 mb-2' }, 'Shift Assignments'),

    // Results week navigation
    h(WeekNavigation, {
      weekStart: resultsWeekStart,
      onNavigate: handleNavigate,
      onJumpToShifts: handleJumpToShifts,
      hasShifts: shifts.length > 0
    }),

    // Results calendar grid
    h('div', { className: 'overflow-x-auto' },
      h('div', { className: 'grid grid-cols-7 gap-2 min-w-[700px]' },
        getWeekDates(resultsWeekStart).map((date) => {
          const dateKey = formatDateKey(date);
          const dayShifts = (groupedShifts[dateKey] || []).filter(s => {
            if (!doctorSearch) return true;
            const assignedId = result.assignment[s.id];
            const person = participants.find(p => p.id === assignedId);
            return person && person.name.toLowerCase().includes(doctorSearch.toLowerCase());
          });
          const isToday = formatDateKey(new Date()) === dateKey;

          return h('div', {
            key: dateKey,
            className: `border rounded-lg p-2 min-h-[120px] ${isToday ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`
          },
            h('div', { className: `text-center mb-2 pb-2 border-b ${isToday ? 'border-indigo-200' : 'border-slate-100'}` },
              h('div', { className: 'text-xs text-slate-500' }, DAY_NAMES[date.getDay()]),
              h('div', { className: `font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-700'}` }, date.getDate())
            ),
            h('div', { className: 'space-y-1' },
              dayShifts.map((s) => {
                const assignedId = result.assignment[s.id];
                const person = participants.find((p) => p.id === assignedId);
                const pref = assignedId ? (preferences[assignedId]?.[s.id] ?? 0) : 0;
                const isHighlighted = doctorSearch && person && person.name.toLowerCase().includes(doctorSearch.toLowerCase());

                return h('div', {
                  key: s.id,
                  className: `p-2 rounded text-xs ${isHighlighted ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-100'}`
                },
                  h('div', { className: 'font-medium text-slate-700 truncate' }, s.name),
                  s.time && h('div', { className: 'text-slate-500' },
                    `${s.time} - ${s.endTime || calculateEndTime(s.time, s.duration) || '?'}`
                  ),
                  h('div', { className: 'text-indigo-600 font-medium' }, s.pa, ' PA'),
                  h('div', { className: 'mt-1 pt-1 border-t border-slate-200' },
                    person
                      ? h('div', {
                          onClick: (e) => {
                            e.stopPropagation();
                            const isFiltered = doctorSearch.toLowerCase() === person.name.toLowerCase();
                            setDoctorSearch(isFiltered ? '' : person.name);
                          },
                          className: 'cursor-pointer hover:bg-emerald-50 -mx-1 px-1 rounded'
                        },
                          h('div', { className: 'font-medium text-emerald-700 truncate' }, person.name),
                          h('div', { className: 'flex mt-0.5' },
                            [1,2,3,4,5].map((star) =>
                              h(Star, {
                                key: star,
                                size: 10,
                                className: star <= pref ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              })
                            )
                          )
                        )
                      : h('span', { className: 'text-red-500 font-medium' }, 'Unassigned')
                  )
                );
              })
            )
          );
        })
      )
    )
  );
};
