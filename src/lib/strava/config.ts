const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URI = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
export const INITIAL_LOAD_MONTHS = parseInt(process.env.INITIAL_LOAD_MONTHS || '1', 1);

const scope = 'activity:read_all,activity:write';

export const STRAVA_CONFIG = {
  clientId: STRAVA_CLIENT_ID, // Get from Strava API settings
  redirectUri: STRAVA_REDIRECT_URI, // Update with your redirect URI
  tokenUrl: 'https://www.strava.com/oauth/token',
  authUrl: `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=${scope}&approval_prompt=auto`
};

export const DAILY_GOAL = 25;

