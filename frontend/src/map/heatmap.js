export function createHeatmapLayer() {
  return {
    id: 'visits-heatmap',
    type: 'heatmap',
    source: 'places',
    maxzoom: 8,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'visits'], 0, 0, 8, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.4],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 12, 8, 32],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(44,64,114,0)',
        0.3,
        'rgba(85,113,255,0.6)',
        0.6,
        'rgba(134,92,255,0.8)',
        1,
        'rgba(255,132,110,0.95)'
      ]
    }
  };
}
