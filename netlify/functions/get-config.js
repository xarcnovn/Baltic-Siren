// Netlify serverless function to serve Mapbox configuration
// This keeps the Mapbox access token secure on the server side

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  if (!MAPBOX_TOKEN) {
    console.error('MAPBOX_ACCESS_TOKEN environment variable not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Mapbox token not configured' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      mapboxToken: MAPBOX_TOKEN
    })
  };
};
