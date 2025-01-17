import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
  
import StreakTracker from '@/components/StreakTracker';
import StravaConnectButton from '@/components/StravaConnectButton';
import { invalidateLocalStorage } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
    }
    const athleteData = localStorage.getItem('stravaAthlete');
    if (athleteData) {
      const athlete = JSON.parse(athleteData);
      console.log(athlete.profile_medium);
      if (athlete.profile_medium && /^https?:\/\//.test(athlete.profile_medium)) {
        setProfilePicture(athlete.profile_medium);
      } else {
        console.error('Invalid profile picture URL');
      }
      setFirstName(athlete.firstname);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    invalidateLocalStorage(true);
    setIsAuthenticated(false);
    setProfilePicture(null);
    setDropdownOpen(false);
    }

  return (
    <div className="p-4">
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="absolute top right-4 p-2 rounded-md focus:outline-none"
        >
          {profilePicture ? (
              <Image src={profilePicture} alt="Profile" width={32} height={32} className="w-8 h-8 rounded-full" />
            ) : ('☰')
          }
        </button>
        {dropdownOpen && (
          <div ref={dropdownRef} className="absolute top-12 right-4 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="py-2 ml-2 mr-2">
              <li className='mb-2'>{firstName}</li>
              <li>
                <Link href="/support">
                  <span className='mr-2 font-bold'>?</span> Support 
                </Link>
              </li>
              <li>
              <Link href="/">
                {isAuthenticated && (
                    <button
                      onClick={() =>
                      handleLogout()
                      }
                      className="w-full text-left py-2 flex items-center"
                    ><span className="mr-2">🔐</span> Log out 
                    </button>
                )}
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