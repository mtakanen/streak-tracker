import { NextApiRequest, NextApiResponse } from 'next';

const TOKEN_URL = 'https://www.strava.com/oauth/token';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  console.log('POST /api/strava/callback code:', code);
  try {
    const response = await fetch(TOKEN_URL, {
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
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();
    /** console.log('Received data from Strava:', data); */
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/strava/callback:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
}