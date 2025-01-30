"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { NormiContent, ErrorContent } from './NormiContent';
import SkeletonContent from '@/components/SkeletonContent';
import { LoadingModal } from '@/components/ui/modal';
import { StravaActivity, DayEntry, StreakData, LocalActivities } from '@/types/strava';
import { getStravaActivities } from '@/lib/strava/api';
import { STRAVA_CONFIG, INITIAL_LOAD_MONTHS, MILESTONES } from '@/lib/strava/config';
import { calculateDayEntries, dateReviver, invalidateLocalStorage, initStreaks, updateCurrentStreak } from '@/lib/utils';

const StreakTracker = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null);
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
      <ErrorContent error={error} />
    );
  }

  if (!streakData) {
    return (
      <>
        <SkeletonContent />
        <LoadingModal isOpen={loading} text={`Loading up to ${INITIAL_LOAD_MONTHS} months of run history..`} />
      </>
    );
  }

  return (
    <>
      <NormiContent
        streakData={streakData}
        showMilestoneModal={showMilestoneModal}
        setShowMilestoneModal={setShowMilestoneModal}
        showStatsModal={showStatsModal}
        setShowStatsModal={setShowStatsModal}
        selectedDay={selectedDay}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        setSelectedDay={setSelectedDay}
        selectedWeekday={selectedWeekday}
        setSelectedWeekday={setSelectedWeekday}
        selectedDayActivities={selectedDayActivities}
        setSelectedDayActivities={setSelectedDayActivities}
      />
      <LoadingModal isOpen={loading} text="Checking for new runs.." />
    </>
  );
};

export default StreakTracker;
