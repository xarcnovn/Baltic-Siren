<script type="text/javascript">
    // Map appearance
    var width="100%";         // width in pixels or percentage
    var height="300";         // height in pixels
    var latitude="0.00";      // center latitude (decimal degrees)
    var longitude="0.00";     // center longitude (decimal degrees)
    var zoom="3";             // initial zoom (between 3 and 18)
    var names=false;          // always show ship names (defaults to false)

    // Single ship tracking
    var mmsi="123456789";     // display latest position (by MMSI)
    var imo="1234567";        // display latest position (by IMO, overrides MMSI)
    var show_track=false;     // display track line (last 24 hours)

    // Fleet tracking
    var fleet="e48ab3d80a0e2a9bf28930f2dd08800c"; // your personal Fleet key (displayed in your User Profile)
    var fleet_name="Carnival"; // display particular fleet from your fleet list
    var fleet_timespan="1440"; // maximum age in minutes of the displayed ship positions
</script>
<script type="text/javascript" src="https://www.vesselfinder.com/aismap.js"></script>

Example 1: Map with all vessels in a specific area

<script type="text/javascript">
    // Map appearance
    var width="100%";         // width in pixels or percentage
    var height="300";         // height in pixels
    var latitude="36.00";     // center latitude (decimal degrees)
    var longitude="-5.40";    // center longitude (decimal degrees)
    var zoom="8";             // initial zoom (between 3 and 18)
</script>
<script type="text/javascript" src="https://www.vesselfinder.com/aismap.js"></script>


Example 2: Tracking a single ship

<script type="text/javascript">
    // Map appearance
    var width="100%";         // width in pixels or percentage
    var height="300";         // height in pixels
    var names=true;           // always show ship names (defaults to false)

    // Single ship tracking
    var imo="9506291";        // display latest position (by IMO, overrides MMSI)
    var show_track=true;      // display track line (last 24 hours)
</script>
<script type="text/javascript" src="https://www.vesselfinder.com/aismap.js"></script>


Example 3: Tracking a fleet

<script type="text/javascript">
    // Map appearance
    var width="100%";         // width in pixels or percentage
    var height="300";         // height in pixels
    var latitude="36.00";     // center latitude (decimal degrees)
    var longitude="-5.40";    // center longitude (decimal degrees)
    var names=true;           // always show ship names (defaults to false)

    // Fleet tracking
    var fleet="e48ab3d80a0e2a9bf28930f2dd08800c"; // your personal Fleet key (displayed in your User Profile)
    var fleet_name="Carnival"; // display particular fleet from your fleet list
    var fleet_timespan="1440"; // maximum age in minutes of the displayed ship positions
</script>
<script type="text/javascript" src="https://www.vesselfinder.com/aismap.js"></script>