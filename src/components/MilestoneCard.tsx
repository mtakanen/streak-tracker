import { Milestone } from 'lucide-react';
import {getNextMilestone } from '@/lib/utils';

const MilestoneCard = ({streak}: {streak: number}) => {

    const nextMilestone = getNextMilestone(streak);
    const isMilestoneDay = nextMilestone === '1 days';
    return (
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <Milestone className="w-5 h-5 mx-auto mb-1" />
            <div>
                <div className="text-xl font-bold">{isMilestoneDay? <span>Milestone</span>:nextMilestone}</div>
                <div className="text-xs text-slate-600">{ isMilestoneDay? <span>day</span>: <span>until next milestone</span>}</div>
            </div>
        </div>
    );
}

export default MilestoneCard;
