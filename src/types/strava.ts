// src/types/strava.ts
export interface StravaActivity {
    id: number;
    type: string;
    start_date: string;
    moving_time: number;
    distance: number;
    name: string;
}
  
export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface StravaTokenData {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }
  