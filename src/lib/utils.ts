// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DayStatus, RecentDays, StravaActivity, StreakStats } from '@/types/strava';
import { MINIMUM_DURATION, GRACE_DURATION, GRACE_DISTANCE, MILESTONES } from '@/lib/strava/config';

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


export const getDayStatus = (activities: StravaActivity[], localDate: Date): DayStatus => {
  const dateString = dateToIsoDate(localDate);
  const dayActivities = activities.filter(activity => {
    // const mainType = subTypeToMainType[activity.type] || activity.type;
    return activity.start_date_local.startsWith(dateString) && activity.type === 'Run';
  });
  const totalDuration = dayActivities.reduce((sum, activity) =>
    sum + Math.floor(activity.moving_time / 60), 0
  );
  const totalDistance = dayActivities.reduce((sum, activity) =>
    sum + Math.floor(activity.distance / 1000), 0
  );
  const completed = (totalDuration >= MINIMUM_DURATION || 
    (totalDuration >= GRACE_DURATION && totalDistance >= GRACE_DISTANCE)
  );
  const startDate = dayActivities.length > 0 ? dayActivities[0].start_date_local : dateString;
  return {
    local_date: new Date(startDate),
    completed: completed,
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
      streakStartDate = status.local_date;
      if (streak === 1) {
        streakLastDate = status.local_date;
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

 export const initStreaks = (activities: StravaActivity[], localDate: Date) => {
    // console.log('initStreaks');
    const { length: currentStreak, startDate: currentStreakStartDate, lastDate: currentStreakUpdatedAt } = calculateStreakLength(activities, localDate);
    let {length: longestStreak, startDate: longestStreakStartDate}  = activities.reduce((maxStreak, activity) => {
      const streakData = calculateStreakLength(activities, new Date(activity.start_date_local));
      return streakData.length > maxStreak.length ? streakData : maxStreak;
    }, { length: 0, startDate: new Date() });
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      longestStreakStartDate = currentStreakStartDate;
    }
    const stats = calculateStreakStats(activities, currentStreakStartDate);

    return { currentStreak, longestStreak, currentStreakStartDate, currentStreakUpdatedAt, longestStreakStartDate, stats };
  };

export function calculateRecentDays(activities: StravaActivity[], localDate: Date, ) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const lastSevenDays: RecentDays[] = Array.from({ length: 7 }, (_, i) => {
    const currentDate = new Date(localDate);
    currentDate.setDate(currentDate.getDate() - i);
    const status = getDayStatus(activities, currentDate);
    return {
      index: i,
      start_date_local: status.local_date,
      weekday: weekdays[currentDate.getDay()],
      minutes: status.duration,
      completed: status.completed,
      activities: status.activities
    };
  });
  return lastSevenDays;
}
  
  
export function updateCurrentStreak(lastSevenDays: RecentDays[], currentDate: Date, 
  currentStreakUpdatedAt: Date, currentStreak: number, currentStreakStartDate: Date) {
  
  const reversedDays = [...lastSevenDays].reverse();
  for (let i = 0; i < reversedDays.length; i++) {
    const dayStatus = reversedDays[i];
    const dayString = dateToIsoDate(dayStatus.start_date_local);

    if (dayStatus.completed && dayString > dateToIsoDate(currentStreakUpdatedAt)) {
      currentStreak++;
      currentStreakUpdatedAt = new Date(dayStatus.start_date_local);
    } else if (!dayStatus.completed && dayString === dateToIsoDate(currentDate)) {
      // If today's activity is not completed, do not increment the streak
      continue;
    } else if (!dayStatus.completed) {
      currentStreak = 0;
      currentStreakStartDate = new Date(0); // epoch
      currentStreakUpdatedAt = new Date(0); // epoch
      break;
    }
  }
  const stats = calculateStreakStats(
    lastSevenDays.flatMap(day => day.activities), currentStreakStartDate); // FIME: update cum stats
  return { currentStreakUpdatedAt, currentStreak, currentStreakStartDate, stats };
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


export const getNextMilestone = (currentStreak: number): string | undefined => {
  const milestoneKeys: number[] = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);
  for (const milestone of milestoneKeys) {
    if (currentStreak < milestone) {
      return `${milestone - currentStreak} days`;
    }
  }
  return undefined;
}


export const calculateStreakStats = (activities: StravaActivity[], fromDate: Date): StreakStats => {
  // FIME: make totals cumulative. avg can be 7-days avg 
  const runs = activities.filter(
    activity => activity.type === 'Run' && 
    activity.start_date_local >= dateToIsoDate(fromDate))
  ; 
  const totalDuration = runs.reduce((acc, day) => acc + day.moving_time / 60, 0);
  const totalDistance = (runs.reduce((acc, day) => acc + day.distance / 1000, 0));
  const outdoorRuns = runs.filter(day => day.outdoors).length;
  const minimums = runs.filter(day => day.moving_time < 30*60).length;
  return {
    runs: runs.length,
    minimums,
    outdoorRuns,
    totalDuration: Math.floor(totalDuration),
    totalDistance,
    avgDuration: Math.floor(totalDuration / runs.length),
    avgDistance: Math.floor(totalDistance / runs.length),
    avgPace: totalDuration / totalDistance,
  };
};