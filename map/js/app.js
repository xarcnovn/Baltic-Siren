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

            // Load vessel data
            await loadVesselData();

            // Plot vessels on map
            MapModule.plotVessels(vesselData);

            // Load vessels into UI
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
            const response = await fetch('data/shadow_fleet.json');

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
