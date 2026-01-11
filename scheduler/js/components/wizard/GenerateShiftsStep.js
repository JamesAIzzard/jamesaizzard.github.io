import * as React from 'react';
import { Calendar, Zap, AlertTriangle, Trash2 } from 'lucide-react';
import { DAY_ORDER } from '../../utils/dateUtils.js';

const { useState } = React;
const h = React.createElement;

/**
 * GenerateShiftsStep - Step 4 of the template wizard
 * Generate actual shifts from weeks for scheduling
 */
export const GenerateShiftsStep = ({
  weekPatterns,
  days,
  shifts,
  setShifts,
  participants,
  preferences,
  setPreferences,
  jumpAllCalendarsToShifts,
  setTab
}) => {
  const [generateConfig, setGenerateConfig] = useState({
    weekPatternId: '',
    startDate: '',
    numWeeks: 1
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper to get day IDs from a week's day slot (supports both old array format and new single-value format)
  const getDayIds = (dayValue) => {
    if (!dayValue) return [];
    if (Array.isArray(dayValue)) return dayValue;
    return [dayValue];
  };

  // Parse week string (YYYY-Www) to get Monday of that week
  const getWeekMonday = (weekStr) => {
    if (!weekStr) return null;
    const [year, week] = weekStr.split('-W').map(Number);
    // ISO week date: Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7; // Convert Sunday from 0 to 7
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - dayOfWeek + 1);
    // Add weeks to get to target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7);
    return targetMonday;
  };

  // Calculate the date range for new shifts
  const getNewShiftDateRange = () => {
    if (!generateConfig.startDate || !generateConfig.numWeeks) return null;
    const startDate = getWeekMonday(generateConfig.startDate);
    if (!startDate) return null;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (generateConfig.numWeeks * 7) - 1);

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Find overlapping shifts
  const getOverlappingShifts = () => {
    const range = getNewShiftDateRange();
    if (!range) return [];
    return shifts.filter(s => s.date >= range.start && s.date <= range.end);
  };

  const overlappingShifts = getOverlappingShifts();
  const hasOverlap = overlappingShifts.length > 0;

  const handleGenerateClick = () => {
    if (!generateConfig.weekPatternId || !generateConfig.startDate) return;
    // Show confirmation modal only if there's overlap
    if (hasOverlap) {
      setShowConfirmModal(true);
    } else {
      generateShifts(false);
    }
  };

  const clearAllShifts = () => {
    setShifts([]);
    setPreferences({});
  };

  const generateShifts = (replaceOverlapping = false) => {
    if (!generateConfig.weekPatternId || !generateConfig.startDate) return;
    const wp = weekPatterns.find(w => w.id === generateConfig.weekPatternId);
    if (!wp) return;

    const newShifts = [];
    const startDate = getWeekMonday(generateConfig.startDate);
    if (!startDate) return;

    for (let week = 0; week < generateConfig.numWeeks; week++) {
      DAY_ORDER.forEach((dayKey, dayIdx) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + dayIdx);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Resolve: week.days[dayKey] -> days -> shifts
        const dayIds = getDayIds(wp.days[dayKey]);
        dayIds.forEach(dayId => {
          const day = days.find(d => d.id === dayId);
          if (day && day.shifts) {
            day.shifts.forEach(shift => {
              newShifts.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: shift.shiftTypeName,
                date: dateStr,
                time: shift.time,
                duration: shift.duration,
                endTime: shift.endTime,
                pa: shift.pa,
                shiftTypeId: shift.shiftTypeId
              });
            });
          }
        });
      });
    }

    // Determine final shift list
    let finalShifts;
    if (replaceOverlapping) {
      // Remove overlapping shifts, keep non-overlapping
      const range = getNewShiftDateRange();
      const keptShifts = shifts.filter(s => s.date < range.start || s.date > range.end);
      finalShifts = [...keptShifts, ...newShifts];
    } else {
      // Just add new shifts
      finalShifts = [...shifts, ...newShifts];
    }

    // Update preferences: keep existing, add new with 3 stars for eligible
    const updatedPreferences = { ...preferences };
    participants.forEach(p => {
      if (!updatedPreferences[p.id]) updatedPreferences[p.id] = {};
      newShifts.forEach(shift => {
        const canDo = !p.shiftTypeIds || p.shiftTypeIds.length === 0 || p.shiftTypeIds.includes(shift.shiftTypeId);
        updatedPreferences[p.id][shift.id] = canDo ? 3 : 0;
      });
    });

    setShifts(finalShifts);
    setPreferences(updatedPreferences);
    jumpAllCalendarsToShifts(finalShifts);
    setShowConfirmModal(false);
    setTab('preferences');
  };

  const selectedPattern = weekPatterns.find(w => w.id === generateConfig.weekPatternId);
  const canGenerate = generateConfig.weekPatternId && generateConfig.startDate;

  // Calculate how many shifts will be generated
  const calculateShiftCount = () => {
    if (!selectedPattern) return 0;
    let count = 0;
    DAY_ORDER.forEach(dayKey => {
      const dayIds = getDayIds(selectedPattern.days[dayKey]);
      dayIds.forEach(dayId => {
        const day = days.find(d => d.id === dayId);
        if (day && day.shifts) {
          count += day.shifts.length;
        }
      });
    });
    return count * generateConfig.numWeeks;
  };

  if (weekPatterns.length === 0) {
    return h('div', { className: 'text-center py-8' },
      h('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block' },
        h('p', { className: 'text-amber-700 font-medium' }, 'No weeks defined yet'),
        h('p', { className: 'text-amber-600 text-sm mt-1' }, 'Go back to Step 3 to create weeks first.')
      )
    );
  }

  return h('div', { className: 'space-y-6' },
    h('div', { className: 'bg-emerald-50 border border-emerald-100 rounded-lg p-4' },
      h('p', { className: 'text-sm text-emerald-700' },
        'This is the final step! Select a week, choose your start date, and generate shifts for your schedule. ',
        'Generated shifts will appear in the Preferences tab, where people can assign preferences for each shift.'
      )
    ),

    // Generation form
    h('div', { className: 'bg-white border rounded-lg p-6' },
      h('div', { className: 'grid gap-6 md:grid-cols-3' },
        // Week selector
        h('div', null,
          h('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
            h('span', { className: 'flex items-center gap-2' },
              h(Calendar, { size: 16, className: 'text-slate-400' }),
              'Week'
            )
          ),
          h('select', {
            value: generateConfig.weekPatternId,
            onChange: (e) => setGenerateConfig({ ...generateConfig, weekPatternId: e.target.value }),
            className: 'w-full px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
          },
            h('option', { value: '' }, 'Select a week...'),
            weekPatterns.map(wp => h('option', { key: wp.id, value: wp.id }, wp.name))
          )
        ),

        // Start week
        h('div', null,
          h('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Start Week'),
          h('input', {
            type: 'week',
            value: generateConfig.startDate,
            onChange: (e) => setGenerateConfig({ ...generateConfig, startDate: e.target.value }),
            className: 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
          })
        ),

        // Number of weeks
        h('div', null,
          h('label', { className: 'block text-sm font-medium text-slate-700 mb-2' }, 'Number of Weeks'),
          h('input', {
            type: 'number',
            min: 1,
            max: 52,
            value: generateConfig.numWeeks,
            onChange: (e) => setGenerateConfig({ ...generateConfig, numWeeks: parseInt(e.target.value) || 1 }),
            className: 'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
          })
        )
      ),

      // Preview info
      selectedPattern && h('div', { className: 'mt-6 p-4 bg-slate-50 rounded-lg' },
        h('div', { className: 'flex items-center justify-between' },
          h('div', null,
            h('p', { className: 'text-sm font-medium text-slate-700' }, 'Preview'),
            h('p', { className: 'text-sm text-slate-500' },
              `Using "${selectedPattern.name}" for ${generateConfig.numWeeks} week${generateConfig.numWeeks !== 1 ? 's' : ''}`
            )
          ),
          h('div', { className: 'text-right' },
            h('p', { className: 'text-2xl font-bold text-emerald-600' }, calculateShiftCount()),
            h('p', { className: 'text-sm text-slate-500' }, 'shifts will be created')
          )
        )
      ),

      // Generate button
      h('button', {
        onClick: handleGenerateClick,
        disabled: !canGenerate,
        className: `mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-lg transition-colors ${canGenerate ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`
      },
        h(Zap, { size: 20 }),
        'Generate Shifts'
      )
    ),

    // Overlap warning (only shown when there's date overlap)
    hasOverlap && canGenerate && h('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-4' },
      h('div', { className: 'flex items-start gap-3' },
        h(AlertTriangle, { size: 20, className: 'text-amber-600 flex-shrink-0 mt-0.5' }),
        h('div', null,
          h('p', { className: 'text-sm font-medium text-amber-800' },
            `${overlappingShifts.length} existing shift${overlappingShifts.length !== 1 ? 's' : ''} in this date range`
          ),
          h('p', { className: 'text-sm text-amber-700 mt-1' },
            'These shifts will be replaced when you generate.'
          )
        )
      )
    ),

    // Existing shifts info with clear button
    shifts.length > 0 && h('div', { className: 'bg-blue-50 border border-blue-100 rounded-lg p-4' },
      h('div', { className: 'flex items-center justify-between' },
        h('p', { className: 'text-sm text-blue-700' },
          h('strong', null, `${shifts.length} existing shifts`),
          ' in your schedule.'
        ),
        h('button', {
          onClick: clearAllShifts,
          className: 'flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors'
        },
          h(Trash2, { size: 14 }),
          'Clear All'
        )
      )
    ),

    // Confirmation modal for overlap
    showConfirmModal && h('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
      h('div', { className: 'bg-white rounded-xl shadow-xl max-w-md w-full p-6' },
        h('div', { className: 'flex items-start gap-4 mb-4' },
          h('div', { className: 'p-3 bg-amber-100 rounded-full' },
            h(AlertTriangle, { size: 24, className: 'text-amber-600' })
          ),
          h('div', null,
            h('h3', { className: 'text-lg font-semibold text-slate-800' }, 'Replace overlapping shifts?'),
            h('p', { className: 'text-sm text-slate-600 mt-1' },
              `${overlappingShifts.length} existing shift${overlappingShifts.length !== 1 ? 's' : ''} fall within the selected date range and will be replaced.`
            )
          )
        ),
        h('div', { className: 'bg-slate-50 rounded-lg p-4 mb-6' },
          h('p', { className: 'text-sm text-slate-700' },
            h('strong', null, `${calculateShiftCount()} new shifts`),
            ' will be created and participants will be set to 3 stars on their eligible shifts.'
          )
        ),
        h('div', { className: 'flex gap-3' },
          h('button', {
            onClick: () => setShowConfirmModal(false),
            className: 'flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium'
          }, 'Cancel'),
          h('button', {
            onClick: () => generateShifts(true),
            className: 'flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-2'
          },
            h(Zap, { size: 18 }),
            'Replace & Generate'
          )
        )
      )
    )
  );
};
