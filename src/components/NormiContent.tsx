import React from 'react';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {CardHeader, CardTitle} from '@/components/ui/card';
import { DayEntry, StravaActivity, StreakStats } from '@/types/strava';
import { MILESTONES } from '@/lib/strava/config';
import { ActivityModal, StatsModal, MilestoneModal } from '@/components/ui/modal';
import MilestoneCard from '@/components/MilestoneCard'
import { dateToIsoDate, getMinimumDuration } from '@/lib/utils';

const NormiHeader = () => {
  return (
    <CardHeader className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <CardTitle className="text-slate-600 text-xl">Normi Run</CardTitle>
      </div>
    </CardHeader>
  );
}
const NormiFooter = () => {
  return (
      <>
        {/* Goal Display */}
        <div className="text-sm text-center text-slate-600 pt-2">
          Normi: Stay active and healthy by running at least <span style={{ whiteSpace: 'nowrap' }}>{getMinimumDuration()} minutes</span> every day!
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
}

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
}

const NormiContent = ({ streakData, showMilestoneModal, setShowMilestoneModal ,showStatsModal, setShowStatsModal, selectedDay, selectedIndex, setSelectedIndex, selectedWeekday, setSelectedDay, setSelectedWeekday, selectedDayActivities, setSelectedDayActivities }: NormiContentProps) => {
  const handleCloseMilestoneModal = () => {
    setShowMilestoneModal(false);
  };

  const handleCloseStatsModal = () => {
    setShowStatsModal(false);
  };
  return (
    <>
      <Card className="w-full max-w-sm mx-auto">
        <NormiHeader />
        <CardContent className="space-y-4">
          {/* Current Streak Display */}
          <div className={`text-center p-4 rounded-lg ${streakData.completed ? 'bg-green-50' : 'bg-orange-50'}`}>
            <div className={`text-4xl font-bold ${streakData.completed ? 'text-green-600' : 'text-orange-600'}`}>
              {streakData.currentStreak} days
            </div>
            <div className={`text-sm ${streakData.completed ? 'text-green-600' : 'text-orange-600'}`}>
              current streak
            </div>
            {/* TODO: do not show this message if the streak is broken */}
            <div className="text-sm text-orange-600">
              {streakData.currentStreak > 0 && !streakData.completed ? 'Keep going! Run today to continue your streak!' : ''}
            </div>
            <div className="text-xs text-slate-600">
              {streakData.currentStreak > 0 ? `started on ${dateToIsoDate(streakData.currentStreakStartDate)}` : 'Go running!'}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center cursor-pointer"
             onClick={() => {
              setShowStatsModal(true);
             }}
             style={{ cursor: 'pointer' }}
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xl font-bold">{streakData.todayMinutes}min</div>
              <div className="text-xs text-slate-600">today</div>
            </div>
            <MilestoneCard 
              streak={streakData.currentStreak}
              todayCompleted={streakData.completed} 
            />
          </div>
          {/* Last 7 Days Timeline with Strava Links */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-sm font-medium">Previous 7 days</div>
            <div className="flex gap-1">
              {streakData.lastSevenDays.map((day: {
                index: number;
                weekday: string;
                duration: number;
                completed: boolean;
                activities: StravaActivity[];
              }, index: number) => (
                <div
                key={index}
                className={`flex-1 rounded-md p-2 text-center cursor-pointer ${day.completed ? 'bg-green-100' : 'bg-orange-100'}`}
                onClick={() => {
                  if (day.completed) {
                    setSelectedIndex(index);
                    setSelectedDay(day.index);
                    setSelectedWeekday(day.weekday);
                    setSelectedDayActivities(day.activities);
                  }
                }}
                style={{ cursor: day.completed ? 'pointer' : 'not-allowed' }}      
                >
                <div className="text-xs text-green-800"><span style={{ whiteSpace: 'nowrap' }}>{day.weekday}</span></div>
                <div className="text-sm font-medium">{day.duration}min</div>
                </div>
              ))}
            </div>
          </div>
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
      { showMilestoneModal && 
        <MilestoneModal 
          milestone={MILESTONES[streakData.currentStreak]} 
          onClose={handleCloseMilestoneModal}
        />
      } 
      {showStatsModal && (
        <StatsModal 
          stats={streakData.stats} 
          streakData={streakData}
          onClose={handleCloseStatsModal} 
        />
      )}
    </>
  );
};

const ErrorContent = ({ error }: { error: string }) => {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <NormiHeader />
      <CardContent>
        <p>Error: {error}</p>
      </CardContent>
    </Card>
  );
};

export { NormiContent, NormiHeader, NormiFooter, ErrorContent };