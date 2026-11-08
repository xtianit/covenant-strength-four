import React from 'react';

export const ScriptureSkeleton: React.FC = () => (
  <div className="space-y-3 p-4 animate-pulse" role="status" aria-label="Loading passage">
    <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
    <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
    <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
  </div>
);