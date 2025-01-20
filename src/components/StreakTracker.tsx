"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Clock, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityModal, LoadingModal } from '@/components/ui/modal';
import Image from 'next/image';
import { StravaTokenData, StravaActivity, RecentDays, StreakData, LocalActivities } from '@/types/strava';
import { getStravaActivities, refreshStravaToken } from '@/lib/strava/api';
import { getStravaAuthUrl } from '@/lib/strava/auth';
import { DAILY_GOAL, INITIAL_LOAD_MONTHS } from '@/lib/strava/config';
import { getDayStatus, calculateStreakLength, dateToIsoDate, invalidateLocalStorage, updateCurrentStreak } from '@/lib/utils';


const StreakTracker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedActivity, setSelectedActivity] = useState('Run');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<string>();
  const [selectedDayActivities, setSelectedDayActivities] = useState<StravaActivity[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  const router = useRouter();
  const STRAVA_AUTH_URL = getStravaAuthUrl();

  const fetchActivities = React.useCallback(async (fromTimestamp: number): Promise<StravaActivity[]> => {
      let activities: StravaActivity[] = [];
      try {
        let token = localStorage.getItem('stravaAccessToken');
        const tokenExpiry = localStorage.getItem('stravaTokenExpiry');
        const refreshToken = localStorage.getItem('stravaRefreshToken');
  
        if (!token || !tokenExpiry || !refreshToken) {
          throw new Error('No valid access token found. Redirecting to authorization.');
        }
  
        const now = new Date().getTime();
        if (now >= parseInt(tokenExpiry, 10)) {
          // Token has expired, try to refresh it
          const newTokenData: StravaTokenData | null = await refreshStravaToken(refreshToken);
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
            throw new Error('Refresh token invalid. Redirecting to authorization.');
          }
        }
  
        const storedData = localStorage.getItem('stravaActivities');
        let pageSize = 30;
  
        if (storedData) {
          const { activities, timestamp }: LocalActivities = JSON.parse(storedData);
          const expirary = 5 * 60 * 1000; // 5min
          if (now - timestamp < expirary) {
            // these should be fresh enough
            return activities;
          }  
        } else {
          // We don't have any stored data, so fetch all activities in bigger chunks
          pageSize = 150;
        }  
        const fetchedActivities: StravaActivity[] = await getStravaActivities(fromTimestamp, pageSize);
        activities = [...activities, ...fetchedActivities];
        localStorage.setItem('stravaActivities', JSON.stringify({ activities: activities, timestamp: now }));
      } catch (err) {
        console.log(err);
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('token'))) {
          // Clear tokens if they're invalid and redirect to login page
          console.log(err.message);
          localStorage.removeItem('stravaAccessToken');
          localStorage.removeItem('stravaRefreshToken');
          localStorage.removeItem('stravaTokenExpiry');
          window.location.href = STRAVA_AUTH_URL; // Redirect to Strava authorization URL if token error
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch activities');
          throw err;
        }
      } finally {
        setLoading(false);
      }
      return activities;
    }, [router]);


  const initStreaks = (activities: StravaActivity[]) => {
    console.log('initStreaks');
    const today = new Date();
    // console.log(activities.length)
    const { length: currentStreak, startDate: currentStreakStartDate, lastDate: currentStreakUpdatedAt } = calculateStreakLength(activities, today);
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
    console.log('updateStreaks');
    let currentStreak = parseInt(localStorage.getItem('currentStreak') || '0', 10);
    let longestStreak = parseInt(localStorage.getItem('longestStreak') || '0', 10);
    let currentStreakStartDate = new Date(localStorage.getItem('currentStreakStartDate') || new Date());
    let longestStreakStartDate = new Date(localStorage.getItem('longestStreakStartDate') || new Date());
    let currentStreakUpdatedAt = new Date(localStorage.getItem('currentStreakUpdatedAt') || new Date());
    ({ currentStreakUpdatedAt, currentStreak, currentStreakStartDate } = updateCurrentStreak(lastSevenDays, new Date(), currentStreakUpdatedAt, currentStreak, currentStreakStartDate));

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
          index: i,
          start_date: status.date,
          weekday: weekdays[date.getDay()],
          minutes: status.duration,
          completed: status.duration >= DAILY_GOAL,
          activities: status.activities
        };
      });
  
      const streaks = initializing ? initStreaks(activities) : updateStreaks(lastSevenDays);
      localStorage.setItem('currentStreak', streaks.currentStreak.toString());
      localStorage.setItem('longestStreak', streaks.longestStreak.toString());
      localStorage.setItem('currentStreakStartDate', streaks.currentStreakStartDate.toISOString());
      localStorage.setItem('currentStreakUpdatedAt', streaks.currentStreakUpdatedAt.toISOString());
      localStorage.setItem('longestStreakStartDate', streaks.longestStreakStartDate.toISOString());
  
      return {
        currentStreak: streaks.currentStreak,
        currentStreakStartDate: streaks.currentStreakStartDate,
        todayMinutes: lastSevenDays[0].minutes,
        completed: lastSevenDays[0].completed,
        longestStreak: streaks.longestStreak,
        longestStreakStartDate: streaks.longestStreakStartDate,
        lastSevenDays
      };
    }, []);

  const fetchData = React.useCallback(async () => {
    try {
      const longestStreak = localStorage.getItem('longestStreak');
      const initialize = longestStreak === null || longestStreak === '0';

      const week = 7 * 24 * 60 * 60 * 1000;
      const month = 30 * 24 * 60 * 60 * 1000;
      const fromTimestamp = initialize ? (Date.now() - INITIAL_LOAD_MONTHS * month) / 1000 : (Date.now() - week) / 1000;

      const activities = await fetchActivities(fromTimestamp);
      const redirectedFlag = localStorage.getItem('redirected');
      // FIXME: this is a hack to prevent infinite loop
       if (redirectedFlag) {
        localStorage.removeItem('redirected');
      }
      if (activities.length === 0) {
        // Handle case where no activities are returned
        if (!redirectedFlag) {
          localStorage.setItem('redirected', '1');
          window.location.href = STRAVA_AUTH_URL; // Redirect to Strava authorization URL
        } else {
          setError('No activities found from your Strava account. Go running and come back!');
        }
        return;
      }

      const streaks = calculateStreakData(activities, initialize);
      setStreakData(streaks);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof Error && err.message.includes('token')) {
        window.location.href = STRAVA_AUTH_URL; // Redirect to Strava authorization URL if token error
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchActivities]);

  useEffect(() => {
      invalidateLocalStorage(false);
      fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingModal isOpen={loading} text="Loading activities"/>;
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
    <>
      <LoadingModal isOpen={loading} text="Loading activities" />

      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-1">
        <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-slate-600 text-xl">Normi Run</CardTitle>
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
                    setSelectedIndex(index);
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
            Normi: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>{DAILY_GOAL} minutes</span> every day!
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
            index={selectedIndex || 0}
            currentStreak={streakData.currentStreak}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </Card>
    </>
  );
};

export default StreakTracker;
