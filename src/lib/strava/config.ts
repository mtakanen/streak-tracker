import dotenv from 'dotenv';
dotenv.config();

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_REDIRECT_URI = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI;
export const getInitialLoadMonths = () => parseInt(process.env.NEXT_PUBLIC_INITIAL_LOAD_MONTHS || '12');
const scope = 'activity:read_all,activity:write';

export const STRAVA_CONFIG = {
  clientId: STRAVA_CLIENT_ID, // Get from Strava API settings
  redirectUri: STRAVA_REDIRECT_URI, // Update with your redirect URI
  tokenUrl: 'https://www.strava.com/oauth/token',
  authUrl: `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=${scope}&approval_prompt=auto`
};

export const MINIMUM_DURATION = 25;
export const GRACE_DURATION = 20;
export const GRACE_DISTANCE = 5;
  

export const MILESTONES: { [key: number]: { text: string; size: 'minor' | 'major' } } = {
  1: { text: "Ta-daa! 🎉 First run!", size: 'minor' },
  2: { text: "Back-to-back run, 👌 it's a streak!", size: 'minor' },
  7: { text: "One week streak! ♨️ Can you feel it?", size: 'major' },
  10: { text: "Ten days streak! 🎯 Keep going!", size: 'minor' },
  14: { text: "Two week streak! Holding 💪 strong!", size: 'major' },
  21: { text: "Three week streak! You're on 🔥 fire!", size: 'major' },
  25: { text: "Quarter of 100 days streak 🍕 Eat a pizza!", size: 'minor' },
  31: { text: "One month streak! 🥁 You're on a roll!", size: 'major' },
  35: { text: "Five weeks streak! 🙅‍♂️ You're unstoppable!", size: 'minor' },
  42: { text: "Six weeks streak! 🤖 You're a machine!", size: 'minor' },
  50: { text: "Half of 100 days streak! 🦹 You're half-blood!", size: 'major' },
  56: { text: "Eight weeks streak! 🏄‍♂️ Floating!", size: 'minor' },
  59: { text: "Two months streak! 🎸 Play a solo!", size: 'major' },
  70: { text: "Ten weeks streak! 🎯 You're a sniper!", size: 'major' },
  90: { text: "Three months streak! ⁉️ Can you believe it?", size: 'major' },
  100: { text: "100 days streak! 🏆 You're local legend!", size: 'major' },
  120: { text: "Four months streak!", size: 'major' },
  151: { text: "Five months streak!", size: 'minor' },
  181: { text: "Six months streak! 🎉 Half a year!", size: 'major' },
  200: { text: "200 days streak!", size: 'major' },
  212: { text: "Seven months streak!", size: 'major' },
  243: { text: "Eight months streak!", size: 'major' },
  273: { text: "Nine months streak!", size: 'major' },
  304: { text: "300 days streak!", size: 'major' },
  334: { text: "Eleven months streak! 1️⃣1️⃣ Almost there!", size: 'minor' },
  365: { text: "One year streak! 🏆 You're a hero!", size: 'major' },
  999: { text: "One thousand days streak! 🎉 Game Over!", size: 'major' },
};
