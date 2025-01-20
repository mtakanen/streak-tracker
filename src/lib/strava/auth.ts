const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URI = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';

export function getStravaAuthUrl(): string {
  const scope = 'read,activity:read_all,activity:write';
  const responseType = 'code';
  const approvalPrompt = 'auto';
  const stravaAuthUrl = `${STRAVA_AUTH_URL}?client_id=${STRAVA_CLIENT_ID}&response_type=${responseType}&redirect_uri=${STRAVA_REDIRECT_URI}&scope=${scope}&approval_prompt=${approvalPrompt}`;
  return stravaAuthUrl;
}
