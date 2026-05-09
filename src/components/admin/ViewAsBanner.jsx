import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Icons } from '../common/Icons';

const ViewAsBanner = () => {
  const { viewingAs, stopViewingAs, isViewingAs } = useAuth();

  if (!isViewingAs) return null;

  return (
    <div className="sticky top-0 z-[60] bg-warning text-warning-foreground shadow-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 text-sm">
        <span className="h-4 w-4 shrink-0">{Icons.eye}</span>
        <span className="flex-1 truncate">
          Viewing as <strong>{viewingAs.name || viewingAs.email}</strong> ({viewingAs.role})
        </span>
        <button
          type="button"
          onClick={stopViewingAs}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/25"
        >
          <span className="h-3.5 w-3.5">{Icons.x}</span>
          Exit View
        </button>
      </div>
    </div>
  );
};

export default ViewAsBanner;
