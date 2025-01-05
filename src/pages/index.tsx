import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { StreakTracker } from '@/components/StreakTracker';
import { isoDateToUnixTimestamp } from '@/lib/utils';
import StravaConnectButton from '@/components/StravaConnectButton';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const startTimestamp = isoDateToUnixTimestamp('2025-01-01'); 

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
    }
  }, []);


  return (
    <div className="mt-4 ml-4">
      <div>
        <Image priority src="/25.png" alt="25 for 25" width={90} height={90} />
      </div>
      <h1 className="mt-4 text-2xl font-bold">Streak Tracker</h1>
      {isAuthenticated ? (
        <StreakTracker startTimestamp={startTimestamp} />
      ) : (
        <div className="mt-4">
          <p>Welcome to Streak Tracker!</p>
          <p>This app tracks your streak using your Strava activities</p>
          <div className="mt-4">
            <p>Please connect with Strava to get started.</p>
            <StravaConnectButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;