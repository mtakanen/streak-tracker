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
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledCallback = useRef(false);
  const { setScope } = useScope();

  useEffect(() => {
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');
    let route = '/';
    if (!code || hasHandledCallback.current) {
      return;
    }

    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (!code) {
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
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.data) {
            console.error('Error during token exchange:', error.response.data);
            route = `/?error=${encodeURIComponent(error.response.data.message)}`;      
          } else if (error.request) {
            console.error('Network error:', error.message);
            route = `/?error=${encodeURIComponent('Network error: Failed to exchange code')}`;
          } else {
            console.error('Error message:', error.message);
            route = `/?error=${encodeURIComponent(error.message)}`;  
          }
        } else {
          console.error('Unknown Error:', error);
          route = `/?error=${encodeURIComponent('Unknown error: Failed to exchange code')}`;
        }
      } finally {
        setLoading(false);
        // Redirect to home
        router.push(route);      
      }
    };

    handleCallback();
    hasHandledCallback.current = true;
  }, [searchParams, router, setScope]);

  return (
    <LoadingModal isOpen={loading} text="Authenticating..." progress={0} />
  );
};


