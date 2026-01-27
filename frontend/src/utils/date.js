import { format, parseISO } from 'date-fns';

export function groupPlacesByDay(places) {
  return places.reduce((acc, place) => {
    const dayKey = format(parseISO(place.createdAt), 'yyyy-MM-dd');
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(place);
    return acc;
  }, {});
}

export function formatDayLabel(dayKey) {
  return format(parseISO(`${dayKey}T00:00:00Z`), 'MMM d, yyyy');
}

export function isWithinRange(place, from, to) {
  const date = new Date(place.createdAt);
  if (from && date < from) {
    return false;
  }
  if (to && date > to) {
    return false;
  }
  return true;
}
