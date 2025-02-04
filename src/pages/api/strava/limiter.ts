import { NextApiRequest, NextApiResponse } from 'next';
import accountCanMakeRequest from '@/lib/strava/ratelimit';

// server-side code
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const data  = req.body;

  if (!data || !data.account_id) {
    return res.status(400).json({ message: 'Request Limiter: invalid data' });
  } 
  const { quarterly, daily } = await accountCanMakeRequest(data.account_id); 
  if (!quarterly) {
    return res.status(429).json({ message: "Request Limiter: 15min limit exceeded" });
  } else if (!daily) {
    return res.status(429).json({ message: "Request Limiter: 24h limit exceeded" });
  }
  res.status(200).json({ message: "OK" });
}
