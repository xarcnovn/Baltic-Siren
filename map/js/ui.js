// UI Module - Handles user interface interactions and updates

const UIModule = (function() {
    let allVessels = [];
    let filteredVessels = [];
    let selectedFilter = 'all';
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

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update filter
                selectedFilter = e.target.dataset.filter;
                filterVessels();
            });
        });
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

    // Filter vessels based on search and filter
    function filterVessels() {
        filteredVessels = allVessels.filter(vessel => {
            // Search filter
            const matchesSearch = searchQuery === '' ||
                vessel.vessel_name?.toLowerCase().includes(searchQuery) ||
                vessel.IMO?.toString().includes(searchQuery) ||
                vessel.flag?.toLowerCase().includes(searchQuery);

            // Type filter
            let matchesType = true;
            if (selectedFilter !== 'all') {
                const vesselType = vessel.vessel_type?.toLowerCase() || '';
                if (selectedFilter === 'tanker') {
                    matchesType = vesselType.includes('tanker');
                } else if (selectedFilter === 'cargo') {
                    matchesType = vesselType.includes('cargo');
                }
            }

            return matchesSearch && matchesType;
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

        const sanctionsHtml = vessel.sanctions && vessel.sanctions.length > 0
            ? `<ul class="sanctions-list">${vessel.sanctions.map(s => `<li>${s}</li>`).join('')}</ul>`
            : '<p style="color: #00aa00;">No specific sanctions listed</p>';

        const vesselInfo = vessel.vessel_information || 'No additional intelligence available.';

        detailsPanel.innerHTML = `
            <div class="detail-section">
                <div class="detail-title">${vessel.vessel_name || 'UNKNOWN VESSEL'}</div>
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
    }

    // Update statistics
    function updateStats() {
        document.getElementById('total-vessels').textContent = allVessels.length;
        document.getElementById('tracked-vessels').textContent = filteredVessels.length;

        // Count high-risk vessels (those with sanctions)
        const highRisk = allVessels.filter(v => v.sanctions && v.sanctions.length > 0).length;
        document.getElementById('high-risk-vessels').textContent = highRisk;
    }

    // Public API
    return {
        init,
        loadVessels,
        showVesselDetails,
        selectVesselInList
    };
})();

// Make it globally accessible
window.UIModule = UIModule;
