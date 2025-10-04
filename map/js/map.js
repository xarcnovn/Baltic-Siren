// Map Module - Handles Mapbox GL JS initialization and vessel plotting

const MapModule = (function() {
    let map;
    let markers = [];
    let selectedVesselId = null;
    let tooltipElement = null;

    // Initialize Mapbox map
    function init() {
        // Note: Using public token - works without API key for basic dark map
        // For production, get your own token at https://account.mapbox.com/
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11', // Dark tactical style
            center: [20.0, 58.0], // Baltic Sea region
            zoom: 5,
            pitch: 0,
            bearing: 0
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add scale
        map.addControl(new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');

        // Update coordinates on mouse move
        map.on('mousemove', (e) => {
            const lat = e.lngLat.lat.toFixed(4);
            const lng = e.lngLat.lng.toFixed(4);
            document.getElementById('coordinates').textContent = `LAT: ${lat} | LON: ${lng}`;
        });

        // Add grid overlay for tactical effect
        map.on('load', () => {
            addGridOverlay();
        });

        console.log('Map initialized');
    }

    // Add tactical grid overlay
    function addGridOverlay() {
        // Add a graticule (latitude/longitude grid) for tactical feel
        map.addSource('grid', {
            type: 'geojson',
            data: createGridGeoJSON()
        });

        map.addLayer({
            id: 'grid-lines',
            type: 'line',
            source: 'grid',
            paint: {
                'line-color': '#00ff00',
                'line-width': 0.5,
                'line-opacity': 0.15
            }
        });
    }

    // Create grid GeoJSON (simplified graticule)
    function createGridGeoJSON() {
        const features = [];

        // Latitude lines (horizontal)
        for (let lat = -90; lat <= 90; lat += 10) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[-180, lat], [180, lat]]
                }
            });
        }

        // Longitude lines (vertical)
        for (let lng = -180; lng <= 180; lng += 10) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[lng, -90], [lng, 90]]
                }
            });
        }

        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    // Generate random position in Baltic/Black Sea region for demo
    function generateRandomPosition(vessel) {
        // Baltic Sea: 54-66°N, 10-30°E
        // Black Sea: 41-47°N, 27-42°E
        // For now, focus on Baltic region
        const lat = 54 + Math.random() * 12; // 54-66°N
        const lng = 10 + Math.random() * 20; // 10-30°E
        return [lng, lat];
    }

    // Create vessel marker element
    function createMarkerElement(vessel) {
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        el.style.cssText = `
            width: 12px;
            height: 12px;
            background: #00ff00;
            border: 2px solid #00ff00;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
            cursor: pointer;
            transition: all 0.3s;
        `;

        // Hover effect - show tooltip and highlight marker
        el.addEventListener('mouseenter', () => {
            el.style.background = '#ffaa00';
            el.style.borderColor = '#ffaa00';
            el.style.boxShadow = '0 0 20px rgba(255, 170, 0, 1)';
            el.style.width = '16px';
            el.style.height = '16px';
            showTooltip(vessel, el);
        });

        el.addEventListener('mouseleave', () => {
            if (selectedVesselId !== vessel.IMO) {
                el.style.background = '#00ff00';
                el.style.borderColor = '#00ff00';
                el.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.6)';
                el.style.width = '12px';
                el.style.height = '12px';
            }
            hideTooltip();
        });

        return el;
    }

    // Create popup content
    function createPopupContent(vessel) {
        return `
            <div class="popup-vessel-name">${vessel.vessel_name || 'UNKNOWN'}</div>
            <div class="popup-detail">
                <span class="popup-label">IMO:</span>
                <span class="popup-value">${vessel.IMO || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">MMSI:</span>
                <span class="popup-value">${vessel.MMSI || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Flag:</span>
                <span class="popup-value">${vessel.flag || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Type:</span>
                <span class="popup-value">${vessel.vessel_type || 'N/A'}</span>
            </div>
        `;
    }

    // Create tooltip element
    function createTooltip() {
        if (!tooltipElement) {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'vessel-tooltip';
            document.body.appendChild(tooltipElement);
        }
        return tooltipElement;
    }

    // Show tooltip on hover
    function showTooltip(vessel, markerElement) {
        const tooltip = createTooltip();

        // Create tooltip content with photo
        const photoHtml = vessel.vessel_photo_url
            ? `<img src="${vessel.vessel_photo_url}" alt="${vessel.vessel_name}" class="tooltip-photo" onerror="this.style.display='none'">`
            : '';

        tooltip.innerHTML = `
            ${photoHtml}
            <div class="tooltip-content">
                <div class="tooltip-name">${vessel.vessel_name || 'UNKNOWN'}</div>
                <div class="tooltip-row">
                    <span class="tooltip-label">IMO:</span> ${vessel.IMO || 'N/A'}
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Flag:</span> ${vessel.flag || 'N/A'}
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Type:</span> ${vessel.vessel_type || 'N/A'}
                </div>
            </div>
        `;

        // Position tooltip relative to marker
        const rect = markerElement.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - 10 + 'px';
    }

    // Hide tooltip
    function hideTooltip() {
        if (tooltipElement) {
            tooltipElement.style.display = 'none';
        }
    }

    // Plot vessels on map
    function plotVessels(vessels) {
        // Clear existing markers
        clearMarkers();

        vessels.forEach(vessel => {
            // Generate random position for demo (will be replaced with real AIS data)
            const position = generateRandomPosition(vessel);

            // Create marker element
            const el = createMarkerElement(vessel);

            // Create popup
            const popup = new mapboxgl.Popup({
                offset: 15,
                closeButton: true,
                closeOnClick: false
            }).setHTML(createPopupContent(vessel));

            // Create marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat(position)
                .setPopup(popup)
                .addTo(map);

            // Click handler
            el.addEventListener('click', () => {
                selectVessel(vessel, el);
            });

            markers.push({ marker, vessel, element: el });
        });

        console.log(`Plotted ${vessels.length} vessels on map`);
    }

    // Select a vessel
    function selectVessel(vessel, element) {
        selectedVesselId = vessel.IMO;

        // Update all markers
        markers.forEach(m => {
            if (m.vessel.IMO === vessel.IMO) {
                m.element.style.background = '#ffaa00';
                m.element.style.borderColor = '#ffaa00';
                m.element.style.boxShadow = '0 0 20px rgba(255, 170, 0, 1)';
                m.element.style.width = '16px';
                m.element.style.height = '16px';
            } else {
                m.element.style.background = '#00ff00';
                m.element.style.borderColor = '#00ff00';
                m.element.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.6)';
                m.element.style.width = '12px';
                m.element.style.height = '12px';
            }
        });

        // Trigger vessel details update (handled by UI module)
        if (window.UIModule) {
            window.UIModule.showVesselDetails(vessel);
        }
    }

    // Focus on vessel
    function focusOnVessel(vessel) {
        const marker = markers.find(m => m.vessel.IMO === vessel.IMO);
        if (marker) {
            const lngLat = marker.marker.getLngLat();
            map.flyTo({
                center: [lngLat.lng, lngLat.lat],
                zoom: 8,
                duration: 1500
            });

            // Open popup
            marker.marker.togglePopup();

            // Select vessel
            selectVessel(vessel, marker.element);
        }
    }

    // Clear all markers
    function clearMarkers() {
        markers.forEach(m => m.marker.remove());
        markers = [];
    }

    // Public API
    return {
        init,
        plotVessels,
        focusOnVessel,
        clearMarkers
    };
})();
