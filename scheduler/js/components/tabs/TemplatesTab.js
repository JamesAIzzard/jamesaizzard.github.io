import * as React from 'react';
import { WizardStep } from '../wizard/WizardStep.js';
import { ShiftTypesStep } from '../wizard/ShiftTypesStep.js';
import { DaysStep } from '../wizard/DaysStep.js';
import { WeekPatternsStep } from '../wizard/WeekPatternsStep.js';
import { GenerateShiftsStep } from '../wizard/GenerateShiftsStep.js';

const { useState } = React;
const h = React.createElement;

// Step definitions
const WIZARD_STEPS = [
  { id: 'shiftTypes', shortLabel: 'Shift Types', title: 'Define Shift Types', description: 'Create the categories of shifts you need to schedule (e.g., "Day Shift", "Night Shift", "On Call").' },
  { id: 'days', shortLabel: 'Days', title: 'Create Days', description: 'Create named days and add shifts to them. For example, create a "Weekday" with ICU, A&E, and Surgery shifts.' },
  { id: 'weeks', shortLabel: 'Weeks', title: 'Build Weeks', description: 'Assign a day type to each day of the week to create complete week templates.' },
  { id: 'generate', shortLabel: 'Generate', title: 'Generate Rota', description: 'Use your weeks to generate actual shifts for your schedule.' }
];

export const TemplatesTab = ({
  shiftTypes,
  setShiftTypes,
  days,
  setDays,
  weekPatterns,
  setWeekPatterns,
  shifts,
  setShifts,
  participants,
  preferences,
  setPreferences,
  jumpAllCalendarsToShifts,
  setTab
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Determine if user can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1: return shiftTypes.length > 0;
      case 2: return days.length > 0;
      case 3: return weekPatterns.length > 0;
      case 4: return true; // Generate step handles its own validation
      default: return false;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  // Get next button label based on current step state
  const getNextLabel = () => {
    if (currentStep === WIZARD_STEPS.length) {
      return 'Done';
    }
    if (!canProceed()) {
      switch (currentStep) {
        case 1: return 'Add shift types to continue';
        case 2: return 'Add days to continue';
        case 3: return 'Add weeks to continue';
        default: return 'Next';
      }
    }
    return 'Next';
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return h(ShiftTypesStep, { shiftTypes, setShiftTypes });
      case 2:
        return h(DaysStep, { shiftTypes, days, setDays });
      case 3:
        return h(WeekPatternsStep, { days, weekPatterns, setWeekPatterns });
      case 4:
        return h(GenerateShiftsStep, {
          weekPatterns,
          days,
          shifts,
          setShifts,
          participants,
          preferences,
          setPreferences,
          jumpAllCalendarsToShifts,
          setTab
        });
      default:
        return null;
    }
  };

  const currentStepData = WIZARD_STEPS[currentStep - 1];

  return h('div', { className: 'space-y-6' },
    h('div', { className: 'text-center mb-2' },
      h('h2', { className: 'text-lg font-semibold text-slate-800' }, 'Rota Builder'),
      h('p', { className: 'text-slate-500 text-sm' }, 'Generate your rota step by step')
    ),

    h(WizardStep, {
      stepNumber: currentStep,
      totalSteps: WIZARD_STEPS.length,
      title: currentStepData.title,
      description: currentStepData.description,
      onPrevious: handlePrevious,
      onNext: handleNext,
      canProceed: canProceed(),
      nextLabel: getNextLabel(),
      steps: WIZARD_STEPS,
      onStepClick: handleStepClick
    },
      renderStepContent()
    )
  );
};
