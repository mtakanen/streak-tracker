import axios from 'axios';

import { StravaActivity, StravaTokenData } from '@/types/strava';

const ATHLETE_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';
const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenData | null> {
  try {
    const response = await axios.post<StravaTokenData>('https://www.strava.com/oauth/token', null, {
      params: {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    });

    /**const data: StravaTokenData = response.data;*/
    return response.data;
  } catch (error) {
    console.error('Failed to refresh Strava token:', error);
    return null;
  }
}

export async function getStravaActivities(after: number, perPage: number): Promise<StravaActivity[]> {
  const token = localStorage.getItem('stravaAccessToken');
  if (!token) {
    throw new Error('No access token found');
  }

  let page = 1;
  let hasMoreActivities = true;
  let allActivities: StravaActivity[] = [];

  while (hasMoreActivities) {
    const response = await axios.get<StravaActivity[]>(ATHLETE_ACTIVITIES_URL, {
      params: {
        after,
        page,
        per_page: perPage,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
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
    const data: StravaActivity[] = response.data;
    allActivities = allActivities.concat(data);

    if (data.length == 0) {
      hasMoreActivities = false;
    } else {
      page++;
    }
  }

  return allActivities;
}