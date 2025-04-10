mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // 🔑 여기에 자신의 액세스 토큰 넣기

let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-74.0060, 40.7128],
  zoom: 12
});

let markers = [];

function changeMapStyle(style) {
  const styles = {
    'streets': 'mapbox://styles/mapbox/streets-v12',
    'satellite': 'mapbox://styles/mapbox/satellite-v9',
    'dark': 'mapbox://styles/mapbox/dark-v11'
  };
  map.setStyle(styles[style]);
}

function resizeMapWidth(width) {
  document.getElementById("map").style.width = width + "%";
  document.getElementById("mapWidthValue").innerText = width + "%";
  map.resize();
}

function clearMarkers() {
  markers.forEach(marker => marker.remove());
  markers = [];
}

function addMarker(lat, lon, color, tooltip) {
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.backgroundColor = color;
  el.style.width = '10px';
  el.style.height = '10px';
  el.style.borderRadius = '50%';

  const marker = new mapboxgl.Marker(el)
    .setLngLat([lon, lat])
    .setPopup(new mapboxgl.Popup().setHTML(tooltip))
    .addTo(map);

  markers.push(marker);
}

function loadAllKiosks() {
  fetch(`https://data.cityofnewyork.us/resource/s4kf-3yrf.json`)
    .then(res => res.json())
    .then(data => {
      clearMarkers();
      document.getElementById("total-count").innerText = `Total kiosks displayed: ${data.length}`;
      data.forEach(k => {
        if (k.latitude && k.longitude) {
          const type = k.planned_kiosk_type || "Unknown";
          const address = k.street_address || "No address";
          const color = type.toLowerCase().includes("5g") ? "blue" : "green";
          const tooltip = `<b>Type: ${type}</b><br>${address}`;
          addMarker(+k.latitude, +k.longitude, color, tooltip);
        }
      });
    });
}

function loadMap() {
  const zipcode = document.getElementById("zipcode").value.trim();
  if (!zipcode) {
    alert("Please enter a ZIPCODE.");
    document.getElementById("result-count").innerText = "";
    return;
  }

  fetch(`https://data.cityofnewyork.us/resource/s4kf-3yrf.json?postcode=${zipcode}`)
    .then(res => res.json())
    .then(data => {
      clearMarkers();
      document.getElementById("result-count").innerText =
        `Found ${data.length} kiosks in ZIPCODE ${zipcode}`;

      if (data.length === 0) {
        alert("No LinkNYC locations found for this ZIPCODE.");
        return;
      }

      data.forEach(k => {
        if (k.latitude && k.longitude) {
          const type = k.planned_kiosk_type || "Unknown";
          const address = k.street_address || "No address";
          const color = type.toLowerCase().includes("5g") ? "blue" : "green";
          const tooltip = `<b>Type: ${type}</b><br>${address}`;
          addMarker(+k.latitude, +k.longitude, color, tooltip);
        }
      });

      map.flyTo({
        center: [+data[0].longitude, +data[0].latitude],
        zoom: 14
      });
    });
}

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

window.onload = loadAllKiosks;
