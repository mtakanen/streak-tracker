// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isoDateToUnixTimestamp = (isoDate: string): number => {
  return new Date(isoDate).getTime() / 1000;
};
