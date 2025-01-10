import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import StreakTracker from '@/components/StreakTracker';
import StravaConnectButton from '@/components/StravaConnectButton';
import { isoDateToUnixTimestamp } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fromTimestamp = isoDateToUnixTimestamp('2024-10-01');

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-center mb-4">
        <Image priority src="/25.png" alt="25 for 25" width={90} height={90} />
      </div>
      {isAuthenticated ? (
        <StreakTracker />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Streak Tracker!</h1>
          <p className="mb-2">App tracks your streak using your Strava activities.</p>
          <p className="mb-4">Please connect with Strava to get started.</p>
          <div className="flex justify-center">
            <StravaConnectButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;