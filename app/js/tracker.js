// Tracker Module - Real-time multi-vessel tracking with Datalastic API

const TrackerModule = (function() {
    const API_BASE_URL = '/api'; // Netlify serverless functions
    const REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
    const PROXIMITY_RADIUS_KM = 10; // Alert radius for critical infrastructure
    const MAX_TRACKED_VESSELS = 5; // Maximum simultaneous tracked vessels

    const VESSEL_COLORS = [
        { name: 'orange', hex: '#ffaa00', class: 'tracked-marker-orange' },
        { name: 'cyan', hex: '#06b6d4', class: 'tracked-marker-cyan' },
        { name: 'magenta', hex: '#ec4899', class: 'tracked-marker-magenta' },
        { name: 'yellow', hex: '#eab308', class: 'tracked-marker-yellow' },
        { name: 'white', hex: '#ffffff', class: 'tracked-marker-white' }
    ];

    let trackedVessels = []; // Array of tracked vessel objects
    let countdownInterval = null;
    let apiStats = {
        totalCredits: 20000,
        usedCredits: 0,
        remainingCredits: 20000,
        lastFetched: null
    };

    // Initialize tracker
    function init() {
        console.log('Tracker Module initialized');
        setupEventListeners();
        fetchApiUsage(); // Get initial API usage stats
    }

    // Setup event listeners
    function setupEventListeners() {
        // Settings icon click
        const settingsIcon = document.getElementById('settings-icon');
        if (settingsIcon) {
            settingsIcon.addEventListener('click', toggleSettingsPanel);
        }

        // Close settings button
        const closeSettings = document.getElementById('close-settings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                document.getElementById('settings-panel').style.display = 'none';
            });
        }

        // Refresh usage button
        const refreshUsage = document.getElementById('refresh-usage');
        if (refreshUsage) {
            refreshUsage.addEventListener('click', fetchApiUsage);
        }
    }

    // Toggle settings panel
    function toggleSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Fetch API usage statistics
    async function fetchApiUsage() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-usage`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Update stats (API returns used credits)
            apiStats.usedCredits = data.data.requests_made || 0;
            apiStats.remainingCredits = data.data.requests_remaining || (apiStats.totalCredits - apiStats.usedCredits);
            apiStats.lastFetched = new Date();

            updateUsageDisplay();
            console.log('API usage fetched:', apiStats);
        } catch (error) {
            console.error('Error fetching API usage:', error);
            updateUsageDisplay('Error loading usage data');
        }
    }

    // Update usage display in settings panel
    function updateUsageDisplay(errorMsg = null) {
        const usedEl = document.getElementById('credits-used');
        const remainingEl = document.getElementById('credits-remaining');
        const totalEl = document.getElementById('credits-total');
        const lastUpdatedEl = document.getElementById('usage-last-updated');

        if (errorMsg) {
            if (usedEl) usedEl.textContent = '--';
            if (remainingEl) remainingEl.textContent = '--';
            if (lastUpdatedEl) lastUpdatedEl.textContent = errorMsg;
            return;
        }

        if (usedEl) usedEl.textContent = apiStats.usedCredits.toLocaleString();
        if (remainingEl) remainingEl.textContent = apiStats.remainingCredits.toLocaleString();
        if (totalEl) totalEl.textContent = apiStats.totalCredits.toLocaleString();

        if (lastUpdatedEl && apiStats.lastFetched) {
            const time = apiStats.lastFetched.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            lastUpdatedEl.textContent = `Last updated: ${time}`;
        }
    }

    // Get available color for new vessel
    function getAvailableColor() {
        const usedColors = trackedVessels.map(v => v.colorIndex);
        for (let i = 0; i < VESSEL_COLORS.length; i++) {
            if (!usedColors.includes(i)) {
                return i;
            }
        }
        return 0; // Fallback to first color
    }

    // Start tracking a vessel
    async function startTracking(vessel) {
        // Check if already tracking this vessel
        const existing = trackedVessels.find(v => v.vessel.MMSI === vessel.MMSI);
        if (existing) {
            console.log(`Vessel ${vessel.vessel_name} is already being tracked`);
            return;
        }

        // Check max vessels limit
        if (trackedVessels.length >= MAX_TRACKED_VESSELS) {
            alert(`Maximum ${MAX_TRACKED_VESSELS} vessels can be tracked simultaneously. Please stop tracking another vessel first.`);
            return;
        }

        const colorIndex = getAvailableColor();
        const color = VESSEL_COLORS[colorIndex];

        const trackedVessel = {
            vessel: vessel,
            colorIndex: colorIndex,
            color: color,
            interval: null,
            lastUpdate: null,
            nextUpdate: null,
            currentPosition: null,
            history: null,
            showHistory: false
        };

        trackedVessels.push(trackedVessel);

        console.log(`Starting tracking for vessel: ${vessel.vessel_name} (MMSI: ${vessel.MMSI}) - Color: ${color.name}`);

        // Initial position fetch
        await updateVesselPosition(trackedVessel);

        // Set up periodic updates (every 60 minutes)
        trackedVessel.interval = setInterval(() => updateVesselPosition(trackedVessel), REFRESH_INTERVAL);

        // Start countdown timer
        if (!countdownInterval) {
            startCountdown();
        }

        // Update UI
        updateTrackingUI();

        // Update stats in UI module
        if (window.UIModule && window.UIModule.updateStats) {
            window.UIModule.updateStats();
        }
    }

    // Stop tracking a specific vessel
    function stopTracking(mmsi) {
        const index = trackedVessels.findIndex(v => v.vessel.MMSI === mmsi);
        if (index === -1) return;

        const trackedVessel = trackedVessels[index];

        // Clear interval
        if (trackedVessel.interval) {
            clearInterval(trackedVessel.interval);
        }

        // Remove from map
        if (window.MapModule) {
            window.MapModule.removeTrackedVessel(mmsi);
        }

        // Remove from array
        trackedVessels.splice(index, 1);

        console.log(`Stopped tracking vessel: ${trackedVessel.vessel.vessel_name}`);

        // Stop countdown if no vessels being tracked
        if (trackedVessels.length === 0 && countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        updateTrackingUI();
        clearProximityAlerts();

        // Update stats in UI module
        if (window.UIModule && window.UIModule.updateStats) {
            window.UIModule.updateStats();
        }
    }

    // Stop all tracking
    function stopAllTracking() {
        trackedVessels.forEach(tv => {
            if (tv.interval) {
                clearInterval(tv.interval);
            }
        });

        if (window.MapModule) {
            window.MapModule.clearAllTrackedVessels();
        }

        trackedVessels = [];

        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        updateTrackingUI();
        clearProximityAlerts();

        // Update stats in UI module
        if (window.UIModule && window.UIModule.updateStats) {
            window.UIModule.updateStats();
        }
    }

    // Update vessel position from API (with IMO fallback)
    async function updateVesselPosition(trackedVessel) {
        if (!trackedVessel) {
            console.error('Cannot update position: vessel missing');
            return;
        }

        const mmsi = trackedVessel.vessel.MMSI;
        const imo = trackedVessel.vessel.IMO;

        try {
            let data = null;
            let usedMethod = 'MMSI';

            // First attempt: Try with MMSI
            if (mmsi) {
                const response = await fetch(`${API_BASE_URL}/get-vessel?mmsi=${mmsi}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                data = await response.json();
            }

            // Second attempt: If no data and vessel has IMO, try with IMO
            if ((!data || !data.data) && imo) {
                console.log(`No data for MMSI ${mmsi}, trying IMO ${imo}...`);
                const response = await fetch(`${API_BASE_URL}/get-vessel?imo=${imo}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                data = await response.json();
                usedMethod = 'IMO';
            }

            if (data && data.data) {
                const vesselData = data.data;

                // Update position
                const position = {
                    lat: vesselData.lat,
                    lng: vesselData.lon,
                    speed: vesselData.speed,
                    course: vesselData.course,
                    heading: vesselData.heading,
                    destination: vesselData.destination,
                    eta: vesselData.eta,
                    timestamp: vesselData.timestamp,
                    departure: vesselData.departure || 'Unknown',
                    navstat: vesselData.navstat || 'Unknown'
                };

                trackedVessel.currentPosition = position;
                trackedVessel.lastUpdate = new Date();
                trackedVessel.nextUpdate = new Date(trackedVessel.lastUpdate.getTime() + REFRESH_INTERVAL);

                // Update on map
                if (window.MapModule) {
                    window.MapModule.updateTrackedVessel(
                        trackedVessel.vessel,
                        position,
                        trackedVessel.color,
                        trackedVessel.history,
                        trackedVessel.showHistory
                    );
                }

                // Check proximity to infrastructure
                checkProximity(trackedVessel, position);

                // Refresh API usage stats
                await fetchApiUsage();

                console.log(`Position updated for ${trackedVessel.vessel.vessel_name} using ${usedMethod}:`, position);
            } else {
                console.warn(`No data returned from API for vessel: MMSI=${mmsi}, IMO=${imo}`);
                showTrackingError(trackedVessel, 'No position data available (tried MMSI and IMO)');
            }
        } catch (error) {
            console.error('Error updating vessel position:', error);
            showTrackingError(trackedVessel, `Error: ${error.message}`);
        }
    }

    // Fetch vessel history (with IMO fallback)
    async function fetchVesselHistory(trackedVessel, days = 7) {
        if (!trackedVessel) {
            console.error('Cannot fetch history: vessel missing');
            return;
        }

        const mmsi = trackedVessel.vessel.MMSI;
        const imo = trackedVessel.vessel.IMO;

        try {
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const formatDate = (date) => {
                return date.toISOString().split('T')[0]; // YYYY-MM-DD
            };

            let data = null;
            let usedMethod = 'MMSI';

            // First attempt: Try with MMSI
            if (mmsi) {
                const response = await fetch(
                    `${API_BASE_URL}/get-vessel?endpoint=history&mmsi=${mmsi}&date_from=${formatDate(startDate)}&date_to=${formatDate(endDate)}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                data = await response.json();
            }

            // Second attempt: If no data and vessel has IMO, try with IMO
            if ((!data || !data.data || (Array.isArray(data.data) && data.data.length === 0)) && imo) {
                console.log(`No history for MMSI ${mmsi}, trying IMO ${imo}...`);
                const response = await fetch(
                    `${API_BASE_URL}/get-vessel?endpoint=history&imo=${imo}&date_from=${formatDate(startDate)}&date_to=${formatDate(endDate)}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                data = await response.json();
                usedMethod = 'IMO';
            }

            if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
                // Process history data into coordinates array
                const historyPoints = data.data.map(point => ({
                    lat: point.lat,
                    lng: point.lon,
                    timestamp: point.timestamp,
                    speed: point.speed
                })).filter(p => p.lat && p.lng); // Remove invalid points

                trackedVessel.history = historyPoints;
                trackedVessel.showHistory = true;

                // Update on map
                if (window.MapModule && trackedVessel.currentPosition) {
                    window.MapModule.updateTrackedVessel(
                        trackedVessel.vessel,
                        trackedVessel.currentPosition,
                        trackedVessel.color,
                        trackedVessel.history,
                        trackedVessel.showHistory
                    );
                }

                // Refresh API usage
                await fetchApiUsage();

                console.log(`Fetched ${historyPoints.length} history points for ${trackedVessel.vessel.vessel_name} using ${usedMethod}`);
            } else {
                console.warn(`No history data returned for vessel: MMSI=${mmsi}, IMO=${imo}`);
            }
        } catch (error) {
            console.error('Error fetching vessel history:', error);
        }
    }

    // Toggle history trail visibility
    function toggleHistory(mmsi) {
        const trackedVessel = trackedVessels.find(v => v.vessel.MMSI === mmsi);
        if (!trackedVessel) return;

        if (!trackedVessel.history) {
            // Fetch history if not already loaded
            fetchVesselHistory(trackedVessel);
        } else {
            // Toggle visibility
            trackedVessel.showHistory = !trackedVessel.showHistory;

            if (window.MapModule && trackedVessel.currentPosition) {
                window.MapModule.updateTrackedVessel(
                    trackedVessel.vessel,
                    trackedVessel.currentPosition,
                    trackedVessel.color,
                    trackedVessel.history,
                    trackedVessel.showHistory
                );
            }
        }
    }

    // Start countdown timer for next update
    function startCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            trackedVessels.forEach(tv => {
                if (!tv.nextUpdate) return;

                const now = new Date();
                const remaining = tv.nextUpdate - now;

                if (remaining <= 0) {
                    // Will update on next interval
                }
            });

            updateTrackingUI();
        }, 1000);
    }

    // Check proximity to critical infrastructure
    function checkProximity(trackedVessel, position) {
        // Get infrastructure data from map module
        if (!window.MapModule || !window.MapModule.getInfrastructure) {
            return;
        }

        const infrastructure = window.MapModule.getInfrastructure();
        const alerts = [];

        infrastructure.forEach(infra => {
            const infraPos = infra.geometry.coordinates; // [lng, lat]
            const distance = calculateDistance(
                position.lat,
                position.lng,
                infraPos[1],
                infraPos[0]
            );

            if (distance <= PROXIMITY_RADIUS_KM) {
                alerts.push({
                    vesselName: trackedVessel.vessel.vessel_name,
                    infrastructure: infra.properties.name,
                    category: infra.properties.category,
                    distance: distance.toFixed(2),
                    criticality: infra.properties.criticality
                });
            }
        });

        if (alerts.length > 0) {
            showProximityAlerts(alerts);
        }
    }

    // Calculate distance between two coordinates (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Show proximity alerts
    function showProximityAlerts(alerts) {
        const alertPanel = document.getElementById('proximity-alerts');
        if (!alertPanel) return;

        const criticalityColors = {
            'critical': '#ff0000',
            'high': '#ff6600',
            'medium': '#ffaa00',
            'low': '#00ff00'
        };

        const alertsHtml = alerts.map(alert => `
            <div class="proximity-alert" style="border-left-color: ${criticalityColors[alert.criticality] || '#ffaa00'}">
                <div class="alert-title">⚠️ ${alert.vesselName}</div>
                <div class="alert-subtitle">${alert.infrastructure}</div>
                <div class="alert-details">
                    <span class="alert-label">Distance:</span> ${alert.distance} km
                </div>
                <div class="alert-details">
                    <span class="alert-label">Category:</span> ${alert.category.toUpperCase()}
                </div>
                <div class="alert-details">
                    <span class="alert-label">Criticality:</span>
                    <span style="color: ${criticalityColors[alert.criticality]}">${alert.criticality.toUpperCase()}</span>
                </div>
            </div>
        `).join('');

        alertPanel.innerHTML = alertsHtml;

        const alertPanelContainer = document.getElementById('proximity-alerts-panel');
        if (alertPanelContainer) {
            alertPanelContainer.style.display = 'block';
        }
    }

    // Clear proximity alerts
    function clearProximityAlerts() {
        const alertPanel = document.getElementById('proximity-alerts');
        if (alertPanel) {
            alertPanel.innerHTML = '';
        }

        const alertPanelContainer = document.getElementById('proximity-alerts-panel');
        if (alertPanelContainer && trackedVessels.length === 0) {
            alertPanelContainer.style.display = 'none';
        }
    }

    // Show tracking error
    function showTrackingError(trackedVessel, message) {
        console.error(`Tracking error for ${trackedVessel.vessel.vessel_name}: ${message}`);
    }

    // Update tracking UI
    function updateTrackingUI() {
        const trackingPanel = document.getElementById('tracking-panel');

        if (!trackingPanel) return;

        if (trackedVessels.length > 0) {
            trackingPanel.style.display = 'block';

            const trackedList = trackedVessels.map(tv => {
                const now = new Date();
                const remaining = tv.nextUpdate ? tv.nextUpdate - now : 0;
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                const countdown = remaining > 0 ? `${minutes}m ${seconds}s` : 'Updating...';

                return `
                    <div class="tracked-vessel-item" style="border-left-color: ${tv.color.hex}">
                        <div class="tracked-vessel-name" style="color: ${tv.color.hex}">${tv.vessel.vessel_name}</div>
                        <div class="tracked-vessel-meta">
                            <span>Next update: ${countdown}</span>
                        </div>
                        <div class="tracked-vessel-actions">
                            <button class="tracking-action-btn" onclick="TrackerModule.toggleHistory('${tv.vessel.MMSI}')">
                                ${tv.showHistory ? '👁️ Hide' : '📍 Show'} Trail
                            </button>
                            <button class="tracking-action-btn stop-btn-small" onclick="TrackerModule.stopTracking('${tv.vessel.MMSI}')">
                                ⏹ Stop
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            trackingPanel.innerHTML = `
                <div class="panel-header">
                    <span>● TRACKING (${trackedVessels.length}/${MAX_TRACKED_VESSELS})</span>
                </div>
                <div class="panel-content">
                    ${trackedList}
                    ${trackedVessels.length > 0 ? `
                        <button class="tracking-btn stop-btn" onclick="TrackerModule.stopAllTracking()" style="margin-top: 10px;">
                            ⏹ STOP ALL TRACKING
                        </button>
                    ` : ''}
                </div>
            `;
        } else {
            trackingPanel.style.display = 'none';
        }
    }

    // Public API
    return {
        init,
        startTracking,
        stopTracking,
        stopAllTracking,
        toggleHistory,
        fetchVesselHistory,
        getTrackedVessels: () => trackedVessels,
        getApiStats: () => apiStats,
        fetchApiUsage
    };
})();

// Make it globally accessible
window.TrackerModule = TrackerModule;
