import { Milestone } from 'lucide-react';
import { getNextMilestone } from '@/lib/utils';

const MilestoneCard = ({streak, todayCompleted}: {streak: number, todayCompleted: boolean}) => {

    const nextMilestone = getNextMilestone(streak);
    const milestoneUnlocked = nextMilestone === '0 days'
    const isMilestoneDay = (nextMilestone === '1 days' && todayCompleted === false) || nextMilestone === '0 days';
    return (
        <div className={`p-3 bg-slate-50 rounded-lg text-center ${milestoneUnlocked ? 'cursor-pointer' : ''}`} onClick={milestoneUnlocked ? () => window.location.reload() : undefined}>
          <Milestone className="w-5 h-5 mx-auto mb-1" />
          <div>
            <div className="text-xl font-bold">{isMilestoneDay ? <span>Milestone</span> : nextMilestone}</div>
            <div className="text-xs text-slate-600">
              {milestoneUnlocked ? <span>unlocked!</span> : isMilestoneDay ? <span>today</span> : <span>until next milestone</span>}
            </div>
          </div>
        </div>
    );
}

export default MilestoneCard;
