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
  
export interface StravaAthlete {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile_medium: string;
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
    athlete: StravaAthlete;
    granted_scope: string;       
}

export interface DayStatus {
    local_date: Date;
    completed: boolean;
    duration: number;
    distance: number;
    runs: number;
    isMinimumDay: boolean;
    outdoorRuns: number;
    activities: StravaActivity[];
}

export interface DayEntry extends DayStatus {
    index: number;
    weekday: string;
}

export interface StreakData {
    currentStreak: number;
    currentStreakStartDate: Date;
    currentStreakUpdatedAt: Date;
    todayMinutes: number;
    completed: boolean;
    longestStreak: number;
    longestStreakStartDate: Date;
    lastSevenDays: DayEntry[];
    stats: StreakStats;
}

export interface LocalActivities {
    activities: StravaActivity[];
    timestamp: number;
}

export interface StreakStats {
    // totals
    runs: number;
    minimumDays: number;
    outdoorRuns: number;
    totalDuration: number;
    totalDistance: number;
}
