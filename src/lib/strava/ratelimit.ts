import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import crypto from "crypto";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, STRAVA_API_LIMIT } from './config';

const ratelimit = new Ratelimit({
    redis: new Redis(
      {
        url: UPSTASH_REDIS_REST_URL, 
        token: UPSTASH_REDIS_REST_TOKEN
      }
    ),
    limiter: Ratelimit.slidingWindow(STRAVA_API_LIMIT, "15 m"),
    prefix: 'normirun-request',
    analytics: false,
  });
  
  export default async function accountCanMakeRequest(
    accountId: string | number
  ) {
    const encryptedAccountId = crypto
      .createHash("sha256")
      .update(accountId.toString())
      .digest("hex");
    const { success } = await ratelimit.limit(encryptedAccountId);
    return success;
  }
  