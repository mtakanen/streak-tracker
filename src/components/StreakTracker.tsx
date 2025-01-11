"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Clock, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import Image from 'next/image';

import { StravaActivity } from '@/types/strava';
import { getStravaActivities, refreshStravaToken } from '@/lib/strava/api';
import { getStravaAuthUrl } from '@/lib/strava/auth';
import { DAILY_GOAL } from '@/lib/strava/config';
import { dateToIsoDate } from '@/lib/utils';

const STORAGE_VERSION = '1.0'

interface DayStatus {
  date: Date;
  completed: boolean;
  duration: number;
  activities: StravaActivity[];
}

const activityTypeSymbols: { [key: string]: string } = {
  Run: '👟',
  Ride: '🚲',
  Swim: '🏊‍♂️',
  Walk: '🚶‍♂️',
  Ski: '🎿',
  Skate: '⛸️',
  // Add more activity types and symbols as needed
};

const ActivityModal = ({ activities, weekday, onClose }: { activities: StravaActivity[], weekday: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg max-w-md w-full relative">
      <h2 className="text-xl font-bold mb-4">{weekday} {new Date(activities[0].start_date).toLocaleDateString()}</h2>
      <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>X</button>
      {activities.map(activity => (
        <div key={activity.id} className="mb-2">
          <div className="text-xs">{activityTypeSymbols[activity.type] || ''} {activity.name} {Math.floor(activity.moving_time / 60)}min</div>
          <a 
            href={`https://www.strava.com/activities/${activity.id}`}
            className="text-[#FC4C02] hover:underline text-xs block"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Strava
          </a>
        </div>
      ))}
    </div>
  </div>
);


const StreakTracker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedActivity, setSelectedActivity] = useState('Run');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<string>();
  const [selectedDayActivities, setSelectedDayActivities] = useState<StravaActivity[]>([]);

  interface RecentDays {
    index: number;
    start_date: Date;
    weekday: string;
    minutes: number;
    completed: boolean;
    activities: StravaActivity[];
  }

  interface StreakData {
    currentStreak: number;
    currentStreakStartDate: Date;
    todayMinutes: number;
    completed: boolean;
    longestStreak: number;
    longestStreakStartDate: Date;
    lastSevenDays: RecentDays[];
  }

  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const router = useRouter();
  const STRAVA_AUTH_URL = getStravaAuthUrl();

  interface StoredData {
    activities: StravaActivity[];
    timestamp: number;
  }

  interface TokenData {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }

  const invalidateLocalStorage = () => {
    const storedVersion = localStorage.getItem('storageVersion');
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.clear();
      localStorage.setItem('storageVersion', STORAGE_VERSION);
    }
  };

  const fetchActivities = React.useCallback(async (fromTimestamp: number): Promise<StravaActivity[]> => {
      let activities: StravaActivity[] = [];
      try {
        let token = localStorage.getItem('stravaAccessToken');
        const tokenExpiry = localStorage.getItem('stravaTokenExpiry');
        const refreshToken = localStorage.getItem('stravaRefreshToken');
  
        if (!token || !tokenExpiry || !refreshToken) {
          setLoading(false);
          window.location.href = STRAVA_AUTH_URL; // Redirect to Strava authorization URL if no token
          return [];
        }
  
        const now = new Date().getTime();
        if (now >= parseInt(tokenExpiry, 10)) {
          // Token has expired, try to refresh it
          const newTokenData: TokenData | null = await refreshStravaToken(refreshToken);
          if (newTokenData) {
            token = newTokenData.access_token;
            localStorage.setItem('stravaAccessToken', newTokenData.access_token);
            localStorage.setItem('stravaRefreshToken', newTokenData.refresh_token);
            localStorage.setItem('stravaTokenExpiry', (now + newTokenData.expires_in * 1000).toString());
          } else {
            // Refresh token is invalid, redirect to Strava authorization URL
            localStorage.removeItem('stravaAccessToken');
            localStorage.removeItem('stravaRefreshToken');
            localStorage.removeItem('stravaTokenExpiry');
            window.location.href = STRAVA_AUTH_URL;
            return [];
          }
        }
  
        const storedData = localStorage.getItem('stravaActivities');
        let pageSize = 30;
  
        if (storedData) {
          const { activities, timestamp }: StoredData = JSON.parse(storedData);
          const expirary = 5 * 60 * 1000; // 15min
          if (now - timestamp < expirary) {
            // these should be fresh enough
            return activities;
          }  
        } else {
          // We don't have any stored data, so fetch all activities in bigger chunks
          pageSize = 100;
        }  
        // console.log('Fetching activities from:', new Date(fromTimestamp * 1000));
        const fetchedActivities: StravaActivity[] = await getStravaActivities(fromTimestamp, pageSize);
        activities = [...activities, ...fetchedActivities];
        localStorage.setItem('stravaActivities', JSON.stringify({ activities: activities, timestamp: now }));
      } catch (err) {
        console.log(err);
        if (err instanceof Error && err.message.includes('401')) {
          // Clear tokens if they're invalid and redirect to login page
          localStorage.removeItem('stravaAccessToken');
          localStorage.removeItem('stravaRefreshToken');
          localStorage.removeItem('stravaTokenExpiry');
          router.push('/');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch activities');
        }
  
      } finally {
        setLoading(false);
      }
      return activities;
    }, []);

  const getDayStatus = (activities: StravaActivity[], date: Date): DayStatus => {
    const dateString = dateToIsoDate(date);
    const dayActivities = activities.filter(activity => {
      // const mainType = subTypeToMainType[activity.type] || activity.type;
      return activity.start_date.startsWith(dateString) && activity.type === 'Run';
    });
  
    const totalDuration = dayActivities.reduce((sum, activity) =>
      sum + Math.floor(activity.moving_time / 60), 0
    );
  
    return {
      date: date,
      completed: totalDuration >= DAILY_GOAL,
      duration: totalDuration,
      activities: dayActivities
    };
  };
  


  const calculateStreakLength = (activities: StravaActivity[], date: Date): 
    { length: number, startDate: Date }  => {
    let streak = 0;
    const activityDate = new Date(date);
    let streakStartDate = new Date(date);
    const todayString = dateToIsoDate(new Date())
    while (true) {
      const status = getDayStatus(activities, activityDate);
      if (status.completed) {
        streak++;
        streakStartDate = new Date(activityDate); // Update streakStartDate to the current activityDate
      } else if (dateToIsoDate(activityDate) === todayString) {
        // current day is not completed yet, keep the streak
        activityDate.setDate(activityDate.getDate() - 1);
        continue;
      } else {
        // day not completed, break the streak
        break;
      }
      activityDate.setDate(activityDate.getDate() - 1);
    }
  
    return { length: streak, startDate: streakStartDate };
  };


  const initStreaks = (activities: StravaActivity[]) => {
    // console.log('initStreaks');
    const today = new Date();
    // console.log(activities.length)
    const currentStreakUpdatedAt = new Date(localStorage.getItem('currentStreakUpdatedAt') || new Date());
    const { length: currentStreak, startDate: currentStreakStartDate } = calculateStreakLength(activities, today);
    let {length: longestStreak, startDate: longestStreakStartDate}  = activities.reduce((maxStreak, activity) => {
      const streakData = calculateStreakLength(activities, new Date(activity.start_date));
      return streakData.length > maxStreak.length ? streakData : maxStreak;
    }, { length: 0, startDate: new Date() });
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStartDate = currentStreakStartDate;
    }
    return { currentStreak, longestStreak, currentStreakStartDate, currentStreakUpdatedAt, longestStreakStartDate };
  };
  
  const updateStreaks = (lastSevenDays: RecentDays[]) => {
    // console.log('updateStreaks');
    let currentStreak = parseInt(localStorage.getItem('currentStreak') || '0', 10);
    let longestStreak = parseInt(localStorage.getItem('longestStreak') || '0', 10);
    let currentStreakStartDate = new Date(localStorage.getItem('currentStreakStartDate') || new Date());
    let longestStreakStartDate = new Date(localStorage.getItem('longestStreakStartDate') || new Date());
    let currentStreakUpdatedAt = new Date(localStorage.getItem('currentStreakUpdatedAt') || new Date());
    const today = new Date();
    const todayStatus = lastSevenDays[0];

    if (todayStatus.completed && currentStreakUpdatedAt.getDate() < today.getDate()) {
      currentStreak++;
      currentStreakUpdatedAt = today
    } 

    for (let i = 1; i < lastSevenDays.length; i++) {
      if (lastSevenDays[i].start_date < today && !lastSevenDays[i].completed) {
        currentStreak = 0;
        currentStreakStartDate = new Date(0); // epoch
        break;
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStartDate = currentStreakStartDate;
    }
    return { currentStreak, longestStreak, currentStreakStartDate, currentStreakUpdatedAt, longestStreakStartDate };
  };

  /**
   * Calculates streak data based on the provided activities and initialization status.
   *
   * @param {StravaActivity[]} activities - An array of Strava activities.
   * @param {boolean} initializing - A flag indicating whether the streaks are being initialized.
   * @returns {StreakData} An object containing the current streak, longest streak, today's minutes, completion status, and data for the last seven days.
   */
  const calculateStreakData = React.useCallback((activities: StravaActivity[], initializing: boolean) => {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const lastSevenDays: RecentDays[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const status = getDayStatus(activities, date);
        return {
          index: 7 - i,
          start_date: status.date,
          weekday: weekdays[date.getDay()],
          minutes: status.duration,
          completed: status.duration >= DAILY_GOAL,
          activities: status.activities
        };
      });
  
      const streaks = initializing ? initStreaks(activities) : updateStreaks(lastSevenDays);
      const currentStreak = streaks.currentStreak;
      const longestStreak = streaks.longestStreak;
      const currentStreakStartDate = streaks.currentStreakStartDate;
      const currentStreakUpdatedAt = streaks.currentStreakUpdatedAt;
      const longestStreakStartDate = streaks.longestStreakStartDate;
      localStorage.setItem('currentStreak', currentStreak.toString());
      localStorage.setItem('longestStreak', longestStreak.toString());
      localStorage.setItem('currentStreakStartDate', currentStreakStartDate.toISOString());
      localStorage.setItem('currentStreakUpdatedAt', currentStreakUpdatedAt.toISOString());
      localStorage.setItem('longestStreakStartDate', longestStreakStartDate.toISOString());
  
      return {
        currentStreak,
        currentStreakStartDate,
        todayMinutes: lastSevenDays[0].minutes,
        completed: lastSevenDays[0].completed,
        longestStreak,
        longestStreakStartDate,
        lastSevenDays
      };
    }, []);

  useEffect(() => {
    invalidateLocalStorage();
    const longestStreak = localStorage.getItem('longestStreak');
    const initialize = longestStreak === null || longestStreak === '0';
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;
    const fromTimestamp = initialize ? (Date.now() - month) / 1000 : (Date.now() - week) / 1000;

    fetchActivities(fromTimestamp).then((activities) => {
      const streaks = calculateStreakData(activities, initialize);
      setStreakData(streaks);
    });
  }, [fetchActivities, calculateStreakData]);
  
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Loader className="animate-spin" />
          <p>Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p>Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!streakData) {
    return null; // Render nothing if streakData is not yet available
  }


  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl font-bold">Streak Tracker</CardTitle>
        </div>
        {/*
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {['Run', 'Ride', 'Swim', 'Any'].map((activity) => (
            <button
              key={activity}
              onClick={() => setSelectedActivity(activity)}
              className={`px-3 py-1 rounded-md capitalize ${
                selectedActivity === activity 
                  ? 'bg-white shadow-sm' 
                  : 'hover:bg-white/60'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
        */}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className={`text-center p-4 rounded-lg ${streakData.completed ? 'bg-green-50' : 'bg-orange-50'}`}>
          <div className={`text-4xl font-bold ${streakData.completed ? 'text-green-600' : 'text-orange-600'}`}>
            {streakData.currentStreak} days
          </div>
          <div className={`text-sm ${streakData.completed ? 'text-green-600' : 'text-orange-600'}`}>
            current streak
          </div>
          {/* TODO: do not show this message if the streak is broken */}
          <div className="text-sm text-orange-600">
            {streakData.currentStreak > 0 && !streakData.completed ? 'Keep going! Run today to continue your streak!' : ''}
          </div>
          <div className="text-xs text-slate-600">
            {streakData.currentStreak > 0 ? `started on ${dateToIsoDate(streakData.currentStreakStartDate)}` : 'Go running!'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <Clock className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xl font-bold">{streakData.todayMinutes}min</div>
            <div className="text-xs text-slate-600">today</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xl font-bold">{streakData.longestStreak}</div>
            <div className="text-xs text-slate-600">longest streak</div>
            <div className="text-xs text-slate-600">
            {streakData.longestStreak > 0 ? `started on ${dateToIsoDate(streakData.longestStreakStartDate)}` : ''}</div>
          </div>
        </div>
        {/* Last 7 Days Timeline with Strava Links */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-sm font-medium">Last 7 days</div>
          <div className="flex gap-1">
            {streakData.lastSevenDays.map((day: {
              index: number;
              weekday: string;
              minutes: number;
              completed: boolean;
              activities: StravaActivity[];
            }, index: number) => (
              <div
              key={index}
              className={`flex-1 rounded-md p-2 text-center cursor-pointer ${day.completed ? 'bg-green-100' : 'bg-orange-100'}`}
              onClick={() => {
                if (day.minutes >= DAILY_GOAL) {
                setSelectedDay(day.index);
                setSelectedWeekday(day.weekday);
                setSelectedDayActivities(day.activities);
                }
              }}
              style={{ cursor: day.minutes >= DAILY_GOAL ? 'pointer' : 'not-allowed' }}      
              >
              <div className="text-xs text-green-800"><span style={{ whiteSpace: 'nowrap' }}>{day.weekday}</span></div>
              <div className="text-sm font-medium">{day.minutes}min</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Display */}
        <div className="text-sm text-center text-slate-600 pt-2">
          Goal: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>{DAILY_GOAL} minutes</span> every day!
        </div>

        {/* Strava Attribution */}
        <div className="flex justify-center mt-4">
          <Image 
            src="/api_logo_pwrdBy_strava_stack_light.svg" 
            alt="Powered by Strava" 
            width={100} 
            height={50} 
            className="logo"           
          />
        </div>
      </CardContent>
      {selectedDay !== null && (
        <ActivityModal
          activities={selectedDayActivities}
          weekday={selectedWeekday || ''}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </Card>
  );
};

export default StreakTracker;