import React, { useState } from 'react';
import Image from 'next/image';
import { SettingsIcon, HelpCircleIcon, LogOutIcon } from 'lucide-react';
import { RefObject } from 'react';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import Settings from './Settings';
import { DEFAULT_MINIMUM } from '@/lib/strava/config';

interface UserMenuProps {
  profilePicture?: string;
  firstName: string;
  isAuthenticated: boolean;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  handleLogout: () => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
  settingsDisabled: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({
  profilePicture,
  firstName,
  isAuthenticated,
  dropdownOpen,
  setDropdownOpen,
  handleLogout,
  dropdownRef,
  settingsDisabled,
}) => {

    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSaveSettings = ({ duration, goal, multiSport }: { duration: number; goal: number, multiSport: boolean }) => {
        localStorage.setItem('goalDays', goal.toString());
        localStorage.setItem('multiSport', multiSport.toString());
        const reload = localStorage.getItem('goalDays') !== goal.toString();
        if (reload) window.location.reload();
        if (multiSport) {
            window.location.href = '/?multisport=' + multiSport
        } else {  
            window.location.href = '/';
        }
        if (duration > 0) {
            localStorage.setItem('minimumDuration', duration.toString());
            setSettingsOpen(false);
        } else {    
            setSettingsOpen(true);
        }
    };

    const getInitialSettings = () => {
        return {
            duration: Number(localStorage.getItem('minimumDuration')) || DEFAULT_MINIMUM,
            goal: Number(localStorage.getItem('goalDays')) || 0,
            multiSport: localStorage.getItem('multiSport') === 'true'
        };
    };
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="absolute top right-4 p-4 rounded-md focus:outline-none"
      >
        {profilePicture ? (
          <Image
            src={profilePicture}
            alt="Profile"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <MenuIcon className="w-8 h-8" />
        )}
      </button>
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-12 right-4 bg-primary border border-border rounded-md shadow-lg"
        >
          <ul className="py-2 ml-3 mr-3">
            <li className="mb-2">{firstName}</li>
            <li>
              <button
                onClick={() => setSettingsOpen(true)}
                className="py-2 flex"
              ><SettingsIcon/>Settings
              </button>
            </li>
            <li>
              <Link className="py-2 flex"
                href="/support"><HelpCircleIcon />Support</Link>
            </li>
            <li>
              <Link href="/">
                {isAuthenticated && (
                  <button
                    onClick={() => handleLogout()}
                    className="py-2 flex"
                  >
                    <LogOutIcon/>Log out
                  </button>
                )}
              </Link>
            </li>
          </ul>
        </div>
      )}
      {settingsOpen && (
        <div className="absolute top-12 right-4">
          <Settings
            initialSettings={getInitialSettings()}
            onSave={handleSaveSettings}
            onCancel={() => setSettingsOpen(false)}
            settingsDisabled={settingsDisabled}
          />
        </div>
      )}
    </div>
  );
};

export default UserMenu;
