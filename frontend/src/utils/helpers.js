export const debounce = (fn, wait = 200) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

export const groupByDay = (places) => {
  return places.reduce((acc, place) => {
    const day = new Date(place.createdAt).toISOString().split('T')[0];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(place);
    return acc;
  }, {});
};

export const formatDateLabel = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
