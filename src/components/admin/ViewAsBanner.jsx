import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Icons } from '../common/Icons';
import './ViewAsBanner.css';

const ViewAsBanner = () => {
  const { viewingAs, stopViewingAs, isViewingAs } = useAuth();

  if (!isViewingAs) return null;

  return (
    <div className="view-as-banner">
      <div className="view-as-content">
        <span className="view-as-icon">{Icons.eye}</span>
        <span className="view-as-text">
          Viewing as <strong>{viewingAs.name || viewingAs.email}</strong> ({viewingAs.role})
        </span>
        <button className="view-as-exit" onClick={stopViewingAs}>
          {Icons.x}
          Exit View
        </button>
      </div>
    </div>
  );
};

export default ViewAsBanner;
