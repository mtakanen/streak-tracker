import { useState } from 'react';
import { dateToIsoDate } from '@/lib/utils';
import { StreakData } from '@/types/strava';

const CurrentStreak = ({ streakData }: { streakData: StreakData }) => {
  const textColor = (dayCompleted: boolean) =>
    streakData.currentStreak > 0
      ? dayCompleted
        ? 'text-completed'
        : 'text-incomplete'
      : 'text-muted';

  return (
    <div
      className='border border-border p-4 rounded-lg text-primary text-center'
    >
      <div className="text-4xl font-bold">
        {streakData.currentStreak} days
      </div>
      <div className='text-sm'>
        current streak
      </div>
      <div className="text-foreground text-xs">
        {streakData.currentStreak > 0
          ? `started on ${dateToIsoDate(streakData.currentStreakStartDate)}`
          : 'Go running!'}
      </div>
      <div className={`text-sm ${textColor(streakData.completed)}`}>
        {streakData.currentStreak > 0 && !streakData.completed
          ? 'Keep going!'
          : ''}
      </div>
    </div>
  );
};

const LongestStreak = ({ streakData }: { streakData: StreakData }) => {
  return (
    <div className="border border-border p-4 rounded-lg text-primary text-center">
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
