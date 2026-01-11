export const generateExampleData = () => {
  // Create shift types (just the department/role, no time component)
  const shiftTypes = [
    { id: 'st-icu', name: 'ICU' },
    { id: 'st-ae', name: 'A&E' },
    { id: 'st-surg', name: 'Surgery' },
    { id: 'st-twilight', name: 'Twilight' },
    { id: 'st-oncall', name: 'On Call' },
  ];

  // Create days with shifts directly embedded
  const days = [
    {
      id: 'day-weekday',
      name: 'Weekday',
      shifts: [
        // ICU shifts
        { id: 'dps-1', shiftTypeId: 'st-icu', shiftTypeName: 'ICU', time: '07:00', duration: 12, endTime: '19:00', pa: 2 },
        { id: 'dps-2', shiftTypeId: 'st-icu', shiftTypeName: 'ICU', time: '19:00', duration: 12, endTime: '07:00', pa: 2 },
        // A&E shifts
        { id: 'dps-3', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '08:00', duration: 6, endTime: '14:00', pa: 1.5 },
        { id: 'dps-4', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '14:00', duration: 6, endTime: '20:00', pa: 1.5 },
        { id: 'dps-5', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '20:00', duration: 6, endTime: '02:00', pa: 1.5 },
        // Surgery shifts
        { id: 'dps-6', shiftTypeId: 'st-surg', shiftTypeName: 'Surgery', time: '08:00', duration: 5, endTime: '13:00', pa: 2 },
        { id: 'dps-7', shiftTypeId: 'st-surg', shiftTypeName: 'Surgery', time: '13:00', duration: 5, endTime: '18:00', pa: 2 },
        // Twilight shifts
        { id: 'dps-8', shiftTypeId: 'st-twilight', shiftTypeName: 'Twilight', time: '17:00', duration: 4, endTime: '21:00', pa: 1 },
        { id: 'dps-9', shiftTypeId: 'st-twilight', shiftTypeName: 'Twilight', time: '21:00', duration: 4, endTime: '01:00', pa: 1 },
        // On Call
        { id: 'dps-15', shiftTypeId: 'st-oncall', shiftTypeName: 'On Call', time: '20:00', duration: 12, endTime: '08:00', pa: 1.5 },
      ]
    },
    {
      id: 'day-weekend',
      name: 'Weekend',
      shifts: [
        // ICU shifts
        { id: 'dps-10', shiftTypeId: 'st-icu', shiftTypeName: 'ICU', time: '07:00', duration: 12, endTime: '19:00', pa: 2 },
        { id: 'dps-11', shiftTypeId: 'st-icu', shiftTypeName: 'ICU', time: '19:00', duration: 12, endTime: '07:00', pa: 2 },
        // A&E shifts
        { id: 'dps-12', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '08:00', duration: 6, endTime: '14:00', pa: 1.5 },
        { id: 'dps-13', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '14:00', duration: 6, endTime: '20:00', pa: 1.5 },
        { id: 'dps-14', shiftTypeId: 'st-ae', shiftTypeName: 'A&E', time: '20:00', duration: 6, endTime: '02:00', pa: 1.5 },
        // On Call
        { id: 'dps-16', shiftTypeId: 'st-oncall', shiftTypeName: 'On Call', time: '20:00', duration: 12, endTime: '08:00', pa: 1.5 },
      ]
    }
  ];

  // Create week pattern (references days directly)
  const weekPatterns = [
    {
      id: 'wp-standard',
      name: 'Standard Hospital Week',
      days: {
        mon: ['day-weekday'],
        tue: ['day-weekday'],
        wed: ['day-weekday'],
        thu: ['day-weekday'],
        fri: ['day-weekday'],
        sat: ['day-weekend'],
        sun: ['day-weekend'],
      }
    }
  ];

  // No pre-generated shifts - user must use Rota Builder to generate them
  const shifts = [];

  // Base PA quota for participants (calculated for a typical 2-week rota)
  const baseQuota = 25;

  // Doctors with specific shift type capabilities
  const participants = [
    { id: 'd1', name: 'Dr Sarah Mitchell', paQuota: baseQuota + 4, shiftTypeIds: ['st-icu', 'st-ae'] },
    { id: 'd2', name: 'Dr James Chen', paQuota: baseQuota + 2, shiftTypeIds: ['st-surg', 'st-icu'] },
    { id: 'd3', name: 'Dr Emily Watson', paQuota: baseQuota + 3, shiftTypeIds: ['st-twilight', 'st-ae'] },
    { id: 'd4', name: 'Dr Raj Patel', paQuota: baseQuota, shiftTypeIds: ['st-ae', 'st-oncall'] },
    { id: 'd5', name: "Dr Lucy O'Brien", paQuota: baseQuota + 4, shiftTypeIds: ['st-icu', 'st-surg'] },
    { id: 'd6', name: 'Dr Michael Brown', paQuota: baseQuota + 2, shiftTypeIds: ['st-ae', 'st-surg', 'st-oncall'] },
    { id: 'd7', name: 'Dr Aisha Khan', paQuota: baseQuota + 3, shiftTypeIds: ['st-twilight', 'st-oncall'] },
    { id: 'd8', name: 'Dr David Wilson', paQuota: baseQuota, shiftTypeIds: ['st-surg', 'st-ae'] },
    { id: 'd9', name: 'Dr Sophie Taylor', paQuota: baseQuota + 4, shiftTypeIds: ['st-icu', 'st-ae', 'st-oncall'] },
    { id: 'd10', name: 'Dr Tom Anderson', paQuota: baseQuota + 2, shiftTypeIds: ['st-twilight', 'st-icu', 'st-surg'] },
  ];

  // No preferences yet - will be generated when shifts are created
  const preferences = {};

  return {
    shiftTypes,
    days,
    weekPatterns,
    shifts,
    participants,
    preferences
  };
};
