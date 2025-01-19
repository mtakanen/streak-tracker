// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DayStatus, RecentDays, StravaActivity } from '@/types/strava';
import { DAILY_GOAL } from '@/lib/strava/config';
const STORAGE_VERSION = '1.0';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isoDateToUnixTimestamp = (isoDate: string): number => {
  return new Date(isoDate).getTime() / 1000;
};

export const dateToIsoDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const invalidateLocalStorage = (force: boolean) => {
    const storedVersion = localStorage.getItem('storageVersion');
    if (storedVersion !== STORAGE_VERSION || force) {
      localStorage.clear();
      localStorage.setItem('storageVersion', STORAGE_VERSION);
    }
  };


export const getDayStatus = (activities: StravaActivity[], date: Date): DayStatus => {
  const dateString = dateToIsoDate(date);
  const dayActivities = activities.filter(activity => {
    // const mainType = subTypeToMainType[activity.type] || activity.type;
    return activity.start_date.startsWith(dateString) && activity.type === 'Run';
  });

  const totalDuration = dayActivities.reduce((sum, activity) =>
    sum + Math.floor(activity.moving_time / 60), 0
  );
  const startDate = dayActivities.length > 0 ? dayActivities[0].start_date : dateString;
  return {
    date: new Date(startDate),
    completed: totalDuration >= DAILY_GOAL,
    duration: totalDuration,
    activities: dayActivities
  };
};



export const calculateStreakLength = (activities: StravaActivity[], toDate: Date): 
  { length: number, startDate: Date, lastDate: Date }  => {
  let streak = 0;
  const activityDate = new Date(toDate);
  let streakStartDate = new Date(toDate);
  let streakLastDate = new Date(toDate);
  const toDateString = dateToIsoDate(toDate)
  while (true) {
    const status = getDayStatus(activities, activityDate);
    if (status.completed) {
      streak++;
      streakStartDate = status.date;
      if (streak === 1) {
        streakLastDate = status.date;
      }
    } else if (dateToIsoDate(activityDate) === toDateString) {
      // current day is not completed yet, skip
      activityDate.setDate(activityDate.getDate() - 1);
      continue;
    } else {
      // day not completed, break the streak
      break;
    }
    activityDate.setDate(activityDate.getDate() - 1);
  }

  return { length: streak, startDate: streakStartDate, lastDate: streakLastDate };
};

export function updateCurrentStreak(lastSevenDays: RecentDays[], refDate: Date, currentStreakUpdatedAt: Date, currentStreak: number, currentStreakStartDate: Date) {
  const todayString = dateToIsoDate(new Date());
  const todayStatus = lastSevenDays[0];
  if (todayStatus.completed && currentStreakUpdatedAt.getDate() < refDate.getDate()) {
    currentStreak++;
    currentStreakUpdatedAt = refDate;
  }

  for (let i = 0; i < lastSevenDays.length; i++) {
    // never break streak from today's data 
    if (dateToIsoDate(lastSevenDays[i].start_date) === todayString) {
      continue;
    }
    if (!lastSevenDays[i].completed) {
      console.log('streak broken!');
      currentStreak = 0;
      currentStreakStartDate = new Date(0); // epoch
      break;
    }
  }
  return { currentStreakUpdatedAt, currentStreak, currentStreakStartDate };
}

/*
const subTypeToMainType: { [key: string]: string; } = {
  TrailRun: 'Run',
  VirtualRun: 'Run',
  VirtualRide: 'Ride',
  NordicSki: 'Ski',
  AlpineSki: 'Ski',
  BackcountrySki: 'Ski',
  // Add more sub-types and their main categories as needed
};
*/