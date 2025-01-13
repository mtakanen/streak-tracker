// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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