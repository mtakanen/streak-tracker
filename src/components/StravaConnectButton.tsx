import React from 'react';
import Image from 'next/image';
import { getStravaAuthUrl } from '@/lib/strava/auth';

const StravaConnectButton: React.FC = () => {
  return (
    <a href={getStravaAuthUrl()}>
      <Image src="/btn_strava_connectwith_orange.svg" alt="Connect with Strava" width={193} height={48} />
    </a>
  );
};

export default StravaConnectButton;
