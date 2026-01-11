import * as React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const h = React.createElement;

/**
 * WizardStep - A wrapper component for wizard steps with navigation
 *
 * @param {Object} props
 * @param {number} props.stepNumber - Current step number (1-based)
 * @param {number} props.totalSteps - Total number of steps
 * @param {string} props.title - Step title
 * @param {string} props.description - Step description
 * @param {React.ReactNode} props.children - Step content
 * @param {Function} props.onPrevious - Callback for previous button
 * @param {Function} props.onNext - Callback for next button
 * @param {boolean} props.canProceed - Whether the user can proceed to next step
 * @param {string} props.nextLabel - Custom label for next button
 * @param {Array} props.steps - Array of step metadata for progress indicator
 * @param {Function} props.onStepClick - Callback when clicking a step indicator
 */
export const WizardStep = ({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onPrevious,
  onNext,
  canProceed = true,
  nextLabel,
  steps = [],
  onStepClick
}) => {
  const isFirstStep = stepNumber === 1;
  const isLastStep = stepNumber === totalSteps;

  return h('div', { className: 'space-y-6' },
    // Progress indicator - circles with labels underneath
    h('div', { className: 'flex items-start justify-center' },
      steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCurrent = stepNum === stepNumber;
        const isCompleted = stepNum < stepNumber;
        const isClickable = stepNum !== stepNumber;
        const isLast = idx === steps.length - 1;

        return h('div', { key: step.id, className: 'flex items-start' },
          // Step column (circle + label) - fixed width for consistent alignment
          h('div', { className: 'flex flex-col items-center', style: { width: '72px' } },
            // Step circle
            h('button', {
              onClick: () => isClickable && onStepClick && onStepClick(stepNum),
              disabled: !isClickable,
              className: `
                flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all flex-shrink-0
                ${isCurrent
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : isCompleted
                    ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-500 cursor-pointer hover:bg-slate-300'}
                ${!isClickable ? 'cursor-default' : ''}
              `
            },
              isCompleted ? h(Check, { size: 18 }) : stepNum
            ),
            // Label directly under circle
            h('span', {
              className: `text-xs mt-2 text-center ${isCurrent ? 'text-indigo-600 font-medium' : 'text-slate-400'}`
            }, step.shortLabel)
          ),
          // Connector line (not after last step) - vertically centered with circles
          !isLast && h('div', {
            className: `w-8 h-1 rounded flex-shrink-0 ${idx < stepNumber - 1 ? 'bg-emerald-500' : 'bg-slate-200'}`,
            style: { marginTop: '18px' }
          })
        );
      })
    ),

    // Main content card
    h('div', { className: 'border rounded-lg overflow-hidden bg-white shadow-sm' },
      // Header
      h('div', { className: 'p-6 bg-gradient-to-r from-slate-50 to-white border-b' },
        h('div', { className: 'flex items-center gap-3 mb-2' },
          h('span', { className: 'flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold' }, stepNumber),
          h('h2', { className: 'text-xl font-semibold text-slate-800' }, title)
        ),
        description && h('p', { className: 'text-slate-500 ml-11' }, description)
      ),

      // Content
      h('div', { className: 'p-6' }, children),

      // Navigation footer
      h('div', { className: 'px-6 py-4 bg-slate-50 border-t flex items-center justify-between' },
        // Previous button
        isFirstStep
          ? h('div') // Empty div for spacing
          : h('button', {
              onClick: onPrevious,
              className: 'flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors'
            },
            h(ChevronLeft, { size: 20 }),
            'Previous'
          ),

        // Next button
        h('button', {
          onClick: onNext,
          disabled: !canProceed,
          className: `
            flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
            ${canProceed
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
          `
        },
          nextLabel || (isLastStep ? 'Finish' : 'Next'),
          !isLastStep && h(ChevronRight, { size: 20 })
        )
      )
    )
  );
};
