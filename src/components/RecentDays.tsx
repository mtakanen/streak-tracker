import { DayEntry, StravaActivity } from '@/types/strava';

interface RecentDaysProps {
  streakData: { lastSevenDays: DayEntry[] };
  setSelectedIndex: (index: number) => void;
  setSelectedDay: (dayIndex: number) => void;
  setSelectedWeekday: (weekday: string) => void;
  setSelectedDayActivities: (activities: StravaActivity[]) => void;
}

const RecentDays = ({
  streakData,
  setSelectedIndex,
  setSelectedDay,
  setSelectedWeekday,
  setSelectedDayActivities,
}: RecentDaysProps) => {

  const lastCompleted = streakData.lastSevenDays.findLastIndex((day) => day.completed);
  const bgColor = (dayCompleted: boolean, dayIndex: number) =>
    dayCompleted ? 'bg-green-100' : dayIndex > lastCompleted ? 'bg-slate-50': 'bg-orange-100';
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      <div className="text-sm font-medium">Previous 7 days</div>
      <div className="flex gap-1">
        {streakData.lastSevenDays.map(
          (
            day: {
              index: number;
              weekday: string;
              duration: number;
              completed: boolean;
              activities: StravaActivity[];
            }
          ) => (
            <div
              key={day.index}
              className={`flex-1 rounded-md p-2 text-center cursor-pointer ${bgColor(day.completed, day.index)}`}
              onClick={() => {
                if (day.completed) {
                  setSelectedIndex(day.index);
                  setSelectedDay(day.index);
                  setSelectedWeekday(day.weekday);
                  setSelectedDayActivities(day.activities);
                }
              }}
              style={{ cursor: day.completed ? 'pointer' : 'not-allowed' }}
            >
              <div className="text-xs text-green-800">
                <span style={{ whiteSpace: 'nowrap' }}>{day.weekday}</span>
              </div>
              <div className="text-sm font-medium">{day.duration}min</div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RecentDays;
