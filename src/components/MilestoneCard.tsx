import { Milestone } from 'lucide-react';
import { getDaysToNextMilestone, isMilestoneDay } from '@/lib/utils';
import { StreakData } from '@/types/strava';


const MilestoneCard =  ({ streakData }: { streakData: StreakData })  => {
  const daysToNextMilestone = getDaysToNextMilestone(streakData.currentStreak);
  const milestoneDay = isMilestoneDay(streakData.currentStreak, streakData.completed, streakData.currentStreakUpdatedAt, daysToNextMilestone);
  const milestoneUnlocked = (milestoneDay && streakData.completed);
  return (
    <div
      className={`border border-border p-3 rounded-lg text-primary text-center ${milestoneUnlocked ? 'cursor-pointer' : ''}`}
      onClick={milestoneUnlocked ? () => window.location.reload() : undefined}
    >
      <Milestone className="w-5 h-5 mx-auto mb-1" />
      <div>
      <div className="text-xl font-bold">
        {milestoneDay ? <span>Milestone</span> : `${daysToNextMilestone} days`}
      </div>
      <div className="text-xs">
        {milestoneUnlocked ? (
        <span>unlocked!</span>
        ) : milestoneDay ? (
        <span>today</span>
        ) : (
        <span>until next milestone</span>
        )}
      </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ streak, goal }: { streak: number, goal: number }) => {
  const progress = streak / goal;
  return (
    <>
      <div className="flex justify-between">
      <span className="text-primary text-sm">Goal progress</span>
      <span className="text-primary text-xs ">{goal} days</span>
      </div>
      <div className="bg-muted w-full rounded-full h-2.5">
        <div
          className="bg-orange-500 h-2.5 rounded-full"
          style={{ width: `${progress * 100}%` }}
          title={`${Math.round(progress * 100)}%`}
        ></div>
      </div>
    </>
  );
};

export { MilestoneCard, ProgressBar };

/**
const ProgressCircle = ({ progress }: { progress: number }) => {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);

  console.log(circumference, offset);
  return (
    <div className="p-3 bg-slate-50 rounded-lg text-center">
      <div className="relative w-16 h-16 mx-auto">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
          <circle
            className="text-slate-200"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            cx="18"
            cy="18"
            r={radius}
          />
          <circle
            className="text-green-600"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            cx="18"
            cy="18"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)" // Rotate the circle to start from 12 o'clock
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
          {Math.round(progress * 100)}%
        </div>
      </div>
      <div className="text-xs text-slate-600">progress</div>
    </div>
  );
};
 */