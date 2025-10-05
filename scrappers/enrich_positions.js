// Position Enrichment Script - Fetches and saves vessel positions to shadow_fleet.json
// Run with: node enrich_positions.js
// Requires .env file with DATALASTIC_VESSELS_API set

const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.DATALASTIC_VESSELS_API;
const API_BASE = 'https://api.datalastic.com/api/v0';

if (!API_KEY) {
    console.error('❌ Error: DATALASTIC_VESSELS_API environment variable not set');
    console.error('Please create a .env file with DATALASTIC_VESSELS_API=your_api_key');
    process.exit(1);
}

let stats = {
    total: 0,
    success: 0,
    failed: 0,
    creditsUsed: 0
};

async function fetchVesselPosition(vessel) {
    const mmsi = vessel.MMSI;
    const imo = vessel.IMO;
    let data = null;
    let attempts = 0;

    try {
        // Try MMSI first
        if (mmsi) {
            attempts++;
            const response = await fetch(`${API_BASE}/vessel?api-key=${API_KEY}&mmsi=${mmsi}`);
            if (response.ok) {
                data = await response.json();
                if (data && data.data) {
                    stats.creditsUsed += attempts;
                    return {
                        success: true,
                        position: {
                            lat: data.data.lat,
                            lon: data.data.lon
                        },
                        speed: data.data.speed,
                        course: data.data.course,
                        destination: data.data.destination,
                        navStatus: data.data.navigation_status,
                        lastUpdate: data.data.last_position_UTC
                    };
                }
            }
        }

        // Try IMO if MMSI failed
        if ((!data || !data.data) && imo) {
            attempts++;
            const response = await fetch(`${API_BASE}/vessel?api-key=${API_KEY}&imo=${imo}`);
            if (response.ok) {
                data = await response.json();
                if (data && data.data) {
                    stats.creditsUsed += attempts;
                    return {
                        success: true,
                        position: {
                            lat: data.data.lat,
                            lon: data.data.lon
                        },
                        speed: data.data.speed,
                        course: data.data.course,
                        destination: data.data.destination,
                        navStatus: data.data.navigation_status,
                        lastUpdate: data.data.last_position_UTC
                    };
                }
            }
        }

        stats.creditsUsed += attempts;
        return { success: false };
    } catch (error) {
        stats.creditsUsed += attempts;
        return { success: false, error: error.message };
    }
}

async function enrichPositions() {
    console.log('\n🚢 SHADOW FLEET POSITION ENRICHMENT\n');
    console.log('═'.repeat(80));

    // Load vessels
    const vesselsData = fs.readFileSync('./shadow_fleet.json', 'utf8');
    const vessels = JSON.parse(vesselsData);

    console.log(`\nEnriching ${vessels.length} vessels with position data...\n`);

    const enrichedVessels = [];

    for (let i = 0; i < vessels.length; i++) {
        const vessel = vessels[i];
        stats.total++;

        process.stdout.write(`\r[${i + 1}/${vessels.length}] ${vessel.vessel_name.padEnd(35)}...`);

        const positionData = await fetchVesselPosition(vessel);

        if (positionData.success) {
            stats.success++;
            enrichedVessels.push({
                ...vessel,
                position: positionData.position,
                speed: positionData.speed,
                course: positionData.course,
                destination: positionData.destination,
                navStatus: positionData.navStatus,
                lastUpdate: positionData.lastUpdate
            });
        } else {
            stats.failed++;
            enrichedVessels.push({
                ...vessel,
                position: null,
                speed: null,
                course: null,
                destination: null,
                navStatus: null,
                lastUpdate: null
            });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Save enriched data
    console.log('\n\n' + '═'.repeat(80));
    console.log('\n📊 ENRICHMENT RESULTS\n');
    console.log(`Total Vessels:    ${stats.total}`);
    console.log(`✅ With Position: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
    console.log(`❌ No Position:   ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
    console.log(`💳 Credits Used:  ~${stats.creditsUsed}`);
    console.log('\n' + '═'.repeat(80));

    fs.writeFileSync('./shadow_fleet.json', JSON.stringify(enrichedVessels, null, 2));
    console.log('\n✅ Enriched data saved to shadow_fleet.json');

    // Also copy to map/data directory
    fs.writeFileSync('./map/data/shadow_fleet.json', JSON.stringify(enrichedVessels, null, 2));
    console.log('✅ Enriched data copied to map/data/shadow_fleet.json\n');
}

enrichPositions().catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
});
