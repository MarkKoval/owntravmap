export function buildHeatmapLayer(sourceId) {
  return {
    id: 'heatmap',
    type: 'heatmap',
    source: sourceId,
    maxzoom: 9,
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'visitsCount'],
        0,
        0,
        12,
        1
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4,
        0.6,
        9,
        1.2
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(44, 98, 255, 0)',
        0.3,
        'rgba(68, 200, 255, 0.6)',
        0.6,
        'rgba(248, 158, 58, 0.7)',
        0.9,
        'rgba(248, 85, 85, 0.8)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4,
        18,
        9,
        42
      ],
      'heatmap-opacity': 0.65
    }
  };
}
