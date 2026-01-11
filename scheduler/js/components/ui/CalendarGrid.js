import * as React from 'react';
import { getWeekDates, formatDateKey, groupShiftsByDate, DAY_NAMES } from '../../utils/dateUtils.js';

const h = React.createElement;

export const CalendarGrid = ({ weekStart, shifts, renderShift }) => {
  const groupedShifts = groupShiftsByDate(shifts);

  return h('div', { className: 'overflow-x-auto' },
    h('div', { className: 'grid grid-cols-7 gap-2 min-w-[700px]' },
      getWeekDates(weekStart).map((date) => {
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
          h('div', { className: 'space-y-1' },
            dayShifts.map((shift) => renderShift(shift))
          )
        );
      })
    )
  );
};
