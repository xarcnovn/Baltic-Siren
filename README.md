# ⚓ BALTIC SIREN

> Real-time threat detection and response platform for monitoring sanctioned vessels and protecting critical Baltic Sea infrastructure

**Built for HackYeah Defence Task '25**

---

## 🎯 The Problem

The Baltic Sea region faces unprecedented maritime security threats:

- **Increasing hybrid attacks**: The number of maritime hybrid attacks has increased significantly in recent years
- **Shadow fleet operations**: Russian-affiliated vessels sabotage critical infrastructure, conduct espionage, and threaten democratic nations
- **Sovereignty gap**: Currently, only US, UK, and Israeli companies provide partial solutions - not ideal in the current geopolitical climate
- **Infrastructure at risk**: Submarine cables, energy pipelines, offshore wind farms, and ports are vulnerable targets

---

## 💡 The Solution

**BALTIC SIREN** provides a sovereign, efficient, and scalable platform for maritime threat detection and response:

✅ **Real-time tracking** of the world's most notorious shadow fleet vessels
✅ **Intelligent alerting** when suspicious activity occurs near critical infrastructure
✅ **Response coordination** - foundation for integrating drones, satellites, and naval assets
✅ **Polish-developed** with potential for European-wide deployment

---

## 🚀 Key Features

### Vessel Intelligence
- **650+ sanctioned vessels** in database with detailed sanctions history
- **Real-time AIS tracking** via Datalastic API integration
- **Comprehensive vessel profiles** including photos, IMO/MMSI, flags, and intelligence reports
- **Multi-vessel tracking** - simultaneously track up to 5 vessels

### Infrastructure Protection
- **Critical infrastructure mapping** - ports, naval bases, energy facilities, pipelines, telecom infrastructure
- **Submarine cable monitoring** - Baltic Pipe, C-Lion1, and more
- **Proximity alerts** - 10km radius monitoring around critical assets
- **Real-time alerting** for suspicious vessel behavior

### Tactical Interface
- **Mapbox dark theme** with cool tactical grid overlay
- **Movement history trails** showing vessel routes
- **Search and filtering** by vessel name, IMO, flag
- **Live statistics** and API usage monitoring

---

## 🎯 Target Market

BALTIC SIREN addresses critical needs for:

### Strategic Organizations
- **Polish strategic companies** (PKN Orlen, Baltic Power, PERN)
- **Polish armed forces & intelligence agencies**
- **Telecommunication companies** (Orange, T-Mobile, operators of submarine cables)
- **Offshore energy & mining** companies

### Regional Security
- **Baltic states** (Poland, Lithuania, Latvia, Estonia, Finland, Sweden)
- **EU maritime security agencies**
- **NATO Baltic operations**
- Currently, only US, UK, and Israeli companies provide maritime threat detection solutions. BALTIC SIREN offers a **sovereign European alternative** critical for strategic autonomy.

---

## 🗺 Roadmap

### ✅ Current Features (v1.0)
- [x] Shadow fleet database (650+ vessels)
- [x] Real-time vessel tracking
- [x] Critical infrastructure mapping
- [x] Proximity alerts
- [x] Multi-vessel tracking
- [x] Tactical map interface

### 🔜 Phase 2: Intelligence Enhancement
- [ ] **AI anomaly detection** - Machine learning to identify suspicious behavior patterns
- [ ] **Advanced alerting** - Predictive alerts, pattern recognition
- [ ] **Historical analysis** - Vessel behavior over time
- [ ] **Network analysis** - Identify vessel networks and connections

### 🔜 Phase 3: Geographic Expansion
- [ ] **North Sea coverage** - Extend to UK, Norway, Netherlands
- [ ] **Mediterranean monitoring** - Critical straits and ports
- [ ] **Global shadow fleet** - Worldwide tracking capability

### 🔜 Phase 4: Response Integration
- [ ] **Satellite integration** - Partner with IgEye, Statim for optical/SAR imagery
- [ ] **Drone coordination** - Integrate with WB Electronics, FlyFocus for aerial surveillance
- [ ] **Navy integration** - Direct alerts to naval operations centers
- [ ] **Automated response** - Trigger surveillance assets automatically

### 🔜 Phase 5: Full Platform
- [ ] **Commercial SaaS** - Multi-tenant platform for enterprises
- [ ] **Mobile applications** - iOS/Android apps
- [ ] **API for partners** - Enable third-party integrations
- [ ] **Threat intelligence sharing** - Network of Baltic Sea stakeholders


## 🛠 Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (no frameworks) |
| **Data Collection** | Python web scraping (BeautifulSoup, Requests) |
| **APIs** | Datalastic Marine Traffic API |
| **Data Sources** | Ukrainian Military Intelligence, OSINT |
| **Maps** | Mapbox GL JS |
| **Hosting** | GitHub Pages (static deployment) |
| **Development tools** | Claude Code |

---

## 📁 Project Structure

```
Baltic_Siren/
├── app/                          # Main web application
│   ├── index.html               # Main application interface
│   ├── css/
│   │   └── tactical.css        # Tactical-themed styling
│   ├── js/
│   │   ├── app.js              # Application initialization
│   │   ├── map.js              # Mapbox integration & vessel plotting
│   │   ├── ui.js               # User interface management
│   │   └── tracker.js          # Real-time vessel tracking
│   └── data/
│       ├── shadow_fleet.json   # Vessel database with positions
│       ├── poland_infrastructure.json
│       └── submarine_cables.json
├── scrappers/                   # Data collection scripts
│   ├── scrape_all_vessels.py  # Vessel data scraper
│   ├── scrape_one_vessel.py   # Single vessel scraper
│   ├── resume_scraping.py     # Resume interrupted scraping
│   └── enrich_positions.js    # Add real-time positions to database
├── docs/                        # Documentation
│   ├── pitch_deck.md
│   └── dev_plan.md
├── shadow_fleet.json           # Main vessel database
└── .env                        # API keys (not in git)
```

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (for data scraping - optional)
- API keys:
  - [Mapbox API key](https://www.mapbox.com/) (free tier available)
  - [Datalastic API key](https://www.datalastic.com/) (20,000 free credits)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Baltic_Siren.git
   cd Baltic_Siren
   ```

2. **Configure API keys**

   Create a `.env` file in the root directory:
   ```env
   DATALASTIC_VESSELS_API=your_datalastic_api_key_here
   MAPBOX_API=your_mapbox_api_key_here
   ```

3. **Update API keys in the code**

   Edit `app/js/app.js`:
   ```javascript
   const DATALASTIC_API_KEY = 'your_datalastic_api_key_here';
   ```

   Edit `app/index.html`:
   ```html
   mapboxgl.accessToken = 'your_mapbox_api_key_here';
   ```

4. **Open the application**
   ```bash
   # Simply open in your browser
   open app/index.html

   # Or use a simple HTTP server
   cd app
   python -m http.server 8080
   # Then visit http://localhost:8080
   ```

---

## 📖 Usage Guide

### Searching for Vessels
1. Use the search bar in the left sidebar
2. Search by vessel name, IMO number, or flag
3. Click on any vessel to view details

### Tracking Vessels in Real-Time
1. Select a vessel from the list or map
2. Click **"📍 TRACK THIS VESSEL"** in the details panel
3. Real-time position updates every 60 minutes (can be truly real-time, but $$$)
4. View movement history trails on the map
5. Stop tracking via the tracking panel

### Viewing Infrastructure
- Toggle **🚢 Vessels** - Show/hide all vessels
- Toggle **🏗️ Infrastructure** - Ports, naval bases, energy facilities
- Toggle **⚡ Cables** - Submarine cables and pipelines

### Understanding Alerts
- **Proximity Alerts** appear when tracked vessels come within 10km of critical infrastructure
- Alert severity levels: Critical, High, Medium, Low
- View all alerts in the notifications panel (🔔)

### Monitoring API Usage
- Click **⚙️** to view API usage statistics
- Track credits used and remaining
- Estimated daily usage based on tracking frequency

---

## 🗄 Data Collection

### Scraping Vessel Data

The project includes Python scrapers to collect vessel data from Ukrainian Military Intelligence:

```bash
# Install dependencies
pip install requests beautifulsoup4

# Scrape all vessels
python scrappers/scrape_all_vessels.py

# Scrape a single vessel
python scrappers/scrape_one_vessel.py

# Resume interrupted scraping
python scrappers/resume_scraping.py
```

### Data Sources
- **Ukrainian Military Intelligence** (war-sanctions.gur.gov.ua) - Sanctioned vessels database
- **Datalastic API** - Real-time AIS positions, vessel movements
- **OSINT** - Infrastructure locations, cable routes

### Enriching Data with Real-Time Positions

```bash
# Add current positions to vessel database
node scrappers/enrich_positions.js
```

---

## 🌐 API Information

### Datalastic Marine Traffic API

- **Base URL**: `https://api.datalastic.com/api/v0`
- **Free tier**: 20,000 credits
- **Refresh rate**: 60 minutes (configurable)
- **Estimated usage**: ~48 credits/day per tracked vessel

**Key Endpoints Used:**
- `/get_vessel_by_mmsi` - Real-time vessel position by MMSI
- `/get_vessel_by_imo` - Real-time vessel position by IMO
- `/stat` - API usage statistics

**Rate Limits:**
- Respect API credit limits
- Adjust `REFRESH_INTERVAL` in `tracker.js` to manage usage

---

*Last updated: 5 October 2025*
