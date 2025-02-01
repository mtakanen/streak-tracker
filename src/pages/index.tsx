import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import StreakTracker from '@/components/StreakTracker';
import StravaConnectButton from '@/components/StravaConnectButton';
import UserMenu from '@/components/UserMenu';
import { invalidateLocalStorage, getGoal } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsDisabled, setSettingsDisabled] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [firstName, setFirstName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('stravaAccessToken');
    if (accessToken) {
      setIsAuthenticated(true);
      setSettingsDisabled(true);
    }
    const athleteData = localStorage.getItem('stravaAthlete');
    if (athleteData) {
      const athlete = JSON.parse(athleteData);
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
    setProfilePicture(undefined);
    setFirstName(null);
    setDropdownOpen(false);
    setSettingsDisabled(false);

  };
  const [icon, setIcon] = useState('/normi.svg');
  useEffect(() => {
    const icon = getGoal() === 2525 ? '/2525.png' : '/normi.svg';
    setIcon(icon);
  }, []);

  return (
    <div className="p-4">
      <div className="relative">
        <UserMenu
          profilePicture={profilePicture}
          firstName={firstName || ''}
          isAuthenticated={isAuthenticated}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          handleLogout={handleLogout}
          dropdownRef={dropdownRef}
          settingsDisabled={settingsDisabled}
        />
      </div>
      <div className="flex justify-center mb-4">
        <Link href="/">
          <Image src={icon} priority alt="flame" width={80} height={80} />        
        </Link>
      </div>

      {isAuthenticated ? (
        <StreakTracker />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Normi Run</h1>
          <p className="mb-2">Track running streak using your Strava</p>
          <p className="mb-2">App requires to <span className='italic'>View data about your (public) activities</span></p>
          <p className="mb-4">Please connect with Strava to get started</p>
          <div className="flex justify-center">
            <StravaConnectButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;