import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import crypto from "crypto";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, STRAVA_API_LIMIT } from './config';

const redis = new Redis(
    {
        url: UPSTASH_REDIS_REST_URL, 
        token: UPSTASH_REDIS_REST_TOKEN
    }
);
const ratelimit = {
    quarterlyLimit: new Ratelimit({
          redis,
          prefix: "normirun-15m",
          analytics: false,
          limiter: Ratelimit.slidingWindow(STRAVA_API_LIMIT, "15 m"),
        }),
    dailyLimit: new Ratelimit({
          redis,
          prefix: "normirun-24h",
          analytics: false,
          limiter: Ratelimit.slidingWindow(STRAVA_API_LIMIT * 3, "24h"),
        }),
};
  
export default async function accountCanMakeRequest(
    accountId: string | number
  ) {
    const encryptedAccountId = crypto
      .createHash("sha256")
      .update(accountId.toString())
      .digest("hex");
    const quarterly  = await ratelimit.quarterlyLimit.limit(encryptedAccountId);
    const daily  = await ratelimit.dailyLimit.limit(encryptedAccountId);
    return { quarterly: quarterly.success, daily: daily.success };
  }
  