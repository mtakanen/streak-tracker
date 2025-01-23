import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { StravaTokenData } from '@/types/strava';
import { LoadingModal } from '@/components/ui/modal';
import { useScope } from '@/context/ScopeContext';

const STRAVA_CALLBACK_PAGE = '/api/strava/callback';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledCallback = useRef(false);
  const { setScope } = useScope();

  useEffect(() => {
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');

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
        const response = await axios.post<StravaTokenData>(STRAVA_CALLBACK_PAGE, { code, scope })
        if (response.status !== 200) {
          throw new Error('Failed to exchange code');
        }
        const data = response.data;
        // Store tokens
        localStorage.setItem('stravaAccessToken', data.access_token);
        localStorage.setItem('stravaRefreshToken', data.refresh_token);
        localStorage.setItem('stravaTokenExpiry', (Date.now() + (data.expires_in * 1000)).toString());
        localStorage.setItem('stravaAthlete', JSON.stringify(data.athlete));
        // Set the scope in the global state
        setScope(scope);
        localStorage.setItem('scope', scope || '');
        // Redirect to home
        router.push('/');
      } catch (err) {
        console.error('Error during authentication:', err); // Debugging log
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
    hasHandledCallback.current = true;
  }, [searchParams, router, setScope]);

  return (
    <>
      <LoadingModal isOpen={loading} text="Authenticating..." />
      {error && (
        <Card>
          <CardContent>
            <h1>OH NOES</h1>
            <p>Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};


