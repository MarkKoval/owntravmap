import maplibregl from 'maplibre-gl';
import { buildHeatmapLayer } from './heatmapLayer';
import { renderMetaballs } from './metaballs';
import { openPhotoSphere } from './clusterSphere';

const UA_CENTER = [31.2, 49.0];

export async function createMap(containerId) {
  const map = new maplibregl.Map({
    container: containerId,
    style: 'https://demotiles.maplibre.org/style.json',
    center: UA_CENTER,
    zoom: 5
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

  map.on('load', () => {
    map.addSource('places', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterRadius: 40
    });

    map.addLayer(buildHeatmapLayer('places'));

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'places',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#6ee7ff',
        'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 20, 28],
        'circle-opacity': 0.7
      }
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'places',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12
      },
      paint: {
        'text-color': '#04111e'
      }
    });

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'places',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#f59e0b',
        'circle-radius': 6,
        'circle-opacity': 0.8
      }
    });
  });

  map.on('click', 'clusters', async (event) => {
    const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    const source = map.getSource('places');
    source.getClusterLeaves(clusterId, 50, 0, (err, leafFeatures) => {
      if (err) return;
      const photos = leafFeatures.flatMap((feature) => feature.properties.photos || []);
      openPhotoSphere(photos);
    });
  });

  function updateData(payload) {
    const source = map.getSource('places');
    if (!source) return;
    const features = (payload.places || []).map((place) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [place.lng, place.lat]
      },
      properties: {
        id: place.id,
        title: place.title,
        visitsCount: place.visitsCount,
        photos: place.visits?.flatMap((visit) => visit.photos || []) || []
      }
    }));
    source.setData({
      type: 'FeatureCollection',
      features
    });
    renderMetaballs(map, features);
  }

  function onIdle(callback) {
    map.on('idle', callback);
  }

  return {
    map,
    updateData,
    onIdle,
    getBounds: () => map.getBounds(),
    getZoom: () => map.getZoom()
  };
}
