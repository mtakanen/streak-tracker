import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SupportPage = () => {
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Instructions</h2>
          <p className="mt-2 text-gray-700">
            Welcome to the Streak Tracker support page. Here are some instructions to help you get started:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>Log in to your Strava account to start tracking your run streak.</li>
            <li>Check your streaks and progress on the dashboard.</li>
            <li>Streaks are calculated based on the daily 25 min goal. 
                Ensure the sum of moving time meet the daily goal to maintain your streak.</li>
            <li>If you encounter any issues, Logout from the menu and log in again.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Limitations</h2>
          <p className="mt-2 text-gray-700">
            Please be aware of the following limitations:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-700">
            <li>The app currently supports only running activities.</li>
            <li>Data synchronization with Strava may take a few minutes.</li>
            <li>If you encounter any persistent issues, please contact our support team for assistance.</li>
          </ul>
        </div>
        <div>
        <h2 className="text-xl font-semibold">Privacy</h2>
            <p className="mt-2 text-gray-700">
            Your privacy is important to us. Here are some details on how we handle your data:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-700"></ul>
            <li>To find your initial streak app reads your Strava activities up to one year.</li>
            <li>App caches up to one week of your Strava data.</li>
            <li>App does not write anything to your Strava account.</li>
            <li>App does not share your data with third parties.</li>
            <li>App does not use cookies or tracking scripts.</li>
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Main Page
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportPage;
