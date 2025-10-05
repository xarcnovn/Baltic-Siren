// Map Module - Handles Mapbox GL JS initialization and vessel plotting

const MapModule = (function() {
    let map;
    let markers = [];
    let infrastructureMarkers = [];
    let infrastructureVisible = true;
    let cableLayersVisible = true;
    let selectedVesselId = null;
    let tooltipElement = null;
    let trackedVesselMarkers = {}; // Store markers by MMSI
    let vesselTrails = {}; // Store trail layers by MMSI

    // Initialize Mapbox map
    function init() {
        // Baltic Sea bounds [west, south, east, north]
        const balticBounds = [
            [9.0, 53.0],  // Southwest coordinates
            [31.0, 66.0]  // Northeast coordinates
        ];

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [20.0, 58.0], // Baltic Sea center
            zoom: 5.5,
            minZoom: 4,
            maxZoom: 12,
            pitch: 0,
            bearing: 0,
            maxBounds: balticBounds // Restrict map to Baltic Sea region
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

        // Add grid overlay and infrastructure when map loads
        map.on('load', () => {
            addGridOverlay();
            loadInfrastructure();
            loadSubmarineCables();
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

    // Add Baltic Sea specific labels and markers
    function addBalticSeaLabels() {
        // Major Baltic Sea ports and cities
        const balticCities = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [18.0686, 59.3293] },
                    properties: { name: 'STOCKHOLM', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [24.9384, 60.1699] },
                    properties: { name: 'HELSINKI', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [24.1052, 56.9496] },
                    properties: { name: 'RIGA', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [25.2797, 54.6872] },
                    properties: { name: 'VILNIUS', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [12.5683, 55.6761] },
                    properties: { name: 'COPENHAGEN', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [13.4050, 52.5200] },
                    properties: { name: 'BERLIN', type: 'capital' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [30.3141, 59.9311] },
                    properties: { name: 'ST. PETERSBURG', type: 'port' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [20.4651, 54.5189] },
                    properties: { name: 'KALININGRAD', type: 'port' }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [18.6466, 54.3520] },
                    properties: { name: 'GDANSK', type: 'port' }
                }
            ]
        };

        // Add source for city markers
        map.addSource('baltic-cities', {
            type: 'geojson',
            data: balticCities
        });

        // Add city labels with tactical styling
        map.addLayer({
            id: 'baltic-city-labels',
            type: 'symbol',
            source: 'baltic-cities',
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
                'text-size': 11,
                'text-offset': [0, 1.5],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#00cc00',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'text-opacity': 0.8
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

        // Show tooltip invisibly to get its dimensions
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        // Get dimensions after content is set
        const tooltipRect = tooltip.getBoundingClientRect();
        const rect = markerElement.getBoundingClientRect();

        // Calculate position: centered horizontally, above the marker
        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        const top = rect.top - tooltipRect.height - 10; // 10px gap above marker

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.visibility = 'visible';
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

    // Load and display infrastructure
    async function loadInfrastructure() {
        try {
            const response = await fetch('data/poland_infrastructure.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            plotInfrastructure(data.features);
            console.log(`Loaded ${data.features.length} infrastructure points`);
        } catch (error) {
            console.error('Error loading infrastructure:', error);
        }
    }

    // Get marker color based on category
    function getInfrastructureColor(category) {
        const colors = {
            'port': '#3b82f6',      // Blue
            'naval': '#8b5cf6',     // Purple
            'energy': '#eab308',    // Yellow
            'pipeline': '#ec4899',  // Pink
            'telecom': '#10b981',   // Green
            'cable': '#06b6d4'      // Cyan
        };
        return colors[category] || '#ffffff';
    }

    // Get marker icon based on category
    function getInfrastructureIcon(category) {
        const icons = {
            'port': '⚓',
            'naval': '⚔',
            'energy': '⚡',
            'pipeline': '▬',
            'telecom': '📡',
            'cable': '═'
        };
        return icons[category] || '●';
    }

    // Create infrastructure marker element
    function createInfrastructureMarker(feature) {
        const { category, name } = feature.properties;
        const color = getInfrastructureColor(category);
        const icon = getInfrastructureIcon(category);

        const el = document.createElement('div');
        el.className = 'infrastructure-marker';
        el.innerHTML = icon;
        el.style.cssText = `
            width: 20px;
            height: 20px;
            background: ${color};
            border: 2px solid ${color};
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 0 10px ${color}80;
        `;

        // Hover effect
        el.addEventListener('mouseenter', () => {
            el.style.width = '26px';
            el.style.height = '26px';
            el.style.fontSize = '16px';
            el.style.boxShadow = `0 0 20px ${color}`;
            showInfrastructureTooltip(feature, el);
        });

        el.addEventListener('mouseleave', () => {
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.fontSize = '12px';
            el.style.boxShadow = `0 0 10px ${color}80`;
            hideTooltip();
        });

        return el;
    }

    // Create infrastructure popup content
    function createInfrastructurePopup(properties) {
        const criticalityColor = {
            'critical': '#ff0000',
            'high': '#ff6600',
            'medium': '#ffaa00',
            'low': '#00ff00'
        };

        return `
            <div class="popup-vessel-name">${properties.name}</div>
            <div class="popup-detail">
                <span class="popup-label">Type:</span>
                <span class="popup-value">${properties.type}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Category:</span>
                <span class="popup-value">${properties.category.toUpperCase()}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Status:</span>
                <span class="popup-value">${properties.status.toUpperCase()}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Capacity:</span>
                <span class="popup-value">${properties.capacity}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Criticality:</span>
                <span class="popup-value" style="color: ${criticalityColor[properties.criticality]}">${properties.criticality.toUpperCase()}</span>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 11px;">
                ${properties.details}
            </div>
        `;
    }

    // Show infrastructure tooltip
    function showInfrastructureTooltip(feature, markerElement) {
        const tooltip = createTooltip();
        const { name, category, type, status } = feature.properties;
        const color = getInfrastructureColor(category);

        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-name" style="color: ${color}">${name}</div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Type:</span> ${type}
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Status:</span> ${status.toUpperCase()}
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Category:</span> ${category.toUpperCase()}
                </div>
            </div>
        `;

        // Show tooltip invisibly to get its dimensions
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        // Get dimensions after content is set
        const tooltipRect = tooltip.getBoundingClientRect();
        const rect = markerElement.getBoundingClientRect();

        // Calculate position: centered horizontally, above the marker
        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        const top = rect.top - tooltipRect.height - 10; // 10px gap above marker

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.visibility = 'visible';
    }

    // Show cable tooltip
    function showCableTooltip(feature, mapEvent) {
        const tooltip = createTooltip();
        const { name, category, cable_type, type, status, length, capacity, landing_points } = feature.properties;

        // Determine cable color based on type
        let cableColor = getInfrastructureColor(category);
        if (cable_type === 'power') {
            cableColor = '#eab308'; // Yellow for power cables
        } else if (cable_type === 'pipeline') {
            cableColor = '#ec4899'; // Pink for pipelines
        } else {
            cableColor = '#06b6d4'; // Cyan for data cables
        }

        // Status colors
        const statusColors = {
            'operational': '#00ff00',
            'damaged': '#ff6600',
            'construction': '#ffaa00',
            'planned': '#888888'
        };

        const statusColor = statusColors[status] || '#ffffff';

        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-name" style="color: ${cableColor}">${name}</div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Type:</span> ${type}
                </div>
                <div class="tooltip-row">
                    <span class="tooltip-label">Status:</span> <span style="color: ${statusColor}">${status.toUpperCase()}</span>
                </div>
                ${length ? `<div class="tooltip-row">
                    <span class="tooltip-label">Length:</span> ${length}
                </div>` : ''}
                ${capacity ? `<div class="tooltip-row">
                    <span class="tooltip-label">Capacity:</span> ${capacity}
                </div>` : ''}
            </div>
        `;

        // Show tooltip invisibly to get its dimensions
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        // Get dimensions after content is set
        const tooltipRect = tooltip.getBoundingClientRect();

        // Calculate position based on mouse position
        const mouseX = mapEvent.originalEvent.clientX;
        const mouseY = mapEvent.originalEvent.clientY;

        // Position tooltip above and centered on cursor
        const left = mouseX - (tooltipRect.width / 2);
        const top = mouseY - tooltipRect.height - 15; // 15px gap above cursor

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.visibility = 'visible';
    }

    // Plot infrastructure on map
    function plotInfrastructure(features) {
        clearInfrastructure();

        features.forEach(feature => {
            const el = createInfrastructureMarker(feature);

            const popup = new mapboxgl.Popup({
                offset: 15,
                closeButton: true,
                closeOnClick: false
            }).setHTML(createInfrastructurePopup(feature.properties));

            const marker = new mapboxgl.Marker(el)
                .setLngLat(feature.geometry.coordinates)
                .setPopup(popup)
                .addTo(map);

            infrastructureMarkers.push({ marker, feature, element: el });
        });

        console.log(`Plotted ${features.length} infrastructure points`);
    }

    // Toggle infrastructure visibility
    function toggleInfrastructure() {
        infrastructureVisible = !infrastructureVisible;
        infrastructureMarkers.forEach(m => {
            if (infrastructureVisible) {
                m.marker.addTo(map);
            } else {
                m.marker.remove();
            }
        });
        return infrastructureVisible;
    }

    // Clear infrastructure markers
    function clearInfrastructure() {
        infrastructureMarkers.forEach(m => m.marker.remove());
        infrastructureMarkers = [];
    }

    // Load and display submarine cables
    async function loadSubmarineCables() {
        try {
            const response = await fetch('data/submarine_cables.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            plotSubmarineCables(data.features);
            console.log(`Loaded ${data.features.length} submarine cables`);
        } catch (error) {
            console.error('Error loading submarine cables:', error);
        }
    }

    // Plot submarine cables as line layers on map
    function plotSubmarineCables(features) {
        // Add each cable as a separate layer
        features.forEach((feature, index) => {
            const cableId = `cable-${index}`;
            const { name, cable_type, category } = feature.properties;

            // Determine cable color based on type
            let cableColor = getInfrastructureColor(category);
            if (cable_type === 'power') {
                cableColor = '#eab308'; // Yellow for power cables
            } else if (cable_type === 'pipeline') {
                cableColor = '#ec4899'; // Pink for pipelines
            } else {
                cableColor = '#06b6d4'; // Cyan for data cables
            }

            // Add source for this cable
            map.addSource(cableId, {
                type: 'geojson',
                data: feature
            });

            // Add line layer for the cable
            map.addLayer({
                id: cableId,
                type: 'line',
                source: cableId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': cableColor,
                    'line-width': 2,
                    'line-opacity': 0.8,
                    'line-dasharray': cable_type === 'data' ? [2, 2] : [1, 0]
                }
            });

            // Add a glow layer underneath for better visibility
            map.addLayer({
                id: `${cableId}-glow`,
                type: 'line',
                source: cableId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': cableColor,
                    'line-width': 6,
                    'line-opacity': 0.3,
                    'line-blur': 4
                }
            }, cableId); // Insert glow layer before the main cable layer

            // Add click handler to show cable details
            map.on('click', cableId, (e) => {
                const coordinates = e.lngLat;
                const description = createCablePopup(feature.properties);

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });

            // Change cursor on hover and show tooltip
            map.on('mouseenter', cableId, (e) => {
                map.getCanvas().style.cursor = 'pointer';
                showCableTooltip(feature, e);
            });

            map.on('mouseleave', cableId, () => {
                map.getCanvas().style.cursor = '';
                hideTooltip();
            });

            // Update tooltip position on mouse move
            map.on('mousemove', cableId, (e) => {
                showCableTooltip(feature, e);
            });
        });

        console.log(`Plotted ${features.length} submarine cables`);
    }

    // Create popup content for submarine cables
    function createCablePopup(properties) {
        const statusColors = {
            'operational': '#00ff00',
            'damaged': '#ff6600',
            'construction': '#ffaa00',
            'planned': '#888888'
        };

        const typeIcons = {
            'data': '📡',
            'power': '⚡',
            'pipeline': '▬'
        };

        return `
            <div class="popup-vessel-name">${typeIcons[properties.cable_type] || '═'} ${properties.name}</div>
            <div class="popup-detail">
                <span class="popup-label">Type:</span>
                <span class="popup-value">${properties.type}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Cable Type:</span>
                <span class="popup-value">${properties.cable_type.toUpperCase()}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Length:</span>
                <span class="popup-value">${properties.length}</span>
            </div>
            ${properties.capacity ? `
            <div class="popup-detail">
                <span class="popup-label">Capacity:</span>
                <span class="popup-value">${properties.capacity}</span>
            </div>
            ` : ''}
            <div class="popup-detail">
                <span class="popup-label">Route:</span>
                <span class="popup-value">${properties.landing_points}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Operator:</span>
                <span class="popup-value">${properties.operator}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Status:</span>
                <span class="popup-value" style="color: ${statusColors[properties.status]}">${properties.status.toUpperCase()}</span>
            </div>
            ${properties.commissioned ? `
            <div class="popup-detail">
                <span class="popup-label">Commissioned:</span>
                <span class="popup-value">${properties.commissioned}</span>
            </div>
            ` : ''}
            <div class="popup-detail">
                <span class="popup-label">Criticality:</span>
                <span class="popup-value" style="color: ${properties.criticality === 'critical' ? '#ff0000' : '#ffaa00'}">${properties.criticality.toUpperCase()}</span>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333; font-size: 11px;">
                ${properties.details}
            </div>
        `;
    }

    // Toggle submarine cable visibility
    function toggleSubmarineCables() {
        cableLayersVisible = !cableLayersVisible;

        // Get all layers and toggle cable-related ones
        const layers = map.getStyle().layers;
        layers.forEach(layer => {
            if (layer.id.startsWith('cable-')) {
                map.setLayoutProperty(
                    layer.id,
                    'visibility',
                    cableLayersVisible ? 'visible' : 'none'
                );
            }
        });

        return cableLayersVisible;
    }

    // Update tracked vessel position (multi-vessel support)
    function updateTrackedVessel(vessel, position, color, history = null, showHistory = false) {
        const mmsi = vessel.MMSI;

        // Remove existing marker and trail for this vessel
        if (trackedVesselMarkers[mmsi]) {
            trackedVesselMarkers[mmsi].remove();
        }
        removeTrail(mmsi);

        // Create tracked marker element with vessel-specific color
        const el = document.createElement('div');
        el.className = `tracked-marker`;
        el.style.cssText = `
            width: 16px;
            height: 16px;
            background: ${color.hex};
            border: 2px solid ${color.hex};
            border-radius: 50%;
            box-shadow: 0 0 20px ${color.hex};
            cursor: pointer;
            transition: all 0.3s;
        `;

        // Create popup with real-time data
        const popup = new mapboxgl.Popup({
            offset: 15,
            closeButton: true,
            closeOnClick: false
        }).setHTML(createTrackedVesselPopup(vessel, position, color));

        // Create marker at real position
        const marker = new mapboxgl.Marker(el)
            .setLngLat([position.lng, position.lat])
            .setPopup(popup)
            .addTo(map);

        // Store marker
        trackedVesselMarkers[mmsi] = marker;

        // Draw history trail if available and should be shown
        if (history && history.length > 0 && showHistory) {
            drawVesselTrail(mmsi, history, position, color);
        }

        // Focus on vessel only if it's the first tracked vessel
        if (Object.keys(trackedVesselMarkers).length === 1) {
            map.flyTo({
                center: [position.lng, position.lat],
                zoom: 7,
                duration: 2000
            });
        }

        console.log(`Tracked vessel marker updated for ${vessel.vessel_name} at [${position.lat}, ${position.lng}]`);
    }

    // Create popup content for tracked vessel with real-time data and route info
    function createTrackedVesselPopup(vessel, position, color) {
        const timestamp = position.timestamp ? new Date(position.timestamp * 1000).toUTCString() : 'N/A';
        const eta = position.eta ? new Date(position.eta * 1000).toUTCString() : 'N/A';

        return `
            <div class="popup-vessel-name" style="color: ${color.hex}">🎯 ${vessel.vessel_name || 'UNKNOWN'}</div>
            <div class="popup-detail">
                <span class="popup-label">Origin:</span>
                <span class="popup-value">${position.departure || 'Unknown'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Destination:</span>
                <span class="popup-value">${position.destination || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">ETA:</span>
                <span class="popup-value" style="font-size: 9px;">${eta}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Position:</span>
                <span class="popup-value">${position.lat.toFixed(4)}°N, ${position.lng.toFixed(4)}°E</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Speed:</span>
                <span class="popup-value">${position.speed || 'N/A'} knots</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Course:</span>
                <span class="popup-value">${position.course || 'N/A'}°</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Heading:</span>
                <span class="popup-value">${position.heading || 'N/A'}°</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Nav Status:</span>
                <span class="popup-value">${position.navstat || 'N/A'}</span>
            </div>
            <div class="popup-detail">
                <span class="popup-label">Last Update:</span>
                <span class="popup-value" style="font-size: 9px;">${timestamp}</span>
            </div>
        `;
    }

    // Draw vessel movement trail on map
    function drawVesselTrail(mmsi, history, currentPosition, color) {
        if (!history || history.length === 0) return;

        // Create line coordinates from history + current position
        const coordinates = [
            ...history.map(point => [point.lng, point.lat]),
            [currentPosition.lng, currentPosition.lat]
        ];

        const trailId = `trail-${mmsi}`;
        const trailGlowId = `trail-glow-${mmsi}`;

        // Remove existing trail if any
        removeTrail(mmsi);

        // Create GeoJSON for the trail
        const trailGeoJSON = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            },
            properties: {
                mmsi: mmsi
            }
        };

        // Add source
        map.addSource(trailId, {
            type: 'geojson',
            data: trailGeoJSON
        });

        // Add glow layer
        map.addLayer({
            id: trailGlowId,
            type: 'line',
            source: trailId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': color.hex,
                'line-width': 6,
                'line-opacity': 0.3,
                'line-blur': 4
            }
        });

        // Add main trail line
        map.addLayer({
            id: trailId,
            type: 'line',
            source: trailId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': color.hex,
                'line-width': 2,
                'line-opacity': 0.8,
                'line-dasharray': [2, 1]
            }
        });

        // Store trail reference
        vesselTrails[mmsi] = { trailId, trailGlowId };

        console.log(`Drew trail for vessel ${mmsi} with ${history.length} points`);
    }

    // Remove vessel trail from map
    function removeTrail(mmsi) {
        if (vesselTrails[mmsi]) {
            const { trailId, trailGlowId } = vesselTrails[mmsi];

            if (map.getLayer(trailId)) {
                map.removeLayer(trailId);
            }
            if (map.getLayer(trailGlowId)) {
                map.removeLayer(trailGlowId);
            }
            if (map.getSource(trailId)) {
                map.removeSource(trailId);
            }

            delete vesselTrails[mmsi];
        }
    }

    // Remove specific tracked vessel
    function removeTrackedVessel(mmsi) {
        // Remove marker
        if (trackedVesselMarkers[mmsi]) {
            trackedVesselMarkers[mmsi].remove();
            delete trackedVesselMarkers[mmsi];
        }

        // Remove trail
        removeTrail(mmsi);

        console.log(`Removed tracked vessel: ${mmsi}`);
    }

    // Clear all tracked vessels
    function clearAllTrackedVessels() {
        // Remove all markers
        Object.keys(trackedVesselMarkers).forEach(mmsi => {
            trackedVesselMarkers[mmsi].remove();
        });
        trackedVesselMarkers = {};

        // Remove all trails
        Object.keys(vesselTrails).forEach(mmsi => {
            removeTrail(mmsi);
        });

        console.log('Cleared all tracked vessels');
    }

    // Get infrastructure data for proximity checking
    function getInfrastructure() {
        return infrastructureMarkers.map(m => m.feature);
    }

    // Public API
    return {
        init,
        plotVessels,
        focusOnVessel,
        clearMarkers,
        toggleInfrastructure,
        toggleSubmarineCables,
        updateTrackedVessel,
        removeTrackedVessel,
        clearAllTrackedVessels,
        getInfrastructure
    };
})();

// Make it globally accessible
window.MapModule = MapModule;
