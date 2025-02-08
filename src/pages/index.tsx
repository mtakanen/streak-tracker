import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
//import { useRouter } from 'next/router';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StreakTracker from '@/components/StreakTracker';
import StravaConnectButton from '@/components/StravaConnectButton';
import UserMenu from '@/components/UserMenu';
import { ErrorContent } from '@/components/NormiContent';
import { invalidateLocalStorage, getGoal } from '@/lib/utils';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [multisport, setMultisport] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsDisabled, setSettingsDisabled] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [firstName, setFirstName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
    // Check for error in query parameters
    const isMultiSport = (
      searchParams.has('multisport') && (searchParams.get('multisport') || 'true') === 'true' || 
      (localStorage.getItem('multiSport') || 'false') == 'true');
    if (searchParams.has('error')) {
      setError(searchParams.get('error'));
    } else if (isMultiSport) {
      setMultisport(true);
      localStorage.setItem('multiSport', 'true');
    } else {
      setMultisport(false);
      localStorage.setItem('multiSport', 'false');
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => {
        clearTimeout(timer);
        router.replace('/');
      }
    }
  }, [error, router]);

  return (
    <div className="p-4">
      {error && (
        <ErrorContent error={error} />
      )}
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
        <>
        <h1 className="text-center text-2xl font-bold mb-4">Welcome to Normi {multisport? 'Sport': 'Run'}</h1>
        <div className="flex justify-center">
          <div className="text-left">
            <p className="mb-2">Track your {multisport ? 'activity': 'run'} streak from Strava</p>
            <ul>To get started:</ul>
            <ol className="list-decimal list-inside mb-4">
              <li>Set daily minimum and streak goal in the Menu Settings</li>
              <li>Connect with Strava</li>
            </ol>
            <p>App requires: <span className='italic'>View data about your (public) activities</span></p>
            <div className="mt-4 flex justify-center">
              <StravaConnectButton />
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
};

export default HomePage;