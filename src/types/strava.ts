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

export interface DayStatus {
    date: Date;
    completed: boolean;
    duration: number;
    activities: StravaActivity[];
}

export interface RecentDays {
    index: number;
    start_date: Date;
    weekday: string;
    minutes: number;
    completed: boolean;
    activities: StravaActivity[];
  }

export interface StreakData {
    currentStreak: number;
    currentStreakStartDate: Date;
    todayMinutes: number;
    completed: boolean;
    longestStreak: number;
    longestStreakStartDate: Date;
    lastSevenDays: RecentDays[];
}

export interface LocalActivities {
    activities: StravaActivity[];
    timestamp: number;
}
