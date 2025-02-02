import axios from 'axios';
import Link from 'next/link';
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
        setLoading(true);
        const response = await axios.post<StravaTokenData>(STRAVA_CALLBACK_PAGE, { code, scope })
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
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.data) {
            console.error('Error during token exchange:', error.response.data);
            setError(error.response.data.message);        
          } else if (error.request) {
            console.error('Network error:', error.message);
            setError('Network error: Failed to refresh token');
          } else {
            console.error('Error message:', error.message);
          }
        } else {
          console.error('Unknown Error:', error);
      }
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
    hasHandledCallback.current = true;
  }, [searchParams, router, setScope]);

  return (
    <>
      <LoadingModal isOpen={loading} text="Authenticating..." progress={0} />
    {error && (
        <Card>
          <CardContent>
            <h1>OH NOES!</h1>
            <p>{error}</p>
            <div className="text-center mt-4">
              <Link href="/" className="text-black-600 hover:underline">
                Back to Main Page
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};


