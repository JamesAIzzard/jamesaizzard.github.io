import * as React from 'react';
import { ShiftTypeEditor } from '../ShiftTypeEditor.js';

const h = React.createElement;

/**
 * ShiftTypesStep - Step 1 of the template wizard
 * Define the types of shifts available (e.g., "ICU", "A&E", "Surgery")
 */
export const ShiftTypesStep = ({
  shiftTypes,
  setShiftTypes
}) => {
  return h('div', { className: 'space-y-4' },
    h('div', { className: 'bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4' },
      h('p', { className: 'text-sm text-indigo-700' },
        'Shift types are the building blocks of your schedule. Define categories like "Day Shift", "Night Shift", "On Call", etc. ',
        'These will be combined with times in the next step.'
      )
    ),

    h(ShiftTypeEditor, {
      shiftTypes,
      setShiftTypes
    })
  );
};
