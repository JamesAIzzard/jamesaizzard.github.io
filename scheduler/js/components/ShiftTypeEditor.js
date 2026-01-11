import * as React from 'react';
import { Plus, X } from 'lucide-react';

const { useState } = React;
const h = React.createElement;

export const ShiftTypeEditor = ({
  shiftTypes,
  setShiftTypes
}) => {
  const [newShiftType, setNewShiftType] = useState('');

  const addShiftType = () => {
    if (newShiftType.trim()) {
      setShiftTypes([...shiftTypes, { id: Date.now().toString(), name: newShiftType.trim() }]);
      setNewShiftType('');
    }
  };

  const removeShiftType = (id) => {
    setShiftTypes(shiftTypes.filter(s => s.id !== id));
  };

  return h('div', null,
    h('p', { className: 'text-sm text-slate-500 mb-3' }, 'Define the types of shifts (e.g., "ICU", "A&E", "Surgery")'),
    h('div', { className: 'flex gap-2 mb-4' },
      h('input', {
        type: 'text',
        placeholder: 'Shift type name',
        value: newShiftType,
        onChange: (e) => setNewShiftType(e.target.value),
        onKeyDown: (e) => e.key === 'Enter' && addShiftType(),
        className: 'flex-1 px-3 py-2 border rounded-lg'
      }),
      h('button', {
        onClick: addShiftType,
        disabled: !newShiftType.trim(),
        className: 'px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2'
      }, h(Plus, { size: 18 }), 'Add')
    ),
    shiftTypes.length === 0
      ? h('p', { className: 'text-slate-400 text-center py-4' }, 'No shift types defined yet')
      : h('div', { className: 'flex flex-wrap gap-2' },
          shiftTypes.map((st) =>
            h('div', { key: st.id, className: 'flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg group' },
              h('span', { className: 'font-medium' }, st.name),
              h('button', {
                onClick: () => removeShiftType(st.id),
                className: 'p-1 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity'
              }, h(X, { size: 14 }))
            )
          )
        )
  );
};
