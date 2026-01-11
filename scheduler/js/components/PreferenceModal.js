import * as React from 'react';
import { Star } from 'lucide-react';

const { useState, useEffect, useRef } = React;
const h = React.createElement;

export const PreferenceModal = ({ shift, participant, preference, onSave, onClose }) => {
  const [value, setValue] = useState(preference);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const getPreferenceText = (val) => {
    if (val === 0) return 'Cannot do this shift';
    if (val === 1) return 'Would rather not';
    if (val === 2) return 'If needed';
    if (val === 3) return 'Happy to do';
    if (val === 4) return 'Prefer this shift';
    return 'Would love to do this!';
  };

  return h('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' },
    h('div', { ref: modalRef, className: 'bg-white rounded-xl shadow-xl max-w-sm w-full p-6' },
      h('h3', { className: 'text-lg font-semibold text-slate-800 mb-1' }, shift.name),
      h('div', { className: 'text-sm text-slate-500 mb-4' },
        shift.date,
        shift.time && ` • ${shift.time}`,
        shift.endTime && ` → ${shift.endTime}`,
        ` • ${shift.pa} PA`
      ),
      h('div', { className: 'mb-4' },
        h('label', { className: 'block text-sm font-medium text-slate-700 mb-2' },
          `${participant.name}'s preference:`
        ),
        h('div', { className: 'flex justify-center gap-2 py-3' },
          [1, 2, 3, 4, 5].map((star) =>
            h('button', {
              key: star,
              onClick: () => setValue(value === star ? 0 : star),
              className: 'p-1 hover:scale-110 transition-transform'
            },
              h(Star, {
                size: 32,
                className: star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              })
            )
          )
        ),
        h('p', { className: 'text-center text-sm text-slate-500 mt-2' }, getPreferenceText(value))
      ),
      h('div', { className: 'flex gap-3' },
        h('button', {
          onClick: onClose,
          className: 'flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium'
        }, 'Cancel'),
        h('button', {
          onClick: handleSave,
          className: 'flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium'
        }, 'Save')
      )
    )
  );
};
