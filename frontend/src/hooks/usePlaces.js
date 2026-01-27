import { useCallback, useEffect, useMemo, useState } from "react";
import { filterPlacesByRange } from "../utils/date.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function usePlaces(dateRange) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateRange?.from) params.set("from", dateRange.from);
    if (dateRange?.to) params.set("to", dateRange.to);

    const response = await fetch(`${API_URL}/api/places?${params.toString()}`);
    const data = await response.json();
    setPlaces(data);
    setLoading(false);
  }, [dateRange]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const filteredPlaces = useMemo(
    () => filterPlacesByRange(places, dateRange),
    [places, dateRange]
  );

  return { places, filteredPlaces, setPlaces, refresh: fetchPlaces, loading };
}
