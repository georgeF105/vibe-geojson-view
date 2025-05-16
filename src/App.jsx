import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

function App() {
  const [geojsons, setGeojsons] = useState([]);
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
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
        loaded.push({ name: file.name, data: json });
      } catch (err) {
        setError(`Error in file ${file.name}: ${err.message}`);
        return;
      }
    }
    setGeojsons(prev => [...prev, ...loaded]);
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
    geojsons.forEach((geo, idx) => {
      const id = `geojson-${idx}`;
      if (map.getSource(id)) map.removeSource(id);
      map.addSource(id, { type: 'geojson', data: geo.data });
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
      geojsons.forEach((geo) => {
        const geojson = geo.data;
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

  // Handle drag and drop
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    setError('');
    const files = Array.from(e.dataTransfer.files);
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
        loaded.push({ name: file.name, data: json });
      } catch (err) {
        setError(`Error in file ${file.name}: ${err.message}`);
        return;
      }
    }
    setGeojsons(prev => [...prev, ...loaded]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  // Make drop zone overlay work globally, not just over the map
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      setIsDragActive(true);
    };
    const handleWindowDrop = () => {
      setIsDragActive(false);
    };
    const handleWindowDragLeave = () => {
      setIsDragActive(false);
    };
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragleave', handleWindowDragLeave);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragleave', handleWindowDragLeave);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="app-navbar">
        <img src="./vibe-icon.png" alt="Vibe Icon" className="vibe-icon" />
        <h1>Vibe GeoJSON View</h1>
        <label className="upload-icon-btn">
          <ArrowUpTrayIcon className="upload-icon" />
          <input
            type="file"
            accept=".geojson,application/geo+json,application/json"
            multiple
            onChange={handleFiles}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={handleClear}>Clear Map</button>
        {error && <div className="error">{error}</div>}
      </div>
      <div
        className={`drop-zone${isDragActive ? ' active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-zone-content">
          <span role="img" aria-label="Upload" style={{fontSize: '2rem'}}>📂</span>
          <p>Drag & drop GeoJSON files here</p>
        </div>
      </div>
      {geojsons.length > 0 && (
        <div className="file-list-overlay">
          <ul>
            {geojsons.map((g, i) => (
              <li key={i}>{g.name}</li>
            ))}
          </ul>
        </div>
      )}
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
