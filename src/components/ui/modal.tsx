import { useEffect, useState } from 'react';
import { Loader, XIcon } from 'lucide-react';
import { StravaActivity, StreakData, StreakStats } from '@/types/strava';
import { updateActivityName } from '@/lib/strava/api';
import { useScope } from '@/context/ScopeContext';
import Realistic from 'react-canvas-confetti/dist/presets/realistic';

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

const handleUpdateActivityName = async (
  activityId: number,
  newName: string
) => {
  const accessToken = localStorage.getItem('stravaAccessToken');
  if (!accessToken) {
    console.error('No access token found');
    return;
  }

  try {
    await updateActivityName(activityId, newName, accessToken);
  } catch (error) {
    console.error('Error updating activity name:', error);
  }
};

const ActivityModal = ({
  activities,
  weekday,
  index,
  streakData,
  onClose,
}: {
  activities: StravaActivity[];
  weekday: string;
  index: number;
  streakData: StreakData;
  onClose: () => void;
}) => {
  const { scope } = useScope();

  const dateTitle = `${weekday} ${new Date(activities[0].start_date_local).toLocaleDateString()}`;
  let dayStreak = streakData.currentStreak + index - 6 ;
  if (!streakData.completed) {
    dayStreak = dayStreak + 1;
  }
  const dayDuration = Math.floor(activities.reduce(
    (total, activity) => total + activity.moving_time, 0)
    /60
  )
  const newName = 'Normi Run #' + dayStreak;
  let allowedToRename = false;
  if (scope && scope.includes('activity:write') && dayStreak >= 1) {
    allowedToRename = true;
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white p-4 rounded-lg max-w-md w-full sm:w-auto relative mx-4">
        <h2 className="text-l font-bold">{dateTitle}</h2>
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          <XIcon />
        </button>
        <p className="text-xs mb-4">
          {dayDuration}min
        </p>
        {activities.map((activity) => (
          <div key={activity.id} className="mb-2">
            <span className="text-xs whitespace-nowrap flex items-center">
              {activityTypeSymbols[activity.type] || ''} {activity.name}
              <a
                href={`${ACTIVITY_URL}/${activity.id}`}
                className="text-[#FC4C02] underline ml-2"
                target="_blank"
              >
                View on Strava
              </a>
            </span>
            {allowedToRename && activity.name !== newName && (
              <button
                onClick={() => {
                  handleUpdateActivityName(activity.id, newName);
                  activity.name = newName; // Update the activity name locally to remove the button
                  onClose(); // Close the modal
                }}
              >
                <div className="text-xs">
                  ✏️ <span>Rename:</span>{' '}
                  <span className="italic">{newName}</span>
                </div>
              </button>
            )}
            <div className="mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingModal = ({ isOpen, text, progress }: { isOpen: boolean; text: string; progress: number }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <Loader className="animate-spin mx-auto mb-4" />
        <p>{text}</p>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
          <div
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

function Confetti(size: string) {
  if (size == 'major') {
    return <Realistic autorun={{ speed: 1, duration: 3 }} />;
  } else {
    // TODO: find minor confetti
    // return <Realistic autorun={{ speed: 1, duration: 3 }}/>;
  }
}

const MilestoneModal = ({
  milestone,
  onClose,
}: {
  milestone: { text: string; size: string };
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 750); // 750 ms delay

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white p-4 rounded-lg max-w-md w-full sm:w-auto relative mx-4">
        <h2 className="text-l font-bold mb-4">Milestone Unlocked!</h2>
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          &times;
        </button>
        <p>{milestone.text}</p>
      </div>
      {Confetti(milestone.size)}
    </div>
  );
};

const StatsModal = ({
  stats,
  streakData,
  onClose,
}: {
  stats: StreakStats;
  streakData: StreakData;
  onClose: () => void;
}) => {
  const div0 = (a: number, b: number) => {
    if (b === 0) {
      return 0;
    }
    return a / b;
  };

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 750); // 750 ms delay

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const streak = streakData.currentStreak;
  const totalHours = Math.floor(stats.totalDuration / 60);
  const totalMinutes = stats.totalDuration % 60;
  const avgDuration = Math.floor(div0(stats.totalDuration, stats.runs));
  const avgDistance = Math.floor(div0(stats.totalDistance, stats.runs));
  const avgPace = div0(stats.totalDuration, stats.totalDistance);
  const paceMinutes = Math.floor(avgPace);
  const paceSeconds = Math.round((avgPace - paceMinutes) * 60);
  const extraFreq = Math.round(streak / (streak - stats.minimumDays));
  const minimumFreq = Math.round(div0(streak, stats.minimumDays));
  const outdoorRunRatio = Math.round(div0(stats.outdoorRuns, stats.runs) * 100);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white p-4 rounded-lg max-w-md w-full sm:w-auto relative mx-4">
        <h1 className="text-slate-600 font-bold mb-2 mr-4">Statistics</h1>
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-slate-600 mt-2">Totals</h2>
        <p>
          <span className="text-slate-600 text-xs">Streak: </span>
          <span className="float-right">{streak} days</span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Runs:</span>
          <span className="float-right">{stats.runs}</span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Minimum days:</span>
          <span className="float-right">{stats.minimumDays}</span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Duration:</span>
          <span className="float-right">
            {totalHours}h{totalMinutes}min
          </span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Distance:</span>
          <span className="float-right">
            {stats.totalDistance.toFixed(1)} km
          </span>
        </p>
        <h2 className="text-slate-600 mt-2">Averages</h2>
        <p>
          <span className="text-slate-600 text-xs">Duration:</span>
          <span className="float-right">{avgDuration}min</span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Distance:</span>
          <span className="float-right">{avgDistance.toFixed(1)} km</span>
        </p>
        <p>
          <span className="text-slate-600 text-xs">Pace:</span>
          <span className="float-right">
            {paceMinutes.toFixed(0).padStart(2, '0')}&apos;
            {paceSeconds.toFixed(0).padStart(2, '0')}&quot;
          </span>
        </p>
        <h2 className="text-slate-600 mt-2">Misc</h2>
        <p>
          <span className="text-slate-600 text-xs">Outdoor runs:</span>
          <span className="float-right">{outdoorRunRatio}%</span>
        </p>
        {extraFreq > 1 ? (
          <p>
            <span className="text-slate-600 text-xs">Extras every:</span>
            <span className="float-right">{extraFreq} days</span>
          </p>
        ) : (
          <p>
            <span className="text-slate-600 text-xs">Minimum day every:</span>
            <span className="float-right">{minimumFreq} days</span>
          </p>
        )}
        <p>
          <span className="text-slate-600 text-xs">Longest streak:</span>
          <span className="float-right">{streakData.longestStreak} days</span>
        </p>
      </div>
    </div>
  );
};

export { ActivityModal, LoadingModal, MilestoneModal, StatsModal };
