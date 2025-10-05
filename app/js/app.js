// Main Application - Baltic Siren Shadow Fleet Tracker

(function() {
    'use strict';

    let vesselData = [];

    // Initialize application
    async function init() {
        console.log('Baltic Siren - Initializing...');

        try {
            // Initialize modules
            MapModule.init();
            UIModule.init();
            TrackerModule.init();

            // Load vessel data
            await loadVesselData();

            // Load vessels into UI
            UIModule.loadVessels(vesselData);

            // Auto-plot vessels with saved positions on map
            plotVesselsWithPositions();

            console.log('Baltic Siren - Ready');
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize application. Please check console for details.');
        }
    }

    // Load vessel data from JSON file
    async function loadVesselData() {
        try {
            console.log('Loading vessel data...');
            const response = await fetch('data/shadow_fleet.json?t=' + Date.now());

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            vesselData = await response.json();
            console.log(`Loaded ${vesselData.length} vessels`);

            return vesselData;
        } catch (error) {
            console.error('Error loading vessel data:', error);
            throw error;
        }
    }

    // Plot vessels with saved positions
    function plotVesselsWithPositions() {
        // Filter vessels that have position data
        const vesselsWithPositions = vesselData.filter(v => v.position && v.position.lat && v.position.lon);

        console.log(`Plotting ${vesselsWithPositions.length} vessels with saved positions...`);

        // Plot on map
        MapModule.plotVessels(vesselsWithPositions);

        // Update stats
        const plottedVesselsEl = document.getElementById('plotted-vessels');
        if (plottedVesselsEl) {
            plottedVesselsEl.textContent = vesselsWithPositions.length;
        }

        console.log(`✅ Plotted ${vesselsWithPositions.length} vessels on map`);
    }

    // Show error message
    function showError(message) {
        const vesselList = document.getElementById('vessel-list');
        vesselList.innerHTML = `
            <div style="padding: 20px; color: #ff3333; text-align: center;">
                <p>${message}</p>
            </div>
        `;
    }

    // Start application when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
