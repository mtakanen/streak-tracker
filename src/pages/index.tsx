import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { getStravaAuthUrl } from '@/lib/strava/auth';
import { StreakTracker } from '@/components/StreakTracker';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        <StreakTracker />
      ) : (
        <button onClick={handleAuthorize}>Authorize with Strava</button>
      )}
    </div>
  );
};

export default HomePage;