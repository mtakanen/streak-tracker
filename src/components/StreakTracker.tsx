"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Clock, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import Image from 'next/image';

import { StravaActivity } from '@/types/strava';
import { getStravaActivities } from '@/lib/strava/api';
import { DAILY_GOAL } from '@/lib/strava/config';
import { dateToIsoDate } from '@/lib/utils';

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

const ActivityModal = ({ activities, onClose }: { activities: StravaActivity[], onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg max-w-md w-full relative">
      <h2 className="text-xl font-bold mb-4">{dateToIsoDate(new Date(activities[0].start_date))}</h2>
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


export function StreakTracker({ startTimestamp }: StreakTrackerProps) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState('Run');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayActivities, setSelectedDayActivities] = useState<StravaActivity[]>([]);

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
      return activity.start_date.startsWith(date) && (selectedActivity === 'Any' || selectedActivity === mainType);
    });
  
    const totalDuration = dayActivities.reduce((sum, activity) =>
      sum + Math.floor(activity.moving_time / 60), 0
    );
  
    return {
      completed: totalDuration >= DAILY_GOAL,
      duration: totalDuration,
      activities: dayActivities
    };
  };
  


  const calculateStreakLength = (currentDate: Date): number => {
    let streak = 0;
  
    while (true) {
      const dateString = dateToIsoDate(currentDate);
      const status = getDayStatus(dateString);
      if (status.completed) {
        streak++;
      } else if (dateString === dateToIsoDate(new Date())) {
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
    const today = dateToIsoDate(new Date());
    const todayStatus = getDayStatus(today);
    const currentStreak = calculateStreakLength(new Date());
    const longestStreak = Math.max(currentStreak, ...activities.map(activity => calculateStreakLength(new Date(activity.start_date))));
    const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = dateToIsoDate(date);
      const status = getDayStatus(dateString);
      return {
        day: 7 - i,
        minutes: status.duration,
        completed: status.duration >= DAILY_GOAL,
        activities: status.activities
      };
    });
  
    return {
      currentStreak,
      todayMinutes: todayStatus.duration,
      completed: todayStatus.completed,
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
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl font-bold">Streak Tracker</CardTitle>
        </div>
        
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
          <div className="text-sm text-orange-600">
            {!streakData.completed ? 'Keep going! Run today to continue your streak!' : ''}
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
          </div>
        </div>
        {/* Last 7 Days Timeline with Strava Links */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-sm font-medium">last 7 days</div>
          <div className="flex gap-1">
            {streakData.lastSevenDays.map((day, index) => (
              <div
                key={index}
                className={`flex-1 rounded-md p-2 text-center cursor-pointer ${day.completed ? 'bg-green-100' : 'bg-orange-100'}`}
                onClick={() => {
                  if (day.minutes >= DAILY_GOAL) {
                    setSelectedDay(day.day);
                    setSelectedDayActivities(day.activities);
                  }
                }}
                style={{ cursor: day.minutes >= DAILY_GOAL ? 'pointer' : 'not-allowed' }}      
              >
                <div className="text-xs text-green-800"><span style={{ whiteSpace: 'nowrap' }}>Day {day.day}</span></div>
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
          <Image src="/api_logo_pwrdBy_strava_stack_light.svg" alt="Powered by Strava" width={100} height={50} className="logo"/>
        </div>
      </CardContent>
      {selectedDay !== null && (
        <ActivityModal
          activities={selectedDayActivities}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </Card>
  );
};

