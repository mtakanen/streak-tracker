import Image from 'next/image';
import { RefObject } from 'react';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';

interface UserMenuProps {
  profilePicture?: string;
  firstName: string;
  isAuthenticated: boolean;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  handleLogout: () => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
}

const UserMenu: React.FC<UserMenuProps> = ({
  profilePicture,
  firstName,
  isAuthenticated,
  dropdownOpen,
  setDropdownOpen,
  handleLogout,
  dropdownRef,
}) => {
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="absolute top right-4 p-2 rounded-md focus:outline-none"
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
          className="absolute top-12 right-4 bg-white border border-gray-300 rounded-md shadow-lg"
        >
          <ul className="py-2 ml-2 mr-2">
            <li className="mb-2">{firstName}</li>
            <li>
              <Link href="/support">
                <span className="mr-2 font-bold">?</span> Support
              </Link>
            </li>
            <li>
              <Link href="/">
                {isAuthenticated && (
                  <button
                    onClick={() => handleLogout()}
                    className="w-full text-left py-2 flex items-center"
                  >
                    <span className="mr-2">🔐</span> Log out
                  </button>
                )}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
