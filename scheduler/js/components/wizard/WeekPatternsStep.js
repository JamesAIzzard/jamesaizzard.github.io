import * as React from 'react';
import { Trash2, Pencil, Save, RotateCcw } from 'lucide-react';
import { DAY_ORDER, DAY_LABELS, DAY_SHORT_LABELS } from '../../utils/dateUtils.js';

const { useState, useEffect } = React;
const h = React.createElement;

const emptyWeek = { name: '', days: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null } };

/**
 * WeekPatternsStep - Step 3 of the template wizard
 * Create weeks by assigning one day to each day of the week
 */
export const WeekPatternsStep = ({
  days,
  weekPatterns,
  setWeekPatterns
}) => {
  const [editingWeek, setEditingWeek] = useState(null);
  const [week, setWeek] = useState({ ...emptyWeek });

  const isEditing = editingWeek !== null;

  // Load week when editing
  useEffect(() => {
    if (editingWeek) {
      // Normalize old array format to new single-value format
      const normalizedDays = {};
      DAY_ORDER.forEach(day => {
        const val = editingWeek.days[day];
        normalizedDays[day] = Array.isArray(val) ? val[0] || null : val;
      });
      setWeek({
        name: editingWeek.name,
        days: normalizedDays
      });
    } else {
      setWeek({ ...emptyWeek });
    }
  }, [editingWeek]);

  const saveWeek = () => {
    if (!week.name.trim()) return;
    const hasAnyDays = Object.values(week.days).some(dayId => dayId !== null);
    if (!hasAnyDays) return;

    if (isEditing) {
      setWeekPatterns(weekPatterns.map(wp =>
        wp.id === editingWeek.id
          ? { ...wp, name: week.name, days: week.days }
          : wp
      ));
      setEditingWeek(null);
    } else {
      setWeekPatterns([...weekPatterns, { ...week, id: Date.now().toString() }]);
    }
    setWeek({ ...emptyWeek });
  };

  const cancelEdit = () => {
    setEditingWeek(null);
    setWeek({ ...emptyWeek });
  };

  const canSave = week.name.trim() && Object.values(week.days).some(dayId => dayId !== null);

  if (days.length === 0) {
    return h('div', { className: 'text-center py-8' },
      h('div', { className: 'bg-amber-50 border border-amber-200 rounded-lg p-6 inline-block' },
        h('p', { className: 'text-amber-700 font-medium' }, 'No days defined yet'),
        h('p', { className: 'text-amber-600 text-sm mt-1' }, 'Go back to Step 2 to create days first.')
      )
    );
  }

  return h('div', { className: 'space-y-6' },
    h('div', { className: 'bg-purple-50 border border-purple-100 rounded-lg p-4' },
      h('p', { className: 'text-sm text-purple-700' },
        'Create weeks by assigning a day type to each day of the week. ',
        'Select from the days you created in the previous step.'
      )
    ),

    // Create/Edit week form
    h('div', { className: `rounded-lg p-5 ${isEditing ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50'}` },
      // Header showing mode
      isEditing && h('div', { className: 'flex items-center justify-between mb-3' },
        h('span', { className: 'text-sm font-medium text-amber-700' },
          'Editing: ', editingWeek.name
        ),
        h('button', {
          onClick: cancelEdit,
          className: 'text-sm px-2 py-1 text-amber-600 hover:bg-amber-100 rounded flex items-center gap-1'
        }, h(RotateCcw, { size: 14 }), 'Cancel')
      ),

      h('h3', { className: 'font-medium text-slate-700 mb-4' }, isEditing ? 'Edit Week' : 'Create New Week'),
      h('input', {
        type: 'text',
        placeholder: 'Week name (e.g., "Standard Week", "Light Week")',
        value: week.name,
        onChange: (e) => setWeek({ ...week, name: e.target.value }),
        className: 'w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
      }),

      // Day-by-day assignment
      h('div', { className: 'space-y-3' },
        DAY_ORDER.map(day => {
          const selectedDayId = week.days[day];
          return h('div', { key: day, className: 'flex items-center gap-4 py-2 border-b border-slate-200 last:border-0' },
            h('span', { className: 'w-28 text-sm font-medium text-slate-600' }, DAY_LABELS[day]),
            h('select', {
              value: selectedDayId || '',
              onChange: (e) => {
                setWeek({
                  ...week,
                  days: {
                    ...week.days,
                    [day]: e.target.value || null
                  }
                });
              },
              className: `flex-1 px-3 py-2 border rounded-lg bg-white text-slate-600 hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${selectedDayId ? 'border-purple-300 bg-purple-50' : ''}`
            },
              h('option', { value: '' }, '-- No shifts --'),
              days.map(d => h('option', { key: d.id, value: d.id }, d.name))
            )
          );
        })
      ),

      h('button', {
        onClick: saveWeek,
        disabled: !canSave,
        className: `mt-5 w-full px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          canSave
            ? isEditing
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`
      },
        isEditing ? h(Save, { size: 18 }) : null,
        isEditing ? 'Save Changes' : 'Create Week'
      )
    ),

    // Existing weeks
    weekPatterns.length > 0 && h('div', { className: 'space-y-3' },
      h('h3', { className: 'font-medium text-slate-700' }, 'Existing Weeks'),
      weekPatterns.map(wp =>
        h('div', {
          key: wp.id,
          className: `p-4 rounded-lg border transition-colors ${editingWeek?.id === wp.id ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-purple-50 border-purple-100'}`
        },
          h('div', { className: 'flex items-center justify-between mb-3' },
            h('span', { className: `font-semibold ${editingWeek?.id === wp.id ? 'text-amber-800' : 'text-purple-800'}` }, wp.name),
            h('div', { className: 'flex gap-1' },
              h('button', {
                onClick: () => setEditingWeek(editingWeek?.id === wp.id ? null : wp),
                className: `p-2 rounded-lg transition-colors ${editingWeek?.id === wp.id ? 'text-amber-700 bg-amber-200 hover:bg-amber-300' : 'text-purple-600 hover:bg-purple-200'}`,
                title: editingWeek?.id === wp.id ? 'Cancel edit' : 'Edit'
              }, h(Pencil, { size: 16 })),
              h('button', {
                onClick: () => {
                  if (editingWeek?.id === wp.id) setEditingWeek(null);
                  setWeekPatterns(weekPatterns.filter(w => w.id !== wp.id));
                },
                className: 'p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors',
                title: 'Delete'
              }, h(Trash2, { size: 16 }))
            )
          ),
          // Visual week grid
          h('div', { className: 'grid grid-cols-7 gap-2' },
            DAY_ORDER.map(day => {
              // Support both old format (array) and new format (single value)
              const dayValue = wp.days[day];
              const dayId = Array.isArray(dayValue) ? dayValue[0] : dayValue;
              const d = dayId ? days.find(x => x.id === dayId) : null;
              return h('div', { key: day, className: 'text-center' },
                h('div', { className: `font-medium text-sm mb-1 pb-1 border-b ${editingWeek?.id === wp.id ? 'text-amber-600 border-amber-200' : 'text-purple-600 border-purple-200'}` }, DAY_SHORT_LABELS[day]),
                d
                  ? h('div', {
                      className: `text-xs rounded px-1 py-0.5 truncate ${editingWeek?.id === wp.id ? 'text-amber-700 bg-amber-100' : 'text-purple-700 bg-purple-100'}`,
                      title: d.name
                    }, d.name)
                  : h('div', { className: 'text-slate-400 text-xs py-2' }, '-')
              );
            })
          )
        )
      )
    )
  );
};
