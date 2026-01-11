export const getWeekDates = (weekStart) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const groupShiftsByDate = (shifts) => {
  const grouped = {};
  shifts.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  });
  return grouped;
};

export const formatWeekRange = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const options = { day: 'numeric', month: 'short' };
  const startStr = weekStart.toLocaleDateString('en-GB', options);
  const endStr = weekEnd.toLocaleDateString('en-GB', { ...options, year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

export const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const navigateWeek = (currentStart, direction) => {
  const newDate = new Date(currentStart);
  newDate.setDate(currentStart.getDate() + (direction * 7));
  return newDate;
};

export const jumpToShiftsWeek = (shifts) => {
  if (shifts.length === 0) return null;
  const sortedDates = [...shifts].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sortedDates[0].date);
  return getMonday(firstDate);
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
export const DAY_SHORT_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };
