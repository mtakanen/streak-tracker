import { StravaActivity } from '@/types/strava';

const ATHLETE_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';
export async function getStravaActivities(after: number): Promise<StravaActivity[]> {
  const token = localStorage.getItem('stravaAccessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${ATHLETE_ACTIVITIES_URL}?after=${after}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log(response);
    throw new Error('Failed to fetch activities');
  }

  const data = await response.json();
  return data;
}