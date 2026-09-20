import React from 'react';

export const MealsLoadingGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
        >
          <div className="h-48 animate-pulse bg-white/[0.06]" />
          <div className="space-y-4 p-4">
            <div className="h-5 w-2/3 rounded-full bg-white/[0.07]" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, metricIndex) => (
                <div key={metricIndex} className="h-14 rounded-2xl bg-white/[0.055]" />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-xl bg-white/[0.055]" />
              <div className="h-8 flex-1 rounded-xl bg-white/[0.055]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
