export const buildMapStyle = () => {
  const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
  const satelliteStyle = import.meta.env.VITE_MAP_STYLE;
  const labelsStyle = import.meta.env.VITE_LABELS_STYLE;

  if (maptilerKey && satelliteStyle) {
    return satelliteStyle;
  }

  return {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution:
          'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS'
      },
      labels: {
        type: 'raster',
        tiles: ['https://{a,b,c}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © CARTO'
      }
    },
    layers: [
      { id: 'satellite', type: 'raster', source: 'esri' },
      { id: 'labels', type: 'raster', source: 'labels' }
    ]
  };
};

export const ukraineBounds = [
  [22.1, 44.3],
  [40.2, 52.4]
];

export const buildMaskFeature = (ukraineCoordinates) => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90]
      ],
      ...ukraineCoordinates
    ]
  }
});
