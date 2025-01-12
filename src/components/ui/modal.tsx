import { Loader } from 'lucide-react';
import { StravaActivity } from '@/types/strava';

const ACTIVITY_URL = 'https://www.strava.com/activities';

const activityTypeSymbols: { [key: string]: string } = {
  Run: '👟',
  Ride: '🚲',
  Swim: '🏊‍♂️',
  Walk: '🚶‍♂️',
  Ski: '🎿',
  Skate: '⛸️',
  // Add more activity types and symbols as needed
};

const ActivityModal = ({ activities, weekday, onClose }: { activities: StravaActivity[], weekday: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg max-w-md w-full relative">
      <h2 className="text-xl font-bold mb-4">{weekday} {new Date(activities[0].start_date).toLocaleDateString()}</h2>
      <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>X</button>
      {activities.map(activity => (
        <div key={activity.id} className="mb-2">
          <div className="text-xs">{activityTypeSymbols[activity.type] || ''} {activity.name} {Math.floor(activity.moving_time / 60)}min</div>
          <a 
            href={`${ACTIVITY_URL}/${activity.id}`}
            className="text-[#FC4C02] hover:underline text-xs block"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Strava
          </a>
        </div>
      ))}
    </div>
  </div>
);


const LoadingModal = ({ isOpen, text }: { isOpen: boolean, text: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Loader className="animate-spin mx-auto mb-4" />
            <p>{text}</p>
        </div>
        </div>
    );
};

export { ActivityModal, LoadingModal };
