"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Loader } from 'lucide-react';
import { StravaActivity } from '@/types/strava';
import { getStravaActivities } from '@/lib/strava/api';

interface DayStatus {
  completed: boolean;
  duration: number;
}

interface StreakTrackerProps {
  startTimestamp: number; // Unix timestamp
}

export function StreakTracker({ startTimestamp }: StreakTrackerProps) {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async (startTimestamp: number) => {
    try {
      const token = localStorage.getItem('stravaAccessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await getStravaActivities(startTimestamp);
      setActivities(data);
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      // Clear tokens if they're invalid
      if (err instanceof Error) {
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
    const dayActivities = activities.filter(activity =>
      activity.start_date.startsWith(date) && activity.type === 'Run'
    );

    const totalDuration = dayActivities.reduce((sum, activity) =>
      sum + Math.floor(activity.moving_time / 60), 0
    );

    return {
      completed: totalDuration >= 25,
      duration: totalDuration
    };
  };

  const calculateStreakLength = (date: Date): number => {
    let streak = 0;
    let currentDate = new Date(date);

    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      const status = getDayStatus(dateString);

      if (status.completed) {
        streak++;
      } else {
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

const generateCalendarData = (startDate: number) => {
    const weeks = [];
    const today = new Date();
    const numWeeks = getWeekNumber(today, startDate);
    const start = new Date(startDate * 1000); // Convert Unix timestamp to Date object
    const dayOffset = (start.getDay() === 0 ? 6 : start.getDay() - 1); // Adjust for Monday start
  
    for (let week = 1; week <= numWeeks; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const calendarDate = new Date(start);  
        calendarDate.setDate(start.getDate() + (week - 1) * 7 + day - dayOffset);
        const dataDate =  new Date(start);
        dataDate.setFullYear(calendarDate.getFullYear());
        dataDate.setMonth(calendarDate.getMonth());
        dataDate.setDate(calendarDate.getDate()); // Add 1 day to get the correct date
        const dateString = dataDate.toISOString().split('T')[0];
        const streakLength = calculateStreakLength(dataDate);
        days.push({ date: calendarDate, status: getDayStatus(dateString), streakLength });
      }
      weeks.push({ weekNumber: week, days });
    }
  
    return weeks;
  };

  const getWeekNumber = (date: Date, startDate: number) => {
    const start = new Date(startDate * 1000); // Convert Unix timestamp to Date object
    const pastDays = (date.getTime() - start.getTime()) / 86400000;
    return Math.ceil((pastDays + (start.getDay() === 0 ? 6 : start.getDay() - 1) + 1) / 7);
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

  const calendarData = generateCalendarData(startTimestamp);
  const today = new Date();
  const startDate = new Date(startTimestamp * 1000);
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold">Streak Tracker</CardTitle>
        <Calendar className="h-6 w-6 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2">
          <div></div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-bold">{day}</div>
          ))}
          {calendarData.map((week) => (
            <React.Fragment key={week.weekNumber}>
              <div className="text-center font-bold">{`W${week.weekNumber}`}</div>
              {week.days.map(({ date, status, streakLength }) => {
                const isFutureDate = date > today;
                const isBeforeStartDate = date < startDate;
                return (
                  <div
                    key={date.toISOString()}
                    className={`p-2 rounded-lg text-center ${
                      isFutureDate || isBeforeStartDate
                        ? 'bg-white border-gray-300'
                        : status.completed 
                          ? 'bg-green-100 border-green-500' 
                          : 'bg-red-100 border-red-500'
                    } border`}
                  >
                    {!isFutureDate && !isBeforeStartDate && (
                      <div className="text-bold">
                        {streakLength}
                      </div>
                    )}
                    {!isFutureDate && !isBeforeStartDate && (
                      <div className="text-xs mt-1">
                        {status.duration}min
                      </div>
                    )}
                    </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
        Goal: Stay active and healthy by running at least 25 minutes every day!
        </div>
      </CardContent>
    </Card>
  );
}