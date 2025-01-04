import { StravaActivity } from '@/types/strava';

const ATHLETE_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';

export async function getStravaActivities(after: number): Promise<StravaActivity[]> {
  const token = localStorage.getItem('stravaAccessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  let allActivities: StravaActivity[] = [];
  let page = 1;
  let perPage = 30;
  let hasMoreActivities = true;

  while (hasMoreActivities) {
    const response = await fetch(`${ATHLETE_ACTIVITIES_URL}?after=${after}&per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log(response);
      if (response.status === 429) {
        throw new Error('Too many requests to Strava API');
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