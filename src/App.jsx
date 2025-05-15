import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

function App() {
  const [geojsons, setGeojsons] = useState([]);
  const [error, setError] = useState('');
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // Handle file upload and parse GeoJSON
  const handleFiles = async (e) => {
    setError('');
    const files = Array.from(e.target.files);
    const loaded = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        // Correct GeoJSON type casing if needed
        if (json.type && typeof json.type === 'string') {
          const typeMap = {
            'featurecollection': 'FeatureCollection',
            'feature': 'Feature',
            'geometrycollection': 'GeometryCollection',
            'point': 'Point',
            'multipoint': 'MultiPoint',
            'linestring': 'LineString',
            'multilinestring': 'MultiLineString',
            'polygon': 'Polygon',
            'multipolygon': 'MultiPolygon',
          };
          const fixedType = typeMap[json.type.toLowerCase()];
          if (fixedType) json.type = fixedType;
        }
        if (json.type !== 'FeatureCollection' && json.type !== 'Feature') {
          throw new Error('Invalid GeoJSON: must be FeatureCollection or Feature');
        }
        loaded.push(json);
      } catch (err) {
        setError(`Error in file ${file.name}: ${err.message}`);
        return;
      }
    }
    setGeojsons(loaded);
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      // Use a beautiful open-source basemap from MapTiler -- frontend key here
      style: 'https://api.maptiler.com/maps/streets/style.json?key=Y2QwhDtY02fO9r6p6loF',
      center: [0, 0],
      zoom: 2,
    });
  }, []);

  // Add/Update GeoJSON sources and layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove previous sources/layers
    // Remove all previous geojson layers and their associated layers
    const style = map.getStyle();
    if (style && style.sources) {
      Object.keys(style.sources).forEach((id) => {
        if (id.startsWith('geojson-')) {
          // Remove all possible layers for this source
          ['','-line','-point'].forEach(suffix => {
            const layerId = id + suffix;
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          });
          map.removeSource(id);
        }
      });
    }
    // Add new geojsons
    geojsons.forEach((geojson, idx) => {
      const id = `geojson-${idx}`;
      if (map.getSource(id)) map.removeSource(id);
      map.addSource(id, { type: 'geojson', data: geojson });
      map.addLayer({
        id,
        type: 'fill',
        source: id,
        paint: {
          'fill-color': '#088',
          'fill-opacity': 0.4,
        },
        filter: ['==', '$type', 'Polygon'],
      });
      map.addLayer({
        id: id + '-line',
        type: 'line',
        source: id,
        paint: {
          'line-color': '#088',
          'line-width': 2,
        },
        filter: ['==', '$type', 'LineString'],
      });
      map.addLayer({
        id: id + '-point',
        type: 'circle',
        source: id,
        paint: {
          'circle-radius': 6,
          'circle-color': '#B42222',
        },
        filter: ['==', '$type', 'Point'],
      });
    });
    // Zoom to bounds
    if (geojsons.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      geojsons.forEach((geojson) => {
        const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
        features.forEach((f) => {
          const coords = getCoords(f.geometry);
          coords.forEach((c) => bounds.extend(c));
        });
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40 });
    }
  }, [geojsons]);

  // Helper to extract all coordinates from geometry
  function getCoords(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Point') return [[...geometry.coordinates]];
    if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') return geometry.coordinates;
    if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') return geometry.coordinates.flat();
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat(2);
    return [];
  }

  // Clear map and reset state
  const handleClear = () => {
    setGeojsons([]);
    setError('');
  };

  return (
    <div className="app-container">
      <h1>GeoJSON Map Viewer</h1>
      <input
        type="file"
        accept=".geojson,application/geo+json,application/json"
        multiple
        onChange={handleFiles}
      />
      <button onClick={handleClear} style={{ marginLeft: 8 }}>Clear Map</button>
      {error && <div className="error">{error}</div>}
      <div ref={mapContainer} className="map-container" style={{ height: '70vh', marginTop: 16 }} />
      <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
        <p>Upload one or more GeoJSON files to view them on the map. Features will be styled by type.</p>
      </div>
    </div>
  );
}

export default App;
