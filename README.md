# LinkNYC Kiosk Map

This project is an interactive map built with Mapbox GL JS that visualizes LinkNYC public Wi-Fi kiosk locations across New York City. Users can explore and filter LinkNYC types (LinkNYC1.0 and Link5G), search by address, and view detailed information about each kiosk — including type and location.

---

## Dataset Information

As of May 11, 2025, this map uses a static dataset hosted on GitHub:
📁 LinkNYC_Kiosk_Locations_20250426.csv

Due to the NYC Open Data API limiting responses to 1,000 records, the full dataset was manually downloaded and uploaded to this project. This ensures that all available kiosks are shown on the map without pagination or API query limits.

---

## Features

- Displays full LinkNYC kiosk locations using custom-hosted GeoJSON
- Address search via Mapbox Geocoder
- Clickable markers with popups showing kiosk type and address
- Kiosk type filters (Classic vs. 5G)
- Zoom-dependent marker sizing for improved readability
- Map style switcher (Streets, Satellite, Dark)
- Informative legend with clickable image preview for each kiosk type
- Location-based highlight within 10-minute walking distance using geolocation

---

## Technologies Used

- HTML5 / CSS3 / JavaScript
- Mapbox GL JS
- PapaParse for CSV parsing
- GitHub-hosted dataset (CSV converted to GeoJSON dynamically)

---

## How to Use

1. Open the map in your browser (locally or via GitHub Pages).
2. Use the search bar to enter your address.
3. Use the legend checkboxes to filter between Link1.0 and Link5G.
4. Click on map markers to see kiosk type and address.
5. Click the legend labels to view real images of each kiosk type.
6. Click the “📍” geolocator icon to find kiosks within a 10-minute walking distance.

---

## About LinkNYC

LinkNYC is a communications network providing fast, free public Wi-Fi at kiosks across New York City. There are two main kiosk types:
- **LinkNYC Classic (Link1.0)**: Offers Wi-Fi, free phone calls, device charging, and access to city services.
- **Link5G**: Upgraded kiosks with 5G antennas and enhanced connectivity.

--- 
