import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_MINIMUM, INITIAL_LOAD_MONTHS } from '@/lib/strava/config';

const SupportPage = () => {
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Normi Run Support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Instructions</h2>
          <p className="mt-2">
            Normi Run is a simple app that helps you maintain a running streak.
            Here are some instructions to help you get started:
          </p>
          <ol className="list-disc list-inside mt-2">
            <li>Start by setting your daily minimum duration and streak goal from the settings menu
            </li>
            <li>Log in to your Strava account to start tracking your run streak.
            For that app requires to get access to your activities. 
            On Strava Authorization page you must check at least:
            <span className='italic'>View data about your activities</span></li>
            <li>If you want to track from your private activities, also check 
              <span className='italic'>View data about your private activities</span>
            </li>
            <li>App can rename activity back to Strava. If you wish to do that also check: <span className='italic'>
              Upload your activities from Normi Run to Strava</span></li>
          </ol>
          <p className="mt-2">
            After you connect with Strava, you can start tracking your run streak:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>Dashboard shows your current streak, upcoming milestone and runs from the previous 7 days</li>
            <li>Streak calculation is based on the daily minimum goal duration in the settings (by default {DEFAULT_MINIMUM}min). 
                Ensure the sum of daily moving time meet the goal to maintain your streak!</li>
            <li>Streak statistics are shown when today minutes is clicked</li>
            <li>Previous 7 days shows completed runs as green. Clicking any of those days shows activity&apos;s name and link back to Strava</li>
            <li>If you encounter any issues, log out from the menu and log in again</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Limitations</h2>
          <p className="mt-2">
            Please be aware of the following limitations:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>normi.run currently supports only running activities</li>
            <li>Data synchronization with Strava may take a few minutes. Reload the page if needed</li>
            <li>Maximum streak is limited to {INITIAL_LOAD_MONTHS*30.5} days</li>
            <li>Minimum duration can only be changed before Strava login</li>
            <li>The number of requests to the Strava API is limited on a 15-minute and 24-hour basis. 
              When the user-specific request quota is reached, further requests are blocked for the next 15-minute or 24-hour intervals, respectively.</li>
            <li>If you encounter any persistent issues, please contact the developer for assistance</li>
          </ul>
        </div>
        <div>
        <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="mt-2">
            Your privacy is important to us.<br />
            TL;DR: <span className='font-bold'>we cannot access any of your Strava data!</span> 
            </p>
            <ul className="list-disc list-inside mt-2"></ul>
            <li>All athlete and activity data is stored in your browser&apos;s local storage only. 
              You can delete them anytime by using Log out from the Menu</li>
            <li>normi.run caches up to one week of Strava activity data</li>
            <li>normi.run caches derived data (such as streak and statistics) as long as user is logged in the app</li>
            <li>normi.run does not share your data with third parties</li>
            <li>normi.run stores an anonymized user identifier in Upstash/Redis to limit the number of requests to the Strava API.
               This helps ensure fair usage and prevents exceeding Strava&apos;s rate limits.</li>
            <li>normi.run uses <a href="https://vercel.com/products/observability" target="_blank" className="text-black-600 hover:underline">Vercel Analytics</a> to monitor app performance. 
            Analytics is fully anonymous</li>
            <li>You can revoke app access at: <a href="https://www.strava.com/settings/apps" target="_blank" className="text-black-600 hover:underline">https://www.strava.com/settings/apps</a></li>
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
