// src/types/strava.ts
export interface StravaActivity {
    id: number;
    type: string;
    start_date_local: string;
    moving_time: number;
    distance: number;
    name: string;
    outdoors: boolean;
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
    athlete: {
        id: number;
        username: string;
        firstname: string;
        lastname: string;
        profile_medium: string;
    };
    granted_scope: string;       
}

export interface DayStatus {
    local_date: Date;
    completed: boolean;
    duration: number;
    activities: StravaActivity[];
}

export interface RecentDays {
    index: number;
    start_date_local: Date;
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

export interface StreakStats {
    runs: number;
    minimums: number;
    totalDuration: number;
    avgDuration: number;
    totalDistance: number;
    avgDistance: number;
    avgPace: number;
    outdoorRuns: number;
}
