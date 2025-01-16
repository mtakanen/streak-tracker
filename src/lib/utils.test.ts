import { getDayStatus, calculateStreakLength, isoDateToUnixTimestamp, dateToIsoDate, invalidateLocalStorage } from './utils';
import { StravaActivity } from '../types/strava';
import 'jest-localstorage-mock';

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
  });