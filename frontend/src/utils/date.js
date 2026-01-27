export function filterPlacesByDate(places, from, to) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  return places.filter((place) => {
    const createdAt = new Date(place.createdAt);
    if (fromDate && createdAt < fromDate) return false;
    if (toDate && createdAt > toDate) return false;
    return true;
  });
}

export function groupPlacesByDay(places) {
  return places.reduce((groups, place) => {
    const dayKey = new Date(place.createdAt).toISOString().slice(0, 10);
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(place);
    return groups;
  }, {});
}
