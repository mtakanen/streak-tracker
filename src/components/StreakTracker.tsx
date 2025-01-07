"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { Loader } from 'lucide-react';
import { StravaActivity } from '@/types/strava';
import { getStravaActivities } from '@/lib/strava/api';
import Image from 'next/image';

interface DayStatus {
  completed: boolean;
  duration: number;
  activities: StravaActivity[];
}

interface StreakTrackerProps {
  startTimestamp: number; // Unix timestamp
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

const subTypeToMainType: { [key: string]: string } = {
  TrailRun: 'Run',
  VirtualRun: 'Run',
  VirtualRide : 'Ride',
  NordicSki: 'Ski',
  AlpineSki: 'Ski',
  BackcountrySki: 'Ski',
  // Add more sub-types and their main categories as needed
};
export function StreakTracker({ startTimestamp }: StreakTrackerProps) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState('Run');

  const fetchActivities = async (startTimestamp: number) => {
    try {
      const token = localStorage.getItem('stravaAccessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const now = new Date().getTime();
      const storedData = localStorage.getItem('stravaActivities');
      if (storedData) {
        const { activities, timestamp } = JSON.parse(storedData);
        const expirary = 3 * 60 * 60 * 1000; // 3h
  
        if (now - timestamp < expirary) {
          setActivities(activities);
          setLoading(false);
          return;
        }
      }
  
      const data = await getStravaActivities(startTimestamp);
      setActivities(data);
      localStorage.setItem('stravaActivities', JSON.stringify({ activities: data, timestamp: now }));
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      // Clear tokens if they're invalid
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        localStorage.removeItem('stravaAccessToken');
        localStorage.removeItem('stravaRefreshToken');
        localStorage.removeItem('stravaTokenExpiry');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(startTimestamp);
  }, [startTimestamp]);



  const getDayStatus = (date: string): DayStatus => {
    const dayActivities = activities.filter(activity => {
      const mainType = subTypeToMainType[activity.type] || activity.type;
      return activity.start_date.startsWith(date) && (selectedActivity === 'Multi' || selectedActivity === mainType);
    });
  
    const totalDuration = dayActivities.reduce((sum, activity) =>
      sum + Math.floor(activity.moving_time / 60), 0
    );
  
    return {
      completed: totalDuration >= 25,
      duration: totalDuration,
      activities: dayActivities
    };
  };
  


  const calculateStreakLength = (currentDate: Date): number => {
    let streak = 0;
  
    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      const status = getDayStatus(dateString);
      if (status.completed) {
        streak++;
      } else if (dateString === new Date().toISOString().split('T')[0]) {
        // If today is not completed, do not increment the streak
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      } else {
        break;
      }
  
      currentDate.setDate(currentDate.getDate() - 1);
    }
  
    return streak;
  };

  const calculateStreakData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayStatus = getDayStatus(today);
    const currentStreak = calculateStreakLength(new Date());
    const longestStreak = Math.max(currentStreak, ...activities.map(activity => calculateStreakLength(new Date(activity.start_date))));
    const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const status = getDayStatus(dateString);
      return {
        day: 7 - i,
        minutes: status.duration,
        activities: status.activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          duration: Math.floor(activity.moving_time / 60),
        })),
      };
    });
  
    return {
      currentStreak,
      todayMinutes: todayStatus.duration,
      longestStreak,
      lastSevenDays,
    };
  };


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

  const streakData = calculateStreakData();
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Streak Tracker</CardTitle>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {['Run', 'Ride', 'Swim', 'Multi'].map((activity) => (
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-4xl font-bold text-green-600">
            {streakData.currentStreak} days
          </div>
          <div className="text-sm text-green-700">
            {streakData.todayMinutes >= 25 ? 'Current Streak' : 'Keep going! Complete today to continue your streak!'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <Clock className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xl font-bold">{streakData.todayMinutes}min</div>
            <div className="text-xs text-slate-600">Today</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1" />
            <div className="text-xl font-bold">{streakData.longestStreak}</div>
            <div className="text-xs text-slate-600">Longest Streak</div>
          </div>
        </div>

        {/* Last 7 Days Timeline with Strava Links */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
        <div className="text-sm font-medium">Last 7 days</div>
        <div className="flex gap-1">
          {streakData.lastSevenDays.map((day, index) => (
            <div
              key={index}
              className="flex-1 bg-green-100 rounded-md p-2 text-center"
            >
              <div className="text-xs text-green-800">Day {day.day}</div>
              <div className="text-sm font-medium">{day.minutes}m</div>
              {day.activities.map(activity => (
                <div key={activity.id} className="mt-1">
                    <div className="text-xs">
                      {activityTypeSymbols[activity.type] || ''}
                    </div>
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
          ))}
      </div>
    </div>

        {/* Goal Display */}
        <div className="text-sm text-center text-slate-600 pt-2">
          Goal: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>25 minutes</span> every day!
        </div>

        {/* Strava Attribution */}
        <div className="flex justify-center mt-4">
          <Image src="/api_logo_pwrdBy_strava_stack_light.svg" alt="Powered by Strava" width={100} height={50} className="logo"/>
        </div>
      </CardContent>
    </Card>
  );
};

