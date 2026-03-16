import React from 'react';

export const MealsLoadingGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="rounded-2xl shadow-lg border overflow-hidden"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="h-48 animate-pulse" style={{ background: 'var(--color-bg-alt)' }}></div>
          <div className="p-6">
            <div className="h-6 rounded animate-pulse mb-3" style={{ background: 'var(--color-bg-alt)' }}></div>
            <div className="h-4 rounded animate-pulse mb-2" style={{ background: 'var(--color-bg-alt)' }}></div>
            <div className="h-4 rounded animate-pulse w-3/4" style={{ background: 'var(--color-bg-alt)' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};
