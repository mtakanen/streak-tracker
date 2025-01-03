'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      console.log('AuthCallback received code:', code); // Debugging log
      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        const response = await fetch('/api/strava/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code');
        }

        const data = await response.json();
        console.log('Received data:', data); // Debugging log

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
  }, [searchParams, router]);

  if (error) {
    return (
      <Card>
        <CardContent>
          <p>Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Loader className="animate-spin" />
        <p>Authenticating...</p>
      </CardContent>
    </Card>
  );
}
