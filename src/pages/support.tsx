import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_LOAD_MONTHS } from '@/lib/strava/config';

const SupportPage = () => {
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">normi.run Support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Instructions</h2>
          <p className="mt-2 text-gray-700">
            Here are some instructions to help you get started:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>Log in to your Strava account to start tracking your run streak</li>
            <li>Check your streaks and progress on the dashboard</li>
            <li>Streaks are calculated based on the daily 25 min goal. 
                Ensure the sum of moving time meet the daily goal to maintain your streak</li>
            <li>If you encounter any issues, log out from the menu and log in again</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Limitations</h2>
          <p className="mt-2 text-gray-700">
            Please be aware of the following limitations:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>normi.run currently supports only running activities</li>
            <li>Data synchronization with Strava may take a few minutes. Reload the page if needed</li>
            <li>Maximum streak is limited to {INITIAL_LOAD_MONTHS*30} days</li>
            <li>If you encounter any persistent issues, please contact the developer for assistance</li>
          </ul>
        </div>
        <div>
        <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="mt-2 text-gray-700">
            Your privacy is important to us.<br />
            TL;DR: <span className='font-bold'>we cannot access any of your Strava data!</span> 
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-700"></ul>
            <li>All athlete and activity data is stored in your browser&apos;s local storage only. 
              You can delete them anytime by using Log out from the Menu</li>
            <li>normi.run caches up to one week of activity data</li>
            <li>normi.run does not share your data with third parties</li>
            <li>normi.run does not use cookies or tracking scripts</li>
            <li>normi.run can rename activity back to Strava if the following permission is given upon Strava login:</li>
            <span className='italic'>Upload your activities from normi.run to Strava</span>
            <li>You can revoke access at: <a href="https://www.strava.com/settings/apps" target="_blank">https://www.strava.com/settings/apps</a></li>
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-black-600 hover:underline">
            Back to Main Page
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportPage;
