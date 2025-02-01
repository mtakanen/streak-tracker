import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NormiHeader, NormiFooter } from './NormiContent';

type SkeletonProps = {
  width: string;
  height: string;
};

const Skeleton = ({ width, height }: SkeletonProps) => {
  return (
    <div className="skeleton"  style={{ width, height }}></div>
  );
};

const SkeletonContent = () => {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <NormiHeader />
      <CardContent className="space-y-4">
        {/* Streak Display */}
        <Skeleton width="100%" height="130px" />
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton width="100%" height="90px" />
          <Skeleton width="100%" height="90px" />
        </div>
        {/* Last 7 Days Timeline */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-sm font-medium">Previous 7 days</div>
          <div className="flex gap-[0.3rem]">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex-1 rounded-md">
                <Skeleton width="100" height="50px" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <NormiFooter />
    </Card>
  );
};

export default SkeletonContent;