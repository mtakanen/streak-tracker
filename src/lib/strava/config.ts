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
  

export const MILESTONES: { [key: number]: string; } = {
  1: "Ta-daa! 🎉 First run!",
  2: "Back-to-back run, 👌 it's a streak!",
  7: "One week streak! ♨️ Can you feel it?",
  10: "Ten days streak! 🎯 Keep going!",
  14: "Two week streak! Holding 💪 strong!",
  21: "Three week streak! You're on 🔥 fire!",
  25: "Quarter of 100 days streak 🍕 Eat a pizza!",
  31: "One month streak! 🥁 You're on a roll!",
  35: "Five weeks streak! 🙅‍♂️ You're unstoppable!",
  42: "Six weeks streak! 🤖 You're a machine!",
  50: "Half of 100 days streak! 🦹 You're half-blood!",
  56: "Eight weeks streak! 🏄‍♂️ Floating!",
  59: "Two months streak! 🎸 Play a solo!",
  70: "Ten weeks streak! 🎯 You're a sniper!",
  90: "Three months streak! ⁉️ Can you believe it?",
  100: "100 days streak! 🏆 You're local legend!",
  120: "Four months streak!",
  151: "Five months streak!",
  181: "Six months streak! 🎉 Half a year!",
  200: "200 days streak!",
  212: "Seven months streak!",
  243: "Eight months streak!",
  273: "Nine months streak!",
  304: "300 days streak! ",
  334: "Eleven months streak! 1️⃣1️⃣ Almost there!",
  365: "One year streak! 🏆 You're a hero!",
};
