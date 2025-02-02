import { NextApiRequest, NextApiResponse } from 'next';
import {STRAVA_CONFIG} from '@/lib/strava/config';
import accountCanMakeRequest from '@/lib/strava/ratelimit';

// server-side code
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { code,scope }  = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  // console.log('POST /api/strava/callback code,scope:', code,scope);
  try {
    const response = await fetch(STRAVA_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to exchange code:', errorText);
      throw new Error('Failed to exchange Strava API code');
    }

    const data = await response.json();
    if (!data) {
        return res.status(400).json({ error: "Invalid code" });
    }
    if (!(await accountCanMakeRequest(data.athlete.id))) {
      return res.status(429).json({ message: "Account exceeded API request limit" });
    }
    // Check if the scope field is present in the response
    const grantedScope = data.scope || scope || 'No scope granted';
    // console.log('Granted scopes:', grantedScope);
    res.status(200).json({ ...data, grantedScope });
  } catch (error) {
    console.error('Error in /api/strava/callback:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}