// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DayStatus, DayEntry, StravaActivity, StreakStats } from '@/types/strava';
import { DEFAULT_MINIMUM, GRACE_DURATION, GRACE_DISTANCE, MILESTONES, STORAGE_VERSION } from '@/lib/strava/config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isoDateToUnixTimestamp = (isoDate: string): number => {
  return new Date(isoDate).getTime() / 1000;
};

export const dateToIsoDate = (date: Date): string => {
  if (!(date instanceof Date)) {
    console.log('date: '+ date);
    throw new TypeError('Invalid date object');
  }
  return date.toISOString().split('T')[0];
};

export function dateReviver(this: unknown, key: string, value: string | null | object): unknown {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  if (typeof value === 'string' && dateFormat.test(value)) {
    return new Date(value);
  }
  return value;
}

export const getMinimumDuration = () => {
  const storedDuration = localStorage.getItem('minimumDuration');
  return storedDuration ? parseInt(storedDuration) : DEFAULT_MINIMUM;
}

export const getGoal = () => {
  const storedGoal = localStorage.getItem('goalDays');
  return storedGoal ? parseInt(storedGoal) : 0;
}

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
    return activity.start_date_local.startsWith(dateString);
  });
  const minimumDuration = getMinimumDuration();
  const totalDuration = dayActivities.reduce((sum, activity) =>
    sum + Math.floor(activity.moving_time / 60), 0
  );
  const totalDistance = dayActivities.reduce((sum, activity) =>
    sum + activity.distance / 1000, 0
  );
  const completed = (totalDuration >= minimumDuration || 
    // FIXME: Grace period for any minimum duration
    (totalDuration >= minimumDuration - GRACE_DURATION && totalDistance >= GRACE_DISTANCE)
  );
  const isMinimumDay = totalDuration < (minimumDuration + 5);
  const outdoorRuns = dayActivities.filter(day => day.outdoors).length;
  const startDate = dayActivities.length > 0 ? dayActivities[0].start_date_local : dateString;
  return {
    local_date: new Date(startDate),
    completed: completed,
    duration: totalDuration,
    distance: totalDistance,
    runs: dayActivities.length,
    isMinimumDay,
    outdoorRuns,
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
    const stats = calculateInitStats(activities, currentStreakStartDate);
    return { currentStreak, longestStreak, currentStreakStartDate, currentStreakUpdatedAt, longestStreakStartDate, stats };
  };

export function calculateDayEntries(activities: StravaActivity[], localDate: Date, ): DayEntry[] {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const lastSevenDays: DayEntry[] = Array.from({ length: 7 }, (_, i) => {
    const currentDate = new Date(localDate);
    currentDate.setDate(currentDate.getDate() - i);
    const status = getDayStatus(activities, currentDate);
    return {
      index: 6 - i,
      weekday: weekdays[currentDate.getDay()],
      local_date: status.local_date,
      completed: status.completed,
      duration: status.duration,
      distance: status.distance,
      runs: status.runs,
      isMinimumDay: status.isMinimumDay,
      outdoorRuns: status.outdoorRuns,
      activities: status.activities
    };
  });
  return lastSevenDays.reverse();
}
  
  
export function updateCurrentStreak(lastSevenDays: DayEntry[], currentDate: Date, 
  currentStreakUpdatedAt: Date, currentStreak: number, currentStreakStartDate: Date, stats: StreakStats): {
  currentStreakUpdatedAt: Date, currentStreak: number, currentStreakStartDate: Date, stats: StreakStats } {
  
  //const reversedDays = [...lastSevenDays].reverse();
  for (let i = 0; i < lastSevenDays.length; i++) {
    const dayEntry = lastSevenDays[i];
    const dayString = dateToIsoDate(dayEntry.local_date);

    if (dayEntry.completed && dayString > dateToIsoDate(currentStreakUpdatedAt)) {
      currentStreak++;
      currentStreakUpdatedAt = new Date(dayEntry.local_date);
      if (currentStreak === 1) {
        currentStreakStartDate = new Date(dayEntry.local_date);
      }
      // increment stats
      accumulateDailyStats(stats, dayEntry);

    } else if (!dayEntry.completed && dayString === dateToIsoDate(currentDate)) {
      // If today's activity is not completed, do not increment the streak
      continue;
    } else if (!dayEntry.completed) {
      currentStreak = 0;
      resetStreakStats(stats);
      currentStreakStartDate = new Date(0); // epoch
      currentStreakUpdatedAt = new Date(dayString); // epoch
    }
  }
  
  return { currentStreakUpdatedAt, currentStreak, currentStreakStartDate, stats };
}

export const isMilestoneDay = (currentStreak: number, todayCompleted: boolean, 
  lastUpdated: Date, nextMilestone: number): boolean => {
  return ( Object.keys(MILESTONES).includes(currentStreak.toString()) && 
  dateToIsoDate(lastUpdated) === dateToIsoDate(new Date()))  ||
    ( nextMilestone === 1 && !todayCompleted && 
      dateToIsoDate(lastUpdated) < dateToIsoDate(new Date())) ;
}

export const getDaysToNextMilestone = (currentStreak: number): number => {
  const milestoneKeys: number[] = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);
  for (const milestone of milestoneKeys) {
    if (currentStreak < milestone) {
      return milestone - currentStreak;
    }
  }
  return Infinity;
}


export const calculateInitStats = (activities: StravaActivity[], fromDate: Date): StreakStats => {
  const runs = activities.filter(activity => activity.start_date_local >= dateToIsoDate(fromDate)); 
  const totalDuration = runs.reduce((acc, day) => acc + day.moving_time / 60, 0);
  const totalDistance = (runs.reduce((acc, day) => acc + day.distance / 1000, 0));
  const outdoorRuns = runs.filter(day => day.outdoors).length;
  const minimums = runs.filter(day => day.moving_time < 30*60).length;
  return {
    runs: runs.length,
    minimumDays: minimums,
    outdoorRuns,
    totalDuration: Math.floor(totalDuration),
    totalDistance,
  };
};

function accumulateDailyStats(stats: StreakStats, dayEntry: DayEntry) {
  stats.runs += dayEntry.runs;
  stats.minimumDays += dayEntry.isMinimumDay ? 1 : 0;
  stats.outdoorRuns += dayEntry.outdoorRuns;
  stats.totalDuration += dayEntry.duration;
  stats.totalDistance += dayEntry.distance;
}

function resetStreakStats(stats: StreakStats) {
  stats.runs = 0;
  stats.minimumDays = 0;
  stats.outdoorRuns = 0;
  stats.totalDuration = 0;
  stats.totalDistance = 0;
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
