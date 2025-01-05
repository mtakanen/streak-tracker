import { StravaActivity } from '@/types/strava';

const ATHLETE_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';

export async function getStravaActivities(after: number): Promise<StravaActivity[]> {
  const token = localStorage.getItem('stravaAccessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  const perPage = 30;
  let allActivities: StravaActivity[] = [];
  let page = 1;
  let hasMoreActivities = true;

  while (hasMoreActivities) {
    const response = await fetch(`${ATHLETE_ACTIVITIES_URL}?after=${after}&per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log(response);
      if (response.status === 400) {
        throw new Error('Strava API: 400 Bad request');
      } else if (response.status === 401) {
        throw new Error('Strava API: 401 Unauthorized');
      } else if (response.status === 403) {
        throw new Error('Strava API: 403 Forbidden');
      } else if (response.status === 404) {
        throw new Error('Strava API: 404 Not found');
      } else if (response.status === 429) {
        throw new Error('Strava API: 429 Too many requests');
      } else if (response.status === 500) {
        throw new Error('Strava API: 500 Internal server error');
      } else {
        throw new Error('Failed to fetch activities');
      }
    }
    const data: StravaActivity[] = await response.json();
    allActivities = allActivities.concat(data);

    if (data.length == 0) {
      hasMoreActivities = false;
    } else {
      page++;
    }
  }

  return allActivities;
}