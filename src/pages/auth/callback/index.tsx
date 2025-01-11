import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingModal } from '@/components/ui/modal';
import StreakTracker from '@/components/StreakTracker';
import { StravaTokenData } from '@/types/strava';

const STRAVA_CALLBACK_PAGE = '/api/strava/callback';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || hasHandledCallback.current) {
      return;
    }

    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        const response = await axios.post<StravaTokenData>(STRAVA_CALLBACK_PAGE, { code })
        if (response.status !== 200) {
          throw new Error('Failed to exchange code');
        }
        const data = response.data;
        // Store tokens
        localStorage.setItem('stravaAccessToken', data.access_token);
        localStorage.setItem('stravaRefreshToken', data.refresh_token);
        localStorage.setItem('stravaTokenExpiry', (Date.now() + (data.expires_in * 1000)).toString());

        // Redirect to home
        router.push('/');
      } catch (err) {
        console.error('Error during authentication:', err); // Debugging log
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
    hasHandledCallback.current = true;

  }, [searchParams, router]);

  if (error) {
    return (
      <Card>
        <CardContent>
          <h1>OH NOES</h1>
          <p>Error: {error}</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <>
      <LoadingModal isOpen={true} text="Authenticating" />
      <StreakTracker />
    </>
  );
};