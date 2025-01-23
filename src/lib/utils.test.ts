import 'jest-localstorage-mock';

import { getDayStatus, calculateStreakLength, isoDateToUnixTimestamp, dateToIsoDate, invalidateLocalStorage, updateCurrentStreak } from './utils';
import { RecentDays, StravaActivity } from '../types/strava';

describe('Utility Functions', () => {
    describe('isoDateToUnixTimestamp', () => {
        it('should convert ISO date string to Unix timestamp', () => {
            const isoDate = '2023-10-01T00:00:00Z';
            const timestamp = isoDateToUnixTimestamp(isoDate);
            expect(timestamp).toBe(1696118400);
        });
    });

    describe('dateToIsoDate', () => {
        it('should convert Date object to ISO date string', () => {
            const date = new Date('2023-10-01T00:00:00Z');
            const isoDate = dateToIsoDate(date);
            expect(isoDate).toBe('2023-10-01');
        });
    });

    describe('invalidateLocalStorage', () => {
        beforeEach(() => {
        localStorage.clear();
        });

        it('should clear localStorage and set storageVersion if version is different', () => {
            localStorage.setItem('storageVersion', '0.9');
            invalidateLocalStorage(false);
            expect(localStorage.getItem('storageVersion')).toBe('1.0');
        });

        it('should clear localStorage and set storageVersion if force is true', () => {
            localStorage.setItem('storageVersion', '1.0');
            invalidateLocalStorage(true);
            expect(localStorage.getItem('storageVersion')).toBe('1.0');
        });

        it('should not clear localStorage if version is the same and force is false', () => {
            localStorage.setItem('storageVersion', '1.0');
            localStorage.setItem('testKey', 'testValue');
            invalidateLocalStorage(false);
            expect(localStorage.getItem('testKey')).toBe('testValue');
        });
    });

    describe('getDayStatus', () => {
        it('should return correct day status', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-10-01T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date_local: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' }
            ];
            const date = new Date('2023-10-01T00:00:00Z');
            const status = getDayStatus(activities, date);
            expect(status.completed).toBe(true);
            expect(status.duration).toBe(90); // 1.5 hours
        });
        it('5k race day + warm-up, should return completed day status', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-10-01T10:00:00Z', type: 'Run', moving_time: 19*60, distance: 5000, name: '5K Race' },
                { id: 2, start_date_local: '2023-10-01T10:30:00Z', type: 'Run', moving_time: 5*60, distance: 1000, name: 'Warm-up' }
            ];
            const date = new Date('2023-10-01T00:00:00Z');
            const status = getDayStatus(activities, date);
            expect(status.completed).toBe(true);
            expect(status.duration).toBe(24);         
        });
        it('5k race day, absolute minimum, should return completed day status', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-10-01T10:00:00Z', type: 'Run', moving_time: 20*60, distance: 5000, name: '5K Race' },
            ];
            const date = new Date('2023-10-01T00:00:00Z');
            const status = getDayStatus(activities, date);
            expect(status.completed).toBe(true);
            expect(status.duration).toBe(20);         
        });

    });
    
    describe('calculateStreakLength', () => {
        it('should handle timezone differences correctly (user in Calgary, server in Washington)', () => {
            const activities: StravaActivity[] = [
            { id: 1, start_date_local: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
            { id: 2, start_date_local: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' },
            { id: 3, start_date_local: '2023-10-02T23:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Evening Run' }
            ];
            // Calgary is UTC-6, Washington is UTC-4
            const dateInCalgary = new Date('2023-10-02T23:00:00'); // 2023-10-03T05:00:00Z
            const dateInWashington = new Date('2023-10-03T01:00:00'); // 2023-10-03T05:00:00Z
            const dateUTC = new Date('2023-10-03T05:00:00Z')
            const streakCalgary = calculateStreakLength(activities, dateInCalgary);
            const streakWashington = calculateStreakLength(activities, dateInWashington);
            const streakUTC = calculateStreakLength(activities, dateUTC);

            expect(dateToIsoDate(streakCalgary.lastDate)).toBe('2023-10-02');
            expect(streakCalgary.length).toBe(3);
            expect(dateToIsoDate(streakCalgary.startDate)).toBe('2023-09-30');
            expect(streakUTC.length).toBe(3);
            expect(streakWashington.length).toBe(3);
            expect(dateToIsoDate(streakWashington.startDate)).toBe('2023-09-30');
            expect(dateToIsoDate(streakWashington.lastDate)).toBe('2023-10-02');
        });

        it('should return correct streak length and start date', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date_local: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' },
                { id: 3, start_date_local: '2023-10-02T08:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(3);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-09-30');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-02');
        });

        it('gap in dates, should retrun length of 1', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date_local: '2023-10-02T08:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(1);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-10-02');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-02');
        });
        it('should return streak length of 0 if no activities are completed', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(0);
        });

        it('should keep streak even if current day is not completed yet', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date_local: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date_local: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' }
            ];
            const date = new Date('2023-10-02T12:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(2);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-09-30');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-01');
        });
    });

    describe('updateCurrentStreak', () => {
        it('should handle timezone differences correctly (user in Calgary, server in Washington)', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-10-02T23:00:00Z'), completed: true, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T12:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-09-30T10:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-10-01T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T23:30:00'); // local time

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(3);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(currentDate));
        });
        it('should increment streak if today\'s activity is completed and updatedAt is before today', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-10-02T00:00:00Z'), completed: true, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-10-01T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(3);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(currentDate));
        });
        it('should not reset streak if today\'s data is not completed but previous days are', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 0, weekday: 'Saturday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-02T00:00:00Z'), completed: false, index: 2, weekday: 'Monday', minutes: 0, activities: [] }
            ];
            const currentStreak = 1;
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(2);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(new Date('2023-10-01T00:00:00Z')));
        });
        it('should increment streak if past activities are completed and updatedAt is before', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-10-02T00:00:00Z'), completed: true, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }

            ];
            const currentStreak = 3;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(5);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(currentDate));
        });
        it('should increment streak if past activities are completed, today not and updatedAt is before', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-10-02T00:00:00Z'), completed: false, index: 0, weekday: 'Monday', minutes: 6, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }

            ];
            const currentStreak = 3;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(4);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(new Date('2023-10-01T00:00:00Z')));
        });

        it('should not increment streak if today\'s activity is not completed', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 0, weekday: 'Saturday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: false, index: 1, weekday: 'Sunday', minutes: 6, activities: [] }
            ];
            const currentStreak = 2;
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-01T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(2);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(currentStreakUpdatedAt));
        });

        it('should reset streak if any of the last seven days older than current are not completed', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date_local: new Date('2023-09-30T00:00:00Z'), completed: true, index: 0, weekday: 'Saturday', minutes: 60, activities: [] },
                { start_date_local: new Date('2023-10-01T00:00:00Z'), completed: false, index: 1, weekday: 'Sunday', minutes: 0, activities: [] },
                { start_date_local: new Date('2023-10-02T00:00:00Z'), completed: true, index: 2, weekday: 'Monday', minutes: 60, activities: [] }

            ];
            const currentStreak = 2;
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const currentDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, currentDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(0);
            expect(result.currentStreakStartDate.getTime()).toBe(0); // epoch
        });
    });
  });
