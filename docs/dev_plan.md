# Baltic Siren - Shadow Fleet Tracker MVP Development Plan

## Overview
Build a lightweight web application to track 323 sanctioned vessels in real-time using VesselFinder API and display them on an interactive map.

## Tech Stack
- **Frontend**: HTML5, Vanilla JavaScript (or React for better state management)
- **Map Library**: Leaflet.js or Mapbox GL JS (open-source, better control than iframe embed)
- **Styling**: Tailwind CSS (CDN for quick setup)
- **Dev Server**: Simple HTTP server (Python, Node.js, or Vite)

## Architecture

### 1. Data Processing Layer
- Parse `shadow_fleet.json` (323 vessels with IMO/MMSI)
- Extract vessel identifiers for API calls
- Handle chunked API requests (VesselFinder allows multiple IMO/MMSI per request)

### 2. API Integration Layer
- **Endpoint**: `https://api.vesselfinder.com/vessels`
- **Authentication**: API key via `userkey` parameter
- **Request Strategy**:
  - Batch vessels into groups (max ~50 per request to avoid URL length limits)
  - Parameters: `?userkey={KEY}&imo={IMO_LIST}&mmsi={MMSI_LIST}&format=json`
  - Optional: `interval` parameter to control position freshness
- **Response Handling**:
  - Parse AIS data (lat/lon, course, speed, heading)
  - Handle missing/offline vessels gracefully
  - Implement retry logic for failed requests

### 3. Map Visualization Layer
- Initialize map centered on Baltic/Black Sea region
- Plot vessel positions as markers with:
  - Color coding by vessel type or sanction status
  - Popup showing: name, IMO, MMSI, flag, type, last position time
  - Ship icon with rotation based on heading
- Auto-refresh positions (configurable interval, e.g., 5-10 minutes)

### 4. User Interface
- **Map View**: Full-screen interactive map
- **Sidebar/Panel**:
  - Vessel list with search/filter
  - Real-time status indicators (online/offline)
  - Sanction details on click
- **Controls**:
  - Refresh button
  - Auto-refresh toggle
  - Filter by flag/vessel type/sanction status

## Development Phases

### Phase 1: Setup & Data Processing
1. Create project structure
2. Set up local dev environment
3. Load and parse `shadow_fleet.json`
4. Extract IMO/MMSI arrays

### Phase 2: API Integration
1. Implement VesselFinder API client
2. Handle batch requests (323 vessels → ~7 API calls)
3. Parse and normalize response data
4. Error handling and rate limiting

### Phase 3: Map Implementation
1. Initialize map (Leaflet/Mapbox)
2. Plot vessel markers with custom icons
3. Implement popups with vessel details
4. Add vessel clustering for better performance

### Phase 4: UI Polish
1. Add search and filter functionality
2. Implement auto-refresh mechanism
3. Add loading states and error messages
4. Responsive design for mobile/tablet

### Phase 5: Testing & Optimization
1. Test with API rate limits
2. Optimize marker rendering performance
3. Handle edge cases (missing data, API failures)
4. Add caching layer to reduce API calls

## File Structure
```
baltic-siren/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js (main application)
│   ├── api.js (VesselFinder API client)
│   ├── map.js (map initialization & rendering)
│   └── utils.js (helpers)
├── data/
│   └── shadow_fleet.json
├── config.js (API key, settings)
└── package.json (if using build tools)
```

## API Key Requirement
- **Action Required**: Obtain VesselFinder API key from https://api.vesselfinder.com
- Store securely in `config.js` or `.env` file (gitignored)

## Data Structure
Each vessel in `shadow_fleet.json` contains:
- `vessel_name`: Ship name
- `IMO`: International Maritime Organization number (primary identifier)
- `MMSI`: Maritime Mobile Service Identity number (secondary identifier)
- `flag`: Country of registration
- `vessel_type`: Type of vessel (e.g., "Oil Products Tanker")
- `category`: Sanction category
- `vessel_photo_url`: Photo of the vessel
- `sanctions`: Array of sanction descriptions
- `vessel_information`: Detailed intelligence about the vessel

## VesselFinder API Response Structure
Expected response includes:
- **AIS Data**: coordinates (lat/lon), course, speed, heading, timestamp
- **Vessel Details**: name, IMO, MMSI, flag, type, dimensions
- **Voyage Data** (optional): last port, departure time, destination

## Success Criteria
✅ Display all 323 vessels on interactive map
✅ Real-time position updates via VesselFinder API
✅ Vessel details on click (name, IMO, sanctions)
✅ Search/filter functionality
✅ Auto-refresh every 5-10 minutes
✅ Responsive design, runs locally

## Technical Considerations

### Performance
- Implement marker clustering for 300+ vessels
- Lazy load vessel details
- Cache API responses (5-10 min TTL)
- Debounce search/filter operations

### Error Handling
- Graceful degradation when API is unavailable
- Display offline vessels with last known position
- User-friendly error messages
- Retry mechanism with exponential backoff

### Security
- Never commit API key to version control
- Use environment variables or config file (.gitignored)
- Implement rate limiting on client side
- Validate API responses before rendering

## Future Enhancements (Post-MVP)
- Historical track playback
- Proximity alerts for critical infrastructure
- Export vessel data to CSV/JSON
- Dark mode
- Multi-language support
- Advanced analytics dashboard
- WebSocket integration for real-time updates
- Backend proxy to secure API key

## Next Steps
1. Set up project structure
2. Create basic HTML/CSS layout with map
3. Implement VesselFinder API integration
4. Connect data to map visualization
5. Add interactivity and filters
