import * as React from 'react';
import { Trash2, Copy, Pencil, Plus, X, Save, RotateCcw, Clock } from 'lucide-react';

const { useState, useEffect } = React;
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

// Format duration for display
const formatDuration = (hours) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours % 1 === 0) return `${hours}h`;
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
};

const emptyDay = { name: '', shifts: [] };

/**
 * DaysStep - Step 2 of the template wizard
 * Create named days and add shifts directly to them
 */
export const DaysStep = ({
  shiftTypes,
  days,
  setDays
}) => {
  const [editingDay, setEditingDay] = useState(null);
  const [day, setDay] = useState({ ...emptyDay });
  const [shiftForm, setShiftForm] = useState({ shiftTypeId: '', time: '', duration: '', pa: '' });

  const isEditing = editingDay !== null;

  // Load day when editing
  useEffect(() => {
    if (editingDay) {
      setDay({
        name: editingDay.name,
        shifts: [...editingDay.shifts]
      });
    } else {
      setDay({ ...emptyDay });
    }
  }, [editingDay]);

  const addShiftToDay = () => {
    if (shiftForm.shiftTypeId && shiftForm.time && shiftForm.duration) {
      const shiftType = shiftTypes.find(st => st.id === shiftForm.shiftTypeId);
      const durationHours = parseFloat(shiftForm.duration) || 0;
      const endTime = calculateEndTime(shiftForm.time, durationHours);
      setDay({
        ...day,
        shifts: [...day.shifts, {
          id: Date.now().toString(),
          shiftTypeId: shiftForm.shiftTypeId,
          shiftTypeName: shiftType.name,
          time: shiftForm.time,
          duration: durationHours,
          endTime: endTime,
          pa: parseFloat(shiftForm.pa) || 0
        }]
      });
      setShiftForm({ shiftTypeId: '', time: '', duration: '', pa: '' });
    }
  };

  const removeShiftFromDay = (shiftId) => {
    setDay({
      ...day,
      shifts: day.shifts.filter(s => s.id !== shiftId)
    });
  };

  const saveDay = () => {
    if (!day.name.trim() || day.shifts.length === 0) return;

    if (isEditing) {
      setDays(days.map(d =>
        d.id === editingDay.id
          ? { ...d, name: day.name, shifts: day.shifts }
          : d
      ));
      setEditingDay(null);
    } else {
      setDays([...days, {
        id: Date.now().toString(),
        name: day.name,
        shifts: day.shifts
      }]);
    }
    setDay({ ...emptyDay });
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setDay({ ...emptyDay });
  };

  if (shiftTypes.length === 0) {
    return h('div', { className: 'text-center py-8' },
      h('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block' },
        h('p', { className: 'text-amber-700 font-medium' }, 'No shift types defined yet'),
        h('p', { className: 'text-amber-600 text-sm mt-1' }, 'Go back to Step 1 to create shift types first.')
      )
    );
  }

  return h('div', { className: 'space-y-4' },
    // Info box
    h('div', { className: 'bg-sky-50 border border-sky-100 rounded-lg p-4 mb-4' },
      h('p', { className: 'text-sm text-sky-700' },
        'Create named days (like "Weekday" or "Weekend") and add shifts to them. ',
        'Each shift has a type, start time, duration, and PA value.'
      )
    ),

    // Editor for creating/editing days
    h('div', { className: `p-4 rounded-lg ${isEditing ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50'}` },
      // Header showing mode
      isEditing && h('div', { className: 'flex items-center justify-between mb-3' },
        h('span', { className: 'text-sm font-medium text-amber-700' },
          'Editing: ', editingDay.name
        ),
        h('button', {
          onClick: cancelEdit,
          className: 'text-sm px-2 py-1 text-amber-600 hover:bg-amber-100 rounded flex items-center gap-1'
        }, h(RotateCcw, { size: 14 }), 'Cancel')
      ),

      // Day name input
      h('div', { className: 'flex flex-wrap gap-2 mb-3' },
        h('input', {
          type: 'text',
          placeholder: 'Day name (e.g., "Weekday", "Weekend")',
          value: day.name,
          onChange: (e) => setDay({ ...day, name: e.target.value }),
          className: 'flex-1 min-w-[200px] px-3 py-2 border rounded-lg'
        })
      ),

      // Add shift form
      h('div', { className: 'mb-3' },
        h('p', { className: 'text-sm font-medium text-slate-600 mb-2' }, 'Add shifts to this day:'),
        h('div', { className: 'flex flex-wrap gap-2 items-end' },
          h('select', {
            value: shiftForm.shiftTypeId,
            onChange: (e) => setShiftForm({ ...shiftForm, shiftTypeId: e.target.value }),
            className: 'px-3 py-2 border rounded-lg bg-white'
          },
            h('option', { value: '' }, 'Select shift type'),
            shiftTypes.map(st => h('option', { key: st.id, value: st.id }, st.name))
          ),
          h('div', { className: 'flex items-center gap-1' },
            h('div', { className: 'relative flex items-center' },
              h(Clock, { size: 16, className: 'absolute left-3 text-slate-400 pointer-events-none' }),
              h('input', {
                type: 'time',
                value: shiftForm.time,
                onChange: (e) => setShiftForm({ ...shiftForm, time: e.target.value }),
                className: 'pl-9 pr-3 py-2 border rounded-lg w-36'
              })
            ),
            h('input', {
              type: 'number',
              step: '0.5',
              min: '0.5',
              placeholder: 'Hours',
              value: shiftForm.duration,
              onChange: (e) => setShiftForm({ ...shiftForm, duration: e.target.value }),
              className: 'w-20 px-3 py-2 border rounded-lg'
            }),
            shiftForm.time && shiftForm.duration && h('span', { className: 'text-sm text-slate-500 whitespace-nowrap' },
              '→ ', calculateEndTime(shiftForm.time, parseFloat(shiftForm.duration))
            )
          ),
          h('input', {
            type: 'number',
            step: '0.5',
            placeholder: 'PA',
            value: shiftForm.pa,
            onChange: (e) => setShiftForm({ ...shiftForm, pa: e.target.value }),
            className: 'w-20 px-3 py-2 border rounded-lg'
          }),
          h('button', {
            onClick: addShiftToDay,
            disabled: !shiftForm.shiftTypeId || !shiftForm.time || !shiftForm.duration,
            className: 'px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
          }, h(Plus, { size: 18 }))
        )
      ),

      // Current shifts in day
      day.shifts.length > 0 && h('div', { className: 'mb-3 space-y-1' },
        day.shifts.sort((a, b) => a.time.localeCompare(b.time)).map(shift =>
          h('div', { key: shift.id, className: 'flex items-center justify-between px-3 py-2 bg-white rounded border' },
            h('div', { className: 'flex items-center gap-3' },
              h('span', { className: 'font-medium text-slate-700' }, shift.shiftTypeName),
              h('span', { className: 'text-slate-500' },
                shift.time, ' → ', shift.endTime || calculateEndTime(shift.time, shift.duration),
                ' (', formatDuration(shift.duration), ')'
              ),
              h('span', { className: 'text-sky-600 font-medium' }, shift.pa, ' PA')
            ),
            h('button', {
              onClick: () => removeShiftFromDay(shift.id),
              className: 'p-1 text-slate-400 hover:text-red-500'
            }, h(X, { size: 16 }))
          )
        )
      ),

      // Save/Create button
      h('button', {
        onClick: saveDay,
        disabled: !day.name.trim() || day.shifts.length === 0,
        className: `w-full px-4 py-2 text-white rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          isEditing
            ? 'bg-amber-600 hover:bg-amber-700'
            : 'bg-sky-600 hover:bg-sky-700'
        }`
      },
        isEditing ? h(Save, { size: 18 }) : null,
        isEditing ? 'Save Changes' : 'Create Day'
      )
    ),

    // List of existing days
    days.length > 0 && h('div', { className: 'space-y-3 mt-6 pt-4 border-t' },
      h('p', { className: 'text-sm font-medium text-slate-600' }, 'Existing Days:'),
      days.map(d =>
        h('div', {
          key: d.id,
          className: `p-4 rounded-lg transition-colors ${editingDay?.id === d.id ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-sky-50 hover:bg-sky-100'}`
        },
          h('div', { className: 'flex items-center justify-between mb-3' },
            h('span', { className: `font-semibold ${editingDay?.id === d.id ? 'text-amber-800' : 'text-sky-800'}` }, d.name),
            h('div', { className: 'flex gap-1' },
              h('button', {
                onClick: () => setEditingDay(editingDay?.id === d.id ? null : d),
                className: `p-2 rounded-lg transition-colors ${editingDay?.id === d.id ? 'text-amber-700 bg-amber-200 hover:bg-amber-300' : 'text-sky-600 hover:bg-sky-200'}`,
                title: editingDay?.id === d.id ? 'Cancel edit' : 'Edit'
              }, h(Pencil, { size: 16 })),
              h('button', {
                onClick: () => {
                  const copy = { ...d, id: Date.now().toString(), name: d.name + ' (copy)', shifts: d.shifts.map(s => ({ ...s, id: Date.now().toString() + Math.random() })) };
                  setDays([...days, copy]);
                },
                className: 'p-2 text-sky-600 hover:bg-sky-200 rounded-lg transition-colors',
                title: 'Duplicate'
              }, h(Copy, { size: 16 })),
              h('button', {
                onClick: () => {
                  if (editingDay?.id === d.id) setEditingDay(null);
                  setDays(days.filter(x => x.id !== d.id));
                },
                className: 'p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors',
                title: 'Delete'
              }, h(Trash2, { size: 16 }))
            )
          ),
          h('div', { className: 'flex flex-wrap gap-2' },
            d.shifts.length === 0
              ? h('span', { className: 'text-slate-400 text-sm italic' }, 'No shifts defined')
              : d.shifts.sort((a, b) => a.time.localeCompare(b.time)).map(shift =>
                  h('span', {
                    key: shift.id,
                    className: `text-xs px-3 py-1.5 rounded-lg ${editingDay?.id === d.id ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-white text-sky-700 border border-sky-200'}`
                  },
                    h('span', { className: 'font-medium' }, shift.shiftTypeName),
                    ' ',
                    shift.time,
                    shift.endTime && ` → ${shift.endTime}`,
                    h('span', { className: 'text-slate-500' }, ` (${shift.pa} PA)`)
                  )
                )
          )
        )
      )
    )
  );
};
