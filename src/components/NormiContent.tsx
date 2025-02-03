import React from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { DayEntry, StravaActivity, StreakStats } from '@/types/strava';
import { MILESTONES } from '@/lib/strava/config';
import {
  ActivityModal,
  StatsModal,
  MilestoneModal,
} from '@/components/ui/modal';
import { MilestoneCard, ProgressBar } from '@/components/MilestoneCard';
import StreakCard from '@/components/StreakCard';
import RecentDays from '@/components/RecentDays';
import { getMinimumDuration, getGoal } from '@/lib/utils';

const SPECIAL_GOAL = 2525;

const NormiHeader = () => {
  const goal = getGoal();
  const noGoal = 'Normi Run';
  const title =
    goal === SPECIAL_GOAL
      ? '25 for 25'
      : goal > 0
        ? `${goal} Days of Running`
        : noGoal;
  return (
    <CardHeader className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <CardTitle className="text-slate-600 text-xl">{title}</CardTitle>
      </div>
    </CardHeader>
  );
};
const NormiFooter = () => {
  return (
    <>
      {/* Normi Display */}
      <div className="text-sm text-center text-slate-600 pt-2 mt-4">
        Stay active and healthy by running at least{' '}
        <span style={{ whiteSpace: 'nowrap' }}>
          {getMinimumDuration()} minutes
        </span>{' '}
        every day!
      </div>
      {/* Strava Attribution */}
      <div className="flex justify-center mt-4">
        <Image
          src="/api_logo_pwrdBy_strava_stack_light.svg"
          alt="Powered by Strava"
          width={100}
          height={50}
          className="logo"
        />
      </div>
    </>
  );
};

interface NormiContentProps {
  streakData: {
    completed: boolean;
    currentStreak: number;
    currentStreakStartDate: Date;
    longestStreak: number;
    longestStreakStartDate: Date;
    todayMinutes: number;
    lastSevenDays: DayEntry[];
    stats: StreakStats;
  };
  showMilestoneModal: boolean;
  setShowMilestoneModal: (value: boolean) => void;
  showStatsModal: boolean;
  setShowStatsModal: (value: boolean) => void;
  selectedDay: number | null;
  selectedIndex: number | null;
  setSelectedIndex: (value: number | null) => void;
  selectedWeekday: string | null;
  setSelectedDay: (value: number | null) => void;
  setSelectedWeekday: (value: string | null) => void;
  selectedDayActivities: StravaActivity[];
  setSelectedDayActivities: (activities: StravaActivity[]) => void;
  error: string | null;
}

const NormiContent = ({
  streakData,
  showMilestoneModal,
  setShowMilestoneModal,
  showStatsModal,
  setShowStatsModal,
  selectedDay,
  selectedIndex,
  setSelectedIndex,
  selectedWeekday,
  setSelectedDay,
  setSelectedWeekday,
  selectedDayActivities,
  setSelectedDayActivities,
  error,
}: NormiContentProps) => {
  const handleCloseMilestoneModal = () => {
    setShowMilestoneModal(false);
  };

  const handleCloseStatsModal = () => {
    setShowStatsModal(false);
  };
  const goal = getGoal();

  return (
    <>
      <Card className="w-full max-w-sm mx-auto">
        <NormiHeader />
        <CardContent className="space-y-4">
          {/* Current Streak Display */}
          <StreakCard streakData={streakData} />
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 bg-slate-50 rounded-lg text-center cursor-pointer"
              onClick={() => {
                setShowStatsModal(true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xl font-bold">
                {streakData.todayMinutes}min
              </div>
              <div className="text-xs text-slate-600">today</div>
            </div>
            <MilestoneCard
              streak={streakData.currentStreak}
              todayCompleted={streakData.completed}
            />
          </div>
          {goal > 0 && (
            <ProgressBar 
              streak={streakData.currentStreak} 
              goal={goal === SPECIAL_GOAL ? 365 : goal} />
          )}
          {/* Last 7 Days Timeline with Strava Links */}
          <RecentDays
            streakData={streakData}
            setSelectedIndex={setSelectedIndex}
            setSelectedDay={setSelectedDay}
            setSelectedWeekday={setSelectedWeekday}
            setSelectedDayActivities={setSelectedDayActivities}
          />
          <NormiFooter />
        </CardContent>
        {selectedDay !== null && (
          <ActivityModal
            activities={selectedDayActivities}
            weekday={selectedWeekday || ''}
            index={selectedIndex || 0}
            streakData={streakData}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </Card>
      {showMilestoneModal && (
        <MilestoneModal
          milestone={MILESTONES[streakData.currentStreak]}
          onClose={handleCloseMilestoneModal}
        />
      )}
      {showStatsModal && (
        <StatsModal
          stats={streakData.stats}
          streakData={streakData}
          onClose={handleCloseStatsModal}
        />
      )}
      {error && <ErrorContent error={error} />}
    </>
  );
};

const ErrorContent = ({ error }: { error: string }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-md w-full sm:w-auto relative mx-4">
        <h1 className="text-red-500 font-bold">ERROR</h1>
        <p className="text-slate-600">Error: {error}</p>
      </div>
    </div>
  );
};

export { NormiContent, NormiHeader, NormiFooter, ErrorContent };
