// Set Mapbox Access Token
mapboxgl.accessToken = 'pk.eyJ1IjoidGszMzk2IiwiYSI6ImNtOWJvZW04dzBqeGsya3EyNHpreDRkbncifQ.3FH9RYuE9AVUfIRxGLfgQw';


// Initialize Map
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-74.0060, 40.7128],
  zoom: 12
});
map.addControl(new mapboxgl.NavigationControl());


// Global variable to store GeoJSON data
let kioskGeoJSON = null;

/* ===============================
   Load Kiosks as GeoJSON Layer
================================ */
map.on('load', function () {
  fetch('https://data.cityofnewyork.us/resource/s4kf-3yrf.json')
    .then(res => res.json())
    .then(data => {
      kioskGeoJSON = {
        type: "FeatureCollection",
        features: data.filter(k => k.latitude && k.longitude).map(k => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [parseFloat(k.longitude), parseFloat(k.latitude)]
          },
          properties: {
            planned_kiosk_type: k.planned_kiosk_type || "Unknown",
            street_address: k.street_address || "No address"
          }
        }))
      };

      addKioskLayer();
    });
});

/* ===============================
   Function: Add Kiosk Layer (Color Logic)
================================ */
function addKioskLayer() {
  if (!map.getSource('kiosks')) {
    map.addSource('kiosks', { type: 'geojson', data: kioskGeoJSON });
  }

  if (!map.getLayer('kiosks-layer')) {
    map.addLayer({
      id: 'kiosks-layer',
      type: 'circle',
      source: 'kiosks',
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'case',
          ['in', '5G', ['get', 'planned_kiosk_type']], '#007bff', 
          '#28a745'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Popup on click
    map.on('click', 'kiosks-layer', function (e) {
      const coords = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(`<b>Type:</b> ${props.planned_kiosk_type}<br><b>Address:</b> ${props.street_address}`)
        .addTo(map);
    });

    map.on('mouseenter', 'kiosks-layer', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'kiosks-layer', () => map.getCanvas().style.cursor = '');
  }
}

/* ===============================
   Change Base Map Style & Restore Elements
================================ */
function changeMapStyle(style) {
  const styles = {
    'streets': 'mapbox://styles/mapbox/streets-v12',
    'satellite': 'mapbox://styles/mapbox/satellite-v9',
    'dark': 'mapbox://styles/mapbox/dark-v11'
  };

  map.setStyle(styles[style]);

  map.on('style.load', function() {
    
    const geoContainer = document.getElementById('geocoder');
    geoContainer.innerHTML = '';
    geoContainer.appendChild(geocoder.onAdd(map));

    if (kioskGeoJSON) {
      addKioskLayer();
    }
  });
}

/* ===============================
   Initialize Geocoder
================================ */
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  placeholder: "Enter your address",
  countries: 'US',
  bbox: [-74.2591, 40.4774, -73.7004, 40.9176],
  marker: { color: 'red' },
  zoom: 15
});

geocoder.on('result', function() {
  const toast = document.getElementById('guide-toast');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
});

// Attach Geocoder initially
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

/* ===============================
   Reset Map View
================================ */
function resetMap() {
  map.flyTo({ center: [-74.0060, 40.7128], zoom: 12 });
}
window.resetMap = resetMap;

/* ===============================
   Show / Hide Kiosk Image
================================ */
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
