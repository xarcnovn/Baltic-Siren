// Main Application - Baltic Siren Shadow Fleet Tracker

(function() {
    'use strict';

    let vesselData = [];
    const DATALASTIC_API_KEY = '751f571d-a9ee-48c8-8c62-cd30fa980428';

    // Initialize application
    async function init() {
        console.log('Baltic Siren - Initializing...');

        try {
            // Initialize modules
            MapModule.init();
            UIModule.init();
            TrackerModule.init(DATALASTIC_API_KEY);

            // Load vessel data
            await loadVesselData();

            // Load vessels into UI (but don't plot on map - only tracked vessels appear)
            UIModule.loadVessels(vesselData);

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
