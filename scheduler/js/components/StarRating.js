import * as React from 'react';
import { Star } from 'lucide-react';

const h = React.createElement;

export const StarRating = ({ value, onChange, size = 18 }) => {
  return h('div', { className: 'flex gap-0.5' },
    [1, 2, 3, 4, 5].map((star) =>
      h('button', {
        key: star,
        onClick: () => onChange(value === star ? 0 : star),
        className: 'p-0.5 hover:scale-110 transition-transform'
      },
        h(Star, {
          size,
          className: star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
        })
      )
    )
  );
};

export const StarDisplay = ({ value, size = 12 }) => {
  return h('div', { className: 'flex gap-0.5' },
    [1, 2, 3, 4, 5].map((star) =>
      h(Star, {
        key: star,
        size,
        className: star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
      })
    )
  );
};
