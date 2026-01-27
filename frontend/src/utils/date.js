export function filterPlacesByRange(places, range) {
  if (!range?.from && !range?.to) {
    return places;
  }
  return places.filter((place) => {
    const time = new Date(place.createdAt).getTime();
    if (range.from && time < new Date(range.from).getTime()) {
      return false;
    }
    if (range.to && time > new Date(range.to).getTime()) {
      return false;
    }
    return true;
  });
}

export function groupPlacesByDay(places) {
  return places.reduce((acc, place) => {
    const day = new Date(place.createdAt).toISOString().slice(0, 10);
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(place);
    return acc;
  }, {});
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
