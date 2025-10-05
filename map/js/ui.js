// UI Module - Handles user interface interactions and updates

const UIModule = (function() {
    let allVessels = [];
    let filteredVessels = [];
    let searchQuery = '';

    // Initialize UI
    function init() {
        setupEventListeners();
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
        console.log('UI Module initialized');
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            filterVessels();
        });

        // Vessels toggle button
        const vesselsToggle = document.getElementById('vessels-toggle');
        if (vesselsToggle) {
            vesselsToggle.addEventListener('click', () => {
                if (window.MapModule && typeof window.MapModule.toggleVessels === 'function') {
                    const isVisible = window.MapModule.toggleVessels();
                    if (isVisible) {
                        vesselsToggle.classList.add('active');
                    } else {
                        vesselsToggle.classList.remove('active');
                    }
                }
            });
        }

        // Infrastructure toggle button
        const infrastructureToggle = document.getElementById('infrastructure-toggle');
        if (infrastructureToggle) {
            infrastructureToggle.addEventListener('click', () => {
                if (window.MapModule && typeof window.MapModule.toggleInfrastructure === 'function') {
                    const isVisible = window.MapModule.toggleInfrastructure();
                    if (isVisible) {
                        infrastructureToggle.classList.add('active');
                    } else {
                        infrastructureToggle.classList.remove('active');
                    }
                }
            });
        }

        // Submarine cables toggle button
        const cablesToggle = document.getElementById('cables-toggle');
        if (cablesToggle) {
            cablesToggle.addEventListener('click', () => {
                if (window.MapModule && typeof window.MapModule.toggleSubmarineCables === 'function') {
                    const isVisible = window.MapModule.toggleSubmarineCables();
                    if (isVisible) {
                        cablesToggle.classList.add('active');
                    } else {
                        cablesToggle.classList.remove('active');
                    }
                }
            });
        }
    }

    // Update timestamp
    function updateTimestamp() {
        const now = new Date();
        const formatted = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        document.getElementById('timestamp').textContent = formatted;
    }

    // Load vessels into UI
    function loadVessels(vessels) {
        allVessels = vessels;
        filteredVessels = vessels;
        updateVesselList();
        updateStats();
    }

    // Filter vessels based on search
    function filterVessels() {
        filteredVessels = allVessels.filter(vessel => {
            // Search filter
            return searchQuery === '' ||
                vessel.vessel_name?.toLowerCase().includes(searchQuery) ||
                vessel.IMO?.toString().includes(searchQuery) ||
                vessel.flag?.toLowerCase().includes(searchQuery);
        });

        updateVesselList();
        updateStats();
    }

    // Update vessel list display
    function updateVesselList() {
        const vesselList = document.getElementById('vessel-list');
        const vesselCount = document.getElementById('vessel-count');

        vesselCount.textContent = filteredVessels.length;

        if (filteredVessels.length === 0) {
            vesselList.innerHTML = '<div class="loading">No vessels found</div>';
            return;
        }

        vesselList.innerHTML = filteredVessels.map(vessel => `
            <div class="vessel-item" data-imo="${vessel.IMO}">
                <div class="vessel-name">${vessel.vessel_name || 'UNKNOWN'}</div>
                <div class="vessel-meta">
                    <span class="vessel-imo">IMO: ${vessel.IMO || 'N/A'}</span>
                    <span class="vessel-flag">${vessel.flag || 'N/A'}</span>
                </div>
                <div class="vessel-type">${vessel.vessel_type || 'Unknown Type'}</div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.vessel-item').forEach(item => {
            item.addEventListener('click', () => {
                const imo = item.dataset.imo;
                const vessel = allVessels.find(v => v.IMO === imo);
                if (vessel) {
                    selectVesselInList(imo);
                    showVesselDetails(vessel);

                    // Focus on map
                    if (window.MapModule) {
                        window.MapModule.focusOnVessel(vessel);
                    }
                }
            });
        });
    }

    // Select vessel in list
    function selectVesselInList(imo) {
        document.querySelectorAll('.vessel-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.imo === imo) {
                item.classList.add('selected');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Show vessel details in sidebar
    function showVesselDetails(vessel) {
        const detailsPanel = document.getElementById('vessel-details');

        // Store current vessel data for tracking
        detailsPanel.dataset.currentVessel = JSON.stringify(vessel);

        const sanctionsHtml = vessel.sanctions && vessel.sanctions.length > 0
            ? `<ul class="sanctions-list">${vessel.sanctions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p style="color: #00aa00;">No specific sanctions listed</p>';

        const vesselInfo = vessel.vessel_information || 'No additional intelligence available.';

        const photoHtml = vessel.vessel_photo_url
            ? `<img src="${vessel.vessel_photo_url}" alt="${vessel.vessel_name}" class="vessel-detail-photo" onerror="this.style.display='none'">`
            : '';

        detailsPanel.innerHTML = `
            <div class="detail-section">
                <div class="detail-title">${vessel.vessel_name || 'UNKNOWN VESSEL'}</div>
                ${photoHtml}
                <div class="detail-row">
                    <span class="detail-label">IMO:</span>
                    <span class="detail-value">${vessel.IMO || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">MMSI:</span>
                    <span class="detail-value">${vessel.MMSI || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Flag:</span>
                    <span class="detail-value">${vessel.flag || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${vessel.vessel_type || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${vessel.category || 'N/A'}</span>
                </div>
                <button class="tracking-btn" id="start-tracking-btn">📍 TRACK THIS VESSEL</button>
            </div>

            <div class="detail-section">
                <div class="detail-title">Sanctions</div>
                ${sanctionsHtml}
            </div>

            <div class="detail-section">
                <div class="detail-title">Intelligence Report</div>
                <div class="vessel-info-text">${vesselInfo}</div>
            </div>
        `;

        selectVesselInList(vessel.IMO);

        // Re-attach tracking button event listener
        const trackBtn = document.getElementById('start-tracking-btn');
        if (trackBtn && window.TrackerModule) {
            trackBtn.addEventListener('click', () => {
                window.TrackerModule.startTracking(vessel);
            });
        }
    }

    // Update statistics
    function updateStats() {
        document.getElementById('total-vessels').textContent = allVessels.length;

        // Get actual tracked vessels count from TrackerModule
        const trackedCount = window.TrackerModule ? window.TrackerModule.getTrackedVessels().length : 0;
        document.getElementById('tracked-vessels').textContent = trackedCount;

        // Note: 'plotted-vessels' count is updated by plotVesselsWithPositions() in app.js
    }

    // Public API
    return {
        init,
        loadVessels,
        showVesselDetails,
        selectVesselInList,
        updateStats
    };
})();

// Make it globally accessible
window.UIModule = UIModule;
