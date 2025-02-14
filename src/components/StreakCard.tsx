import { useState } from 'react';
import { dateToIsoDate } from '@/lib/utils';
import { StreakData } from '@/types/strava';

const CurrentStreak = ({ streakData }: { streakData: StreakData }) => {
  const bgColor = (dayCompleted: boolean) =>
    streakData.currentStreak > 0
      ? dayCompleted
        ? 'bg-accent'
        : 'bg-orange-100' // FIXME: define contextual color
      : 'bg-muted';

  return (
    <div
      className={`p-4 rounded-lg text-center ${bgColor(streakData.completed)}`}
    >
      <div className={`text-4xl font-bold ${bgColor(streakData.completed)}`}>
        {streakData.currentStreak} days
      </div>
      <div className={`text-sm ${bgColor(streakData.completed)}`}>
        current streak
      </div>
      <div className="text-xs">
        {streakData.currentStreak > 0
          ? `started on ${dateToIsoDate(streakData.currentStreakStartDate)}`
          : 'Go running!'}
      </div>
      <div className="text-sm text-orange-600">
        {streakData.currentStreak > 0 && !streakData.completed
          ? 'Keep going!'
          : ''}
      </div>
    </div>
  );
};

const LongestStreak = ({ streakData }: { streakData: StreakData }) => {
  return (
    <div className="bg-muted p-4 rounded-lg text-center">
      <div className="text-4xl font-bold ">
        {streakData.longestStreak} days
      </div>
      <div className="text-sm">longest streak</div>
      <div className="text-xs">
        {`started on ${dateToIsoDate(streakData.longestStreakStartDate)}`}
      </div>
      <div className="text-sm">Beat it!</div>
    </div>
  );
};

const StreakCard = ({ streakData }: { streakData: StreakData }) => {
  const [showLongestStreak, setShowLongestStreak] = useState(false);

  return (
    <div
      onClick={() => setShowLongestStreak(!showLongestStreak)}
      style={{ cursor: 'pointer' }}
    >
      {showLongestStreak ? (
        <LongestStreak streakData={streakData} />
      ) : (
        <CurrentStreak streakData={streakData} />
      )}
    </div>
  );
};
export default StreakCard;
