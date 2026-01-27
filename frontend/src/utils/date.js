import { format, parseISO } from 'date-fns';

export function getPlaceDate(place) {
  if (place.visitDate) {
    return parseISO(`${place.visitDate}T00:00:00Z`);
  }
  return parseISO(place.createdAt);
}

export function groupPlacesByDay(places) {
  return places.reduce((acc, place) => {
    const dayKey = format(getPlaceDate(place), 'yyyy-MM-dd');
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
  const date = getPlaceDate(place);
  if (from && date < from) {
    return false;
  }
  if (to && date > to) {
    return false;
  }
  return true;
}

export function formatVisitDate(visitDate, createdAt) {
  if (visitDate) {
    return format(parseISO(`${visitDate}T00:00:00Z`), 'dd MMM yyyy');
  }
  return format(parseISO(createdAt), 'dd MMM yyyy');
}
