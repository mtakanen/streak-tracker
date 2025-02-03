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
  } else if (!(await accountCanMakeRequest(data.account_id))) {
    return res.status(429).json({ message: "Request Limiter: 15min request limit exceeded" });
  } else {
    res.status(200).json({ message: "OK" });
  }
}
