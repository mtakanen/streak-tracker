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
  let getMoreActitivities = true;
  let allActivities: StravaActivity[] = [];
  const stravaAthlete = localStorage.getItem('stravaAthlete');
  if (!stravaAthlete) {
    throw new Error('Unable to request activities without athlete!');
  }
  const accountID = JSON.parse(stravaAthlete).id;

  // TOOD: move to backend
  while (getMoreActitivities) {
    try {
      await axios.post('/api/strava/limiter', { 'account_id': accountID })
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

      const data: StravaActivity[] = extendStravaData(response.data);
      allActivities = allActivities.concat(data);

      if (data.length == 0 || perPage == 30) {
        getMoreActitivities = false;
      } else {
        page++;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          //console.error('Error response data:', error.response.data);
          throw new Error(error.response.data.message);
        } else if (error.request) {
          //console.error('Network error:', error.message);
          throw new Error('Network error: Failed to fetch activities');
        } else {
          //console.error('Error message:', error.message);
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
    const runs = stravaData.filter((activity: StravaActivity) => activity.type === "Run")
    const tempData: StravaCustomActivity[] = runs.map(activity => ({
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