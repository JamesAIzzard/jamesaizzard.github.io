import * as React from 'react';
import { Plus, Trash2, Calendar, Clock, Pencil, Check, X } from 'lucide-react';
import { WeekNavigation } from '../ui/WeekNavigation.js';
import { CalendarGrid } from '../ui/CalendarGrid.js';
import { navigateWeek, jumpToShiftsWeek } from '../../utils/dateUtils.js';

const { useState } = React;
const h = React.createElement;

export const ShiftsTab = ({
  shifts,
  setShifts,
  calendarWeekStart,
  setCalendarWeekStart
}) => {
  const [newShift, setNewShift] = useState({ name: '', date: '', time: '', duration: '', pa: '' });
  const [editingShift, setEditingShift] = useState(null);

  // Calculate end time from start time and duration (hours)
  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime || !durationHours) return null;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const addShift = () => {
    if (!newShift.name || !newShift.date || !newShift.time || !newShift.duration) return;
    const duration = parseFloat(newShift.duration) || 0;
    const endTime = calculateEndTime(newShift.time, duration);
    setShifts([...shifts, {
      id: Date.now().toString(),
      ...newShift,
      duration,
      endTime,
      pa: parseFloat(newShift.pa) || 0
    }]);
    setNewShift({ name: '', date: '', time: '', duration: '', pa: '' });
  };

  const startEditShift = (shift) => {
    setEditingShift({ ...shift, pa: shift.pa.toString(), duration: (shift.duration || '').toString() });
  };

  const saveEditShift = () => {
    if (!editingShift.name || !editingShift.date || !editingShift.time || !editingShift.duration) return;
    const duration = parseFloat(editingShift.duration) || 0;
    const endTime = calculateEndTime(editingShift.time, duration);
    setShifts(shifts.map(s => s.id === editingShift.id
      ? { ...editingShift, duration, endTime, pa: parseFloat(editingShift.pa) || 0 }
      : s
    ));
    setEditingShift(null);
  };

  const handleNavigate = (direction) => {
    setCalendarWeekStart(prev => navigateWeek(prev, direction));
  };

  const handleJumpToShifts = () => {
    const weekStart = jumpToShiftsWeek(shifts);
    if (weekStart) setCalendarWeekStart(weekStart);
  };

  const renderShift = (s) => {
    if (editingShift?.id === s.id) {
      return h('div', { key: s.id, className: 'p-2 bg-indigo-100 rounded text-xs space-y-1' },
        h('input', {
          type: 'text',
          value: editingShift.name,
          onChange: (e) => setEditingShift({ ...editingShift, name: e.target.value }),
          className: 'w-full px-1 py-0.5 border rounded text-xs'
        }),
        h('div', { className: 'flex gap-1' },
          h('input', {
            type: 'time',
            value: editingShift.time || '',
            onChange: (e) => setEditingShift({ ...editingShift, time: e.target.value }),
            className: 'flex-1 px-1 py-0.5 border rounded text-xs'
          }),
          h('input', {
            type: 'number',
            step: '0.5',
            min: '0.5',
            value: editingShift.duration,
            onChange: (e) => setEditingShift({ ...editingShift, duration: e.target.value }),
            placeholder: 'Hrs',
            className: 'w-12 px-1 py-0.5 border rounded text-xs'
          })
        ),
        editingShift.time && editingShift.duration && h('div', { className: 'text-slate-500 text-center' },
          '→ ', calculateEndTime(editingShift.time, parseFloat(editingShift.duration))
        ),
        h('input', {
          type: 'number',
          step: '0.5',
          value: editingShift.pa,
          onChange: (e) => setEditingShift({ ...editingShift, pa: e.target.value }),
          placeholder: 'PA',
          className: 'w-full px-1 py-0.5 border rounded text-xs'
        }),
        h('div', { className: 'flex gap-1' },
          h('button', {
            onClick: saveEditShift,
            className: 'flex-1 p-1 text-emerald-600 hover:bg-emerald-50 rounded'
          }, h(Check, { size: 14 })),
          h('button', {
            onClick: () => setEditingShift(null),
            className: 'flex-1 p-1 text-slate-500 hover:bg-slate-100 rounded'
          }, h(X, { size: 14 }))
        )
      );
    }

    return h('div', { key: s.id, className: 'p-2 bg-slate-100 rounded text-xs group hover:bg-slate-200' },
      h('div', { className: 'font-medium text-slate-700 truncate' }, s.name),
      s.time && h('div', { className: 'text-slate-500' },
        s.time, s.endTime ? ` → ${s.endTime}` : ''
      ),
      h('div', { className: 'text-indigo-600 font-medium' }, s.pa, ' PA'),
      h('div', { className: 'flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity' },
        h('button', {
          onClick: () => startEditShift(s),
          className: 'p-1 text-indigo-500 hover:bg-indigo-100 rounded'
        }, h(Pencil, { size: 12 })),
        h('button', {
          onClick: () => setShifts(shifts.filter((x) => x.id !== s.id)),
          className: 'p-1 text-red-500 hover:bg-red-100 rounded'
        }, h(Trash2, { size: 12 }))
      )
    );
  };

  return h('div', null,
    h('h2', { className: 'text-lg font-semibold mb-4' }, 'Manage Shifts'),
    h('div', { className: 'flex flex-wrap gap-3 mb-4' },
      h('input', {
        type: 'text',
        placeholder: 'Shift name',
        value: newShift.name,
        onChange: (e) => setNewShift({ ...newShift, name: e.target.value }),
        className: 'flex-1 min-w-[120px] px-3 py-2 border rounded-lg'
      }),
      h('div', { className: 'relative flex items-center' },
        h(Calendar, { size: 16, className: 'absolute left-3 text-slate-400 pointer-events-none' }),
        h('input', {
          type: 'date',
          value: newShift.date,
          onChange: (e) => setNewShift({ ...newShift, date: e.target.value }),
          className: 'pl-9 pr-3 py-2 border rounded-lg'
        })
      ),
      h('div', { className: 'flex items-center gap-1' },
        h('div', { className: 'relative flex items-center' },
          h(Clock, { size: 16, className: 'absolute left-3 text-slate-400 pointer-events-none' }),
          h('input', {
            type: 'time',
            value: newShift.time,
            onChange: (e) => setNewShift({ ...newShift, time: e.target.value }),
            className: 'pl-9 pr-3 py-2 border rounded-lg w-36'
          })
        ),
        h('input', {
          type: 'number',
          step: '0.5',
          min: '0.5',
          placeholder: 'Hours',
          value: newShift.duration,
          onChange: (e) => setNewShift({ ...newShift, duration: e.target.value }),
          className: 'w-20 px-3 py-2 border rounded-lg'
        }),
        newShift.time && newShift.duration && h('span', { className: 'text-sm text-slate-500 whitespace-nowrap' },
          '→ ', calculateEndTime(newShift.time, parseFloat(newShift.duration))
        )
      ),
      h('input', {
        type: 'number',
        step: '0.5',
        placeholder: 'PA',
        value: newShift.pa,
        onChange: (e) => setNewShift({ ...newShift, pa: e.target.value }),
        className: 'w-20 px-3 py-2 border rounded-lg'
      }),
      h('button', {
        onClick: addShift,
        disabled: !newShift.name || !newShift.date || !newShift.time || !newShift.duration,
        className: 'px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap'
      }, h(Plus, { size: 18 }), ' Add')
    ),
    h(WeekNavigation, {
      weekStart: calendarWeekStart,
      onNavigate: handleNavigate,
      onJumpToShifts: handleJumpToShifts,
      hasShifts: shifts.length > 0
    }),
    h(CalendarGrid, {
      weekStart: calendarWeekStart,
      shifts,
      renderShift
    }),
    shifts.length === 0 && h('p', { className: 'text-slate-500 text-center py-4 mt-4' }, 'No shifts added yet. Add shifts using the form above.')
  );
};
