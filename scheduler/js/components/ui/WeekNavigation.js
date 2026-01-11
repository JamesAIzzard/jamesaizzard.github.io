import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '../../utils/dateUtils.js';

const h = React.createElement;

export const WeekNavigation = ({ weekStart, onNavigate, onJumpToShifts, hasShifts = false }) => {
  return h('div', { className: 'flex items-center justify-between mb-4' },
    h('button', {
      onClick: () => onNavigate(-1),
      className: 'p-2 text-slate-600 hover:bg-slate-100 rounded-lg'
    }, h(ChevronLeft, { size: 20 })),
    h('div', { className: 'flex items-center gap-2' },
      h('span', { className: 'font-medium text-slate-700' }, formatWeekRange(weekStart)),
      hasShifts && onJumpToShifts && h('button', {
        onClick: onJumpToShifts,
        className: 'text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200'
      }, 'Go to shifts')
    ),
    h('button', {
      onClick: () => onNavigate(1),
      className: 'p-2 text-slate-600 hover:bg-slate-100 rounded-lg'
    }, h(ChevronRight, { size: 20 }))
  );
};
