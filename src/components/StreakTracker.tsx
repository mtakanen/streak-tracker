"use client";

import React from 'react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Skeleton from '@/components/Skeleton';
import { ActivityModal, LoadingModal, StatsModal, MilestoneModal } from '@/components/ui/modal';
import MilestoneCard from '@/components/MilestoneCard'
import { StravaActivity, DayEntry, StreakData, LocalActivities } from '@/types/strava';
import { getStravaActivities } from '@/lib/strava/api';
import { STRAVA_CONFIG, MINIMUM_DURATION, INITIAL_LOAD_MONTHS, MILESTONES } from '@/lib/strava/config';
import { calculateDayEntries, dateToIsoDate, dateReviver, invalidateLocalStorage, initStreaks, updateCurrentStreak } from '@/lib/utils';


const StreakTracker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedActivity, setSelectedActivity] = useState('Run');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<string>();
  const [selectedDayActivities, setSelectedDayActivities] = useState<StravaActivity[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const fetchActivities = React.useCallback(async (fromTimestamp: number): Promise<StravaActivity[]> => {
      let activities: StravaActivity[] = [];
      const now = new Date().getTime();
      try {  
        const storedData = localStorage.getItem('stravaActivities');
        let pageSize = 30;
  
        if (storedData) {
          const { activities, timestamp }: LocalActivities = JSON.parse(storedData);
          const expirary = 1 * 30 * 1000; // 5min
          if (now - timestamp < expirary) {
            // these should be fresh enough
            return activities;
          }  
        } else {
          // We don't have any stored data, so fetch all activities in bigger chunks
          pageSize = 150;
        }  
        setLoading(true);
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
          window.location.href = STRAVA_CONFIG.authUrl; // Redirect to Strava authorization URL if token error
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch activities');
          throw err;
        }
      } finally {
        setLoading(false);
      }
      return activities;
    }, []);


  const updateStreaks = (lastSevenDays: DayEntry[], currentDate: Date) => {
    // console.log('updateStreaks');
    const streaks = JSON.parse(localStorage.getItem('streaks') || '{}', dateReviver);
    let currentStreak = parseInt(streaks.currentStreak);
    let longestStreak = parseInt(streaks.longestStreak);
    let currentStreakStartDate = streaks.currentStreakStartDate;
    let longestStreakStartDate = streaks.longestStreakStartDate;
    let currentStreakUpdatedAt = streaks.currentStreakUpdatedAt;
    const updatedStreak = updateCurrentStreak(
      lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate, streaks.stats);
    currentStreakUpdatedAt = updatedStreak.currentStreakUpdatedAt;
    currentStreak = updatedStreak.currentStreak;
    currentStreakStartDate = updatedStreak.currentStreakStartDate;

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStartDate = currentStreakStartDate;
    }
    return { currentStreak, longestStreak, currentStreakStartDate, currentStreakUpdatedAt, longestStreakStartDate, stats: updatedStreak.stats };
  };


  /**
   * Calculates streak data based on the provided activities and initialization status.
   *
   * @param {StravaActivity[]} activities - An array of Strava activities.
   * @param {boolean} initializing - A flag indicating whether the streaks are being initialized.
   * @returns {StreakData} An object containing the current streak, longest streak, today's minutes, completion status, and data for the last seven days.
   */
  const calculateStreakData = (activities: StravaActivity[], initializing: boolean) => {
    const currentDate = new Date(new Date().toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));

    const lastSevenDays: DayEntry[] = calculateDayEntries(activities, currentDate);
    const streaks = initializing ? initStreaks(activities, currentDate) : updateStreaks(lastSevenDays, currentDate);

    return {
      currentStreak: streaks.currentStreak,
      currentStreakStartDate: streaks.currentStreakStartDate,
      currentStreakUpdatedAt: streaks.currentStreakUpdatedAt,
      todayMinutes: lastSevenDays[0].duration,
      completed: lastSevenDays[0].completed,
      longestStreak: streaks.longestStreak,
      longestStreakStartDate: streaks.longestStreakStartDate,
      lastSevenDays,
      stats: streaks.stats,
    };
  };

  const fetchData = React.useCallback(async () => {
    try {
      const cachedStreaks = JSON.parse(localStorage.getItem('streaks') || '{}');
      const longestStreak = cachedStreaks && cachedStreaks.longestStreak;
      const initialize = longestStreak === undefined || longestStreak === '0';
      const week = 7 * 24 * 60 * 60 * 1000;
      const month = 30.5 * 24 * 60 * 60 * 1000;
      const fromTimestamp = initialize ? Math.floor((Date.now() - INITIAL_LOAD_MONTHS * month) / 1000) : Math.floor((Date.now() - week) / 1000);

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
          window.location.href = STRAVA_CONFIG.authUrl; // Redirect to Strava authorization URL
        } else {
          setError('No activities found from your Strava account. Go running and come back!');
        }
        return;
      }

      const streaks = calculateStreakData(activities, initialize);
      localStorage.setItem('streaks', JSON.stringify(streaks));
      setStreakData(streaks);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof Error && err.message.includes('token')) {
        window.location.href = STRAVA_CONFIG.authUrl; // Redirect to Strava authorization URL if token error
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchActivities]);

  const handleCloseMilestoneModal = () => {
    setShowMilestoneModal(false);
  };


  const handleCloseStatsModal = () => {
    setShowStatsModal(false);
  };

  useEffect(() => {
    invalidateLocalStorage(false);
    const cachedStreaks = localStorage.getItem('streaks');
    if (cachedStreaks) {
      setStreakData(JSON.parse(cachedStreaks, dateReviver));
    }
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // setShowMilestoneModal(true); // dev only
    if (streakData && streakData.completed && streakData.currentStreak in MILESTONES) {
      setShowMilestoneModal(true);
    }
  }, [streakData]);


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
    // skeleton loading
    return (
      <>
        <Card className="w-full max-w-sm mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-slate-600 text-xl">Normi Run</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Streak Display */}
            <Skeleton width="100%" height="150px" />
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Skeleton  width="100%" height="90px" />
              <Skeleton  width="100%" height="90px" />
            </div>
            {/* Last 7 Days Timeline */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="text-sm font-medium">Previous 7 days</div>
                <div className="flex gap-[0.3rem]">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex-1 rounded-md">
                    <Skeleton width="100" height="50px" />
                  </div>
                ))}
                </div>
            </div>
            {/* Goal Display */}
            <div className="text-sm text-center text-slate-600 pt-2">
              Normi: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>{MINIMUM_DURATION} minutes</span> every day!
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
        </Card>
        <LoadingModal isOpen={loading} text="Loading activities" />
      </>
    );
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
            <div className="p-3 bg-slate-50 rounded-lg text-center cursor-pointer"
             onClick={() => {
              setShowStatsModal(true);
             }}
             style={{ cursor: 'pointer' }}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xl font-bold">{streakData.todayMinutes}min</div>
              <div className="text-xs text-slate-600">today</div>
            </div>
            <MilestoneCard 
              streak={streakData.currentStreak}
              todayCompleted={streakData.completed} 
            />
          </div>
          {/* Last 7 Days Timeline with Strava Links */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-sm font-medium">Previous 7 days</div>
            <div className="flex gap-1">
              {streakData.lastSevenDays.map((day: {
                index: number;
                weekday: string;
                duration: number;
                completed: boolean;
                activities: StravaActivity[];
              }, index: number) => (
                <div
                key={index}
                className={`flex-1 rounded-md p-2 text-center cursor-pointer ${day.completed ? 'bg-green-100' : 'bg-orange-100'}`}
                onClick={() => {
                  if (day.completed) {
                    setSelectedIndex(index);
                    setSelectedDay(day.index);
                    setSelectedWeekday(day.weekday);
                    setSelectedDayActivities(day.activities);
                  }
                }}
                style={{ cursor: day.completed ? 'pointer' : 'not-allowed' }}      
                >
                <div className="text-xs text-green-800"><span style={{ whiteSpace: 'nowrap' }}>{day.weekday}</span></div>
                <div className="text-sm font-medium">{day.duration}min</div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Display */}
          <div className="text-sm text-center text-slate-600 pt-2">
            Normi: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>{MINIMUM_DURATION} minutes</span> every day!
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
            streakData={streakData}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </Card>
      { showMilestoneModal && 
        <MilestoneModal 
          milestone={MILESTONES[streakData.currentStreak]} 
          onClose={handleCloseMilestoneModal}
        />
      } 
      {showStatsModal && (
        <StatsModal 
          stats={streakData.stats} 
          streak={streakData.currentStreak}
          onClose={handleCloseStatsModal} 
        />
      )}
    </>
  );
};

export default StreakTracker;
