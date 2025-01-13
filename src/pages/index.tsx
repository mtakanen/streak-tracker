import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
  
import StreakTracker from '@/components/StreakTracker';
import StravaConnectButton from '@/components/StravaConnectButton';
import { invalidateLocalStorage } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <div className="p-4">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="absolute top right-4 bg-gray-200 p-2 rounded-md"
        >
          Menu
        </button>
        {dropdownOpen && (
          <div className="absolute top-12 right-4 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="py-2 ml-2 mr-2">
              <li className="mb-2">
              <Link href="/support">
                Support
              </Link>
              </li>
              <li>
              <Link href="/">
                <button
                onClick={() => {
                  invalidateLocalStorage(true);
                  setIsAuthenticated(false);
                }}
                className="w-full text-left py-2"
                >
                Logout
                </button>
              </Link>
              </li>
              {/* Add more menu items here if needed */}
            </ul>
          </div>
        )}
      </div>
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