import React from 'react';

type SkeletonProps = {
    width: string;
    height: string;
    className?: string;
  };

const Skeleton = ({ width, height, className }: SkeletonProps) => {
  return (
    <div className={`skeleton ${className}`} style={{ width, height }}></div>
  );
};

export default Skeleton;
