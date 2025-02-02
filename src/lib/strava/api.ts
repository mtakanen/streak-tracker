import axios from 'axios';
import { STRAVA_CONFIG } from "./config";
import { StravaActivity, StravaTokenData } from '@/types/strava';


async function getAccessToken(): Promise<string | null> {
  const accessToken: StravaTokenData['access_token'] = localStorage.getItem('stravaAccessToken') || '';
  const refreshToken: StravaTokenData['refresh_token'] = localStorage.getItem('stravaRefreshToken') || '';
  const tokenExpiry: StravaTokenData['expires_in'] = parseInt(localStorage.getItem('stravaTokenExpiry') || '0');

  if (!accessToken || !tokenExpiry || !refreshToken) {
    throw new Error('Missing tokens');
  }

  if (Date.now() > tokenExpiry) {
    // Token has expired, refresh it
    console.log('token expired, refreshing');
    let response;
    try {
      response = await axios.post<StravaTokenData>(STRAVA_CONFIG.tokenUrl, {
        params: {
          client_id: STRAVA_CONFIG.clientId,
          client_secret: STRAVA_CONFIG.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        timeout: STRAVA_CONFIG.timeout
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          throw new Error(`Failed to refresh token: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
          console.error('Network error:', error.message);
          throw new Error('Network error: Failed to refresh token');
        } else {
          console.error('Error message:', error.message);
          throw new Error('Failed to refresh token');
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    }

    if (response.status !== 200) {
      throw new Error('Failed to refresh token');
    }

    const data = response.data;
    localStorage.setItem('stravaAccessToken', data.access_token);
    localStorage.setItem('stravaTokenExpiry', (Date.now() + (data.expires_in * 1000)).toString());
    localStorage.setItem('stravaRefreshToken', data.refresh_token);
    return data.access_token;
  }
  return accessToken;
};

export async function getStravaActivities(after: number, perPage: number): Promise<StravaActivity[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No access token found');
  }
  let page = 1;
  let hasMoreActivities = true;
  let allActivities: StravaActivity[] = [];

  while (hasMoreActivities) {
    try {
      const response = await axios.get<StravaCustomActivity[]>(STRAVA_CONFIG.athelteActivitiesUrl, {
        params: {
          after,
          page,
          per_page: perPage,
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
          timeout: STRAVA_CONFIG.timeout
      });

      if (response.status !== 200) {
        //console.log(response);
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
      const data: StravaActivity[] = extendStravaData(response.data);
      allActivities = allActivities.concat(data);

      if (data.length == 0) {
        hasMoreActivities = false;
      } else {
        page++;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          throw new Error(`Failed to fetch activities: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
          console.error('Network error:', error.message);
          throw new Error('Network error: Failed to fetch activities');
        } else {
          console.error('Error message:', error.message);
          throw new Error('Failed to fetch activities');
        }
      } else {
      throw new Error('Failed to fetch activities');
      }
    }
  }

  return allActivities;


  interface StravaCustomActivity extends StravaActivity {
    map: object;
    trainer: boolean;
    outdoors: boolean;
  }

  function extendStravaData(stravaData: StravaCustomActivity[]): StravaActivity[] {
    const tempData: StravaCustomActivity[] = stravaData.map(activity => ({
      ...activity,
      outdoors: activity.map && !activity.trainer
    }));
    const data: StravaActivity[] = tempData.map(activity => ({
      id: activity.id,
      type: activity.type,
      start_date_local: activity.start_date_local,
      moving_time: activity.moving_time,
      distance: activity.distance,
      name: activity.name,
      outdoors: activity.outdoors
    }));
    return data;
  }
}

export const updateActivityName = async (activityId: number, newName: string, accessToken: string): Promise<void> => {
  try {
    const response = await axios.put<StravaActivity>(
      `${STRAVA_CONFIG.activityUrl}/${activityId}`,
      { name: newName },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: STRAVA_CONFIG.timeout,
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to update activity name');
    }
  } catch (error) {
    console.error('Error updating activity name:', error);
  }
};