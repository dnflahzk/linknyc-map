/* ================================================
 1. Set Mapbox Access Token
================================================ */
mapboxgl.accessToken = 'pk.eyJ1IjoidGszMzk2IiwiYSI6ImNtOWJvZW04dzBqeGsya3EyNHpreDRkbncifQ.3FH9RYuE9AVUfIRxGLfgQw';


/* ================================================
 2. Initialize the Map
   - Sets map container, style, center, and zoom
================================================ */
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-74.0060, 40.7128], // NYC
  zoom: 10
});


/* ================================================
 3. Add Mapbox Geocoder
   - Address search with red marker
   - Toast and cleanup on result
================================================ */
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  placeholder: "Enter your address",
  countries: 'US',
  bbox: [-74.2591, 40.4774, -73.7004, 40.9176], // NYC bounds
  marker: { color: 'red' },
  zoom: 15
});

geocoder.on('result', function () {
  clearHighlightsAndBuffer();
  const toast = document.getElementById('guide-toast');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
  if (userMarker) {
    userMarker.remove();
    userMarker = null;
  }
});


/* ================================================
 4. Global Variables
================================================ */
let kioskGeoJSON = null;
let userMarker = null;
let highlightedMarkers = [];
let geolocateControl = null;


/* ================================================
 5. Utility Functions
   - Sidebar toggle, geocoder reattach, kiosk layers
================================================ */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('closed');
}

function reattachGeocoder() {
  const geoContainer = document.getElementById('geocoder');
  geoContainer.innerHTML = '';
  geoContainer.appendChild(geocoder.onAdd(map));
}

function addKioskLayers() {
  // Classic kiosks (green)
  map.addLayer({
    id: 'link1-layer',
    type: 'circle',
    source: 'kiosks-local',
    filter: ['in', '1.0', ['get', 'kiosk_type']],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 12, 4, 14, 6],
      'circle-color': '#28a745',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  // 5G kiosks (blue)
  map.addLayer({
    id: 'link5g-layer',
    type: 'circle',
    source: 'kiosks-local',
    filter: ['in', '5G', ['get', 'kiosk_type']],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 12, 4, 14, 6],
      'circle-color': '#007bff',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });
}

function setCursorEvents(layerId) {
  map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
}


/* ================================================
 6. Geolocation & Buffer
   - User marker, 800m buffer, highlight nearby kiosks
================================================ */
function addGeolocateControl() {
  geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserHeading: true
  });
  map.addControl(geolocateControl, 'top-right');

  geolocateControl.on('geolocate', function (e) {
    clearHighlightsAndBuffer();
    const userLngLat = [e.coords.longitude, e.coords.latitude];

    const personMarker = document.createElement('div');
    personMarker.className = 'person-marker';
    personMarker.textContent = '🧍🏼';

    userMarker = new mapboxgl.Marker({ element: personMarker })
      .setLngLat(userLngLat)
      .addTo(map);

    const circle = turf.circle(userLngLat, 0.8, { steps: 64, units: 'kilometers' });

    if (map.getLayer('user-buffer-layer')) map.removeLayer('user-buffer-layer');
    if (map.getSource('user-buffer')) map.removeSource('user-buffer');
    map.addSource('user-buffer', { type: 'geojson', data: circle });
    map.addLayer({
      id: 'user-buffer-layer',
      type: 'fill',
      source: 'user-buffer',
      paint: { 'fill-color': '#ffcc00', 'fill-opacity': 0.2 }
    });

    const bounds = turf.bbox(circle);
    map.fitBounds(bounds, {
      padding: window.innerWidth < 768 ? 30 : 40,
      duration: 1000
    });

    const highlighted = kioskGeoJSON.features.filter(f => turf.booleanPointInPolygon(f.geometry, circle));

    if (map.getLayer('highlight-kiosks-layer')) map.removeLayer('highlight-kiosks-layer');
    if (map.getSource('highlight-kiosks')) map.removeSource('highlight-kiosks');
    map.addSource('highlight-kiosks', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: highlighted }
    });

    highlighted.forEach(feature => {
      const el = document.createElement('div');
      el.className = 'mapboxgl-circle-neon';
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map);
      highlightedMarkers.push(marker);
    });
  });
}


/* ================================================
 7. Load Map & Kiosk CSV Data (GeoJSON Conversion)
================================================ */
map.on('load', function () {
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  addGeolocateControl();
  reattachGeocoder();

  fetch('https://raw.githubusercontent.com/dnflahzk/linknyc-map/main/LinkNYC_Kiosk_Locations_20250426.csv')
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const features = results.data
            .filter(row => row.Latitude && row.Longitude)
            .map(row => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(row.Longitude), parseFloat(row.Latitude)]
              },
              properties: {
                kiosk_type: row["Planned Kiosk Type"] || 'Planned Kiosk Type',
                address: row["Street Address"] || 'Street Address'
              }
            }));

          kioskGeoJSON = { type: 'FeatureCollection', features: features };
          map.addSource('kiosks-local', { type: 'geojson', data: kioskGeoJSON });
          addKioskLayers();

          ['link1-layer', 'link5g-layer'].forEach(layer => {
            map.on('click', layer, function (e) {
              const props = e.features[0].properties;
              const type = props.kiosk_type.split('_')[0];
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<b>Type:</b> ${type}<br><b>Address:</b> ${props.address}`)
                .addTo(map);
            });
            setCursorEvents(layer);
          });

          // Smooth zoom animation
          map.flyTo({ zoom: 9, duration: 0 });
          setTimeout(() => {
            map.flyTo({
              center: [-74.0060, 40.7128],
              zoom: 10,
              speed: 0.6,
              curve: 1.2,
              easing: (t) => t
            });
            setTimeout(() => map.resize(), 1000);
          }, 1200);
        }
      });
    });
});


/* ================================================
 8. Map Style Switcher
================================================ */
function changeMapStyle(style) {
  const styles = {
    'streets': 'mapbox://styles/mapbox/streets-v12',
    'satellite': 'mapbox://styles/mapbox/satellite-v9',
    'dark': 'mapbox://styles/mapbox/dark-v11'
  };

  map.setStyle(styles[style]);

  map.once('style.load', () => {
    reattachGeocoder();
    map.addSource('kiosks-local', { type: 'geojson', data: kioskGeoJSON });
    addKioskLayers();
  });
}


/* ================================================
 9. Reset Map to Default View
================================================ */
function resetMap() {
  clearHighlightsAndBuffer();

  if (geolocateControl) {
    map.removeControl(geolocateControl);
    addGeolocateControl();
  }

  map.flyTo({ center: [-74.0060, 40.7128], zoom: 10, speed: 0.6, curve: 1.2, essential: true });
}
window.resetMap = resetMap;


/* ================================================
10. Clear Markers & Buffer Zone
================================================ */
function clearHighlightsAndBuffer() {
  if (userMarker) {
    userMarker.remove();
    userMarker = null;
  }
  if (map.getLayer('user-buffer-layer')) map.removeLayer('user-buffer-layer');
  if (map.getSource('user-buffer')) map.removeSource('user-buffer');
  highlightedMarkers.forEach(m => m.remove());
  highlightedMarkers = [];
}


/* ================================================
11. Kiosk Layer Toggle (Checkbox Control)
================================================ */
function toggleLayer(type) {
  const layerId = type === 'Link1.0' ? 'link1-layer' : 'link5g-layer';
  const checkbox = document.getElementById(type === 'Link1.0' ? 'toggle-link1' : 'toggle-link5g');
  const visibility = checkbox.checked ? 'visible' : 'none';

  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visibility);
  }
}


/* ================================================
12. Kiosk Image Modal Viewer
================================================ */
function showImage(type) {
  const img = document.getElementById("kiosk-image");
  img.src = type === "link1"
    ? "https://www.link.nyc/assets/img/LinkNYC.jpg"
    : "https://www.amny.com/wp-content/uploads/2023/04/MG_4810-2048x1365.jpg";
  document.getElementById("image-overlay").style.display = "flex";
}

function hideImage() {
  document.getElementById("image-overlay").style.display = "none";
}
