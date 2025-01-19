import { getDayStatus, calculateStreakLength, isoDateToUnixTimestamp, dateToIsoDate, invalidateLocalStorage } from './utils';
import { StravaActivity } from '../types/strava';
import 'jest-localstorage-mock';
import { updateCurrentStreak } from './utils';
import { RecentDays } from '../types/strava';

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
                { id: 1, start_date: '2023-10-01T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' }
            ];
            const date = new Date('2023-10-01T00:00:00Z');
            const status = getDayStatus(activities, date);
            expect(status.completed).toBe(true);
            expect(status.duration).toBe(90); // 1.5 hours
        });
    });
    
    describe('calculateStreakLength', () => {
        it('should return correct streak length and start date', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' },
                { id: 3, start_date: '2023-10-02T08:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(3);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-09-30');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-02');
        });

        it('gap in dates, should retrun length of 1', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date: '2023-10-02T08:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(1);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-10-02');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-02');
        });
        it('should return streak length of 0 if no activities are completed', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Morning Run' }
            ];
            const date = new Date('2023-10-02T00:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(0);
        });

        it('should keep streak even if current day is not completed yet', () => {
            const activities: StravaActivity[] = [
                { id: 1, start_date: '2023-09-30T10:00:00Z', type: 'Run', moving_time: 3600, distance: 10000, name: 'Morning Run' },
                { id: 2, start_date: '2023-10-01T12:00:00Z', type: 'Run', moving_time: 1800, distance: 5000, name: 'Afternoon Run' }
            ];
            const date = new Date('2023-10-02T12:00:00Z');
            const streak = calculateStreakLength(activities, date);
            expect(streak.length).toBe(2);
            expect(dateToIsoDate(streak.startDate)).toBe('2023-09-30');
            expect(dateToIsoDate(streak.lastDate)).toBe('2023-10-01');
        });
    });
    
    describe('updateCurrentStreak', () => {
        it('should increment streak if today\'s activity is completed and updatedAt is before today', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date: new Date('2023-10-02T00:00:00Z'), completed: true, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-10-01T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const refDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, refDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(3);
            expect(dateToIsoDate(result.currentStreakUpdatedAt)).toBe(dateToIsoDate(refDate));
        });

        it('should not increment streak if today\'s activity is not completed', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date: new Date(), completed: false, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const refDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, refDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(2);
        });

        it('should reset streak if any of the last seven days are not completed', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date: new Date(), completed: true, index: 0, weekday: 'Monday', minutes: 60, activities: [] },
                { start_date: new Date('2023-10-01T00:00:00Z'), completed: false, index: 1, weekday: 'Sunday', minutes: 0, activities: [] },
                { start_date: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const refDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, refDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(0);
            expect(result.currentStreakStartDate.getTime()).toBe(0); // epoch
        });

        it('should not reset streak if today\'s data is not completed but previous days are', () => {
            const lastSevenDays: RecentDays[] = [
                { start_date: new Date(), completed: false, index: 0, weekday: 'Monday', minutes: 0, activities: [] },
                { start_date: new Date('2023-10-01T00:00:00Z'), completed: true, index: 1, weekday: 'Sunday', minutes: 60, activities: [] },
                { start_date: new Date('2023-09-30T00:00:00Z'), completed: true, index: 2, weekday: 'Saturday', minutes: 60, activities: [] }
            ];
            const currentStreakUpdatedAt = new Date('2023-09-30T00:00:00Z');
            const currentStreak = 2;
            const currentStreakStartDate = new Date('2023-09-30T00:00:00Z');
            const refDate = new Date('2023-10-02T00:00:00Z');

            const result = updateCurrentStreak(lastSevenDays, refDate, currentStreakUpdatedAt, currentStreak, currentStreakStartDate);
            expect(result.currentStreak).toBe(2);
        });
    });

  });