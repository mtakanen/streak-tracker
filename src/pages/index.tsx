import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { getStravaAuthUrl } from '@/lib/strava/auth';
import { StreakTracker } from '@/components/StreakTracker';
import { isoDateToUnixTimestamp } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const startTimestamp = isoDateToUnixTimestamp('2024-12-24'); 

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthorize = () => {
    const authUrl = getStravaAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <div>
      <div>
        <Image priority src="/25.png" alt="25 for 25" width={90} height={90} />
      </div>
      {isAuthenticated ? (
        <StreakTracker startTimestamp={startTimestamp} />
      ) : (
        <button onClick={handleAuthorize}>Authorize with Strava</button>
      )}
    </div>
  );
};

export default HomePage;