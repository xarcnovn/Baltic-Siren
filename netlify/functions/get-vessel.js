// Netlify serverless function to proxy Datalastic vessel API calls
// This keeps the API key secure on the server side

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const API_KEY = process.env.DATALASTIC_VESSELS_API;

  if (!API_KEY) {
    console.error('DATALASTIC_VESSELS_API environment variable not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  // Parse query parameters
  const { mmsi, imo, date_from, date_to, endpoint } = event.queryStringParameters || {};

  // Determine which endpoint to call
  let url;

  if (endpoint === 'history') {
    // Vessel history endpoint
    const identifier = mmsi ? `mmsi=${mmsi}` : `imo=${imo}`;
    url = `https://api.datalastic.com/api/v0/vessel_history?api-key=${API_KEY}&${identifier}&date_from=${date_from}&date_to=${date_to}`;
  } else {
    // Vessel position endpoint (default)
    const identifier = mmsi ? `mmsi=${mmsi}` : `imo=${imo}`;
    url = `https://api.datalastic.com/api/v0/vessel?api-key=${API_KEY}&${identifier}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error calling Datalastic API:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch vessel data' })
    };
  }
};
