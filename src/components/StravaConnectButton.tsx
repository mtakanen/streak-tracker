import React from 'react';
import Image from 'next/image';
import { STRAVA_CONFIG } from '@/lib/strava/config';

const StravaConnectButton: React.FC = () => {
  return (
    <a href={STRAVA_CONFIG.authUrl}>
      <Image src="/btn_strava_connectwith_orange.svg" alt="Connect with Strava" width={193} height={48} />
    </a>
  );
};

export default StravaConnectButton;
