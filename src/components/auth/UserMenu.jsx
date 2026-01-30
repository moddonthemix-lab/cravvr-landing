import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Icons } from '../common/Icons';

// User Menu Dropdown Component
const UserMenu = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, profile, signOut, isOwner } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials
  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className={`user-menu ${isOpen ? 'open' : ''}`} ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            getInitials()
          )}
        </div>
        {Icons.chevronDown}
      </button>

      <div className="user-menu-dropdown">
        <div className="user-menu-header">
          <div className="user-menu-name">{profile?.name || 'User'}</div>
          <div className="user-menu-email">{user?.email}</div>
        </div>

        <button
          className="user-menu-item"
          onClick={() => {
            onNavigate?.('profile');
            setIsOpen(false);
          }}
        >
          {Icons.user}
          <span>Profile</span>
        </button>

        {isOwner && (
          <button
            className="user-menu-item"
            onClick={() => {
              onNavigate?.('owner-dashboard');
              setIsOpen(false);
            }}
          >
            {Icons.truck}
            <span>My Trucks</span>
          </button>
        )}

        <button
          className="user-menu-item"
          onClick={() => {
            onNavigate?.('settings');
            setIsOpen(false);
          }}
        >
          {Icons.settings}
          <span>Settings</span>
        </button>

        <div className="user-menu-divider" />

        <button
          className="user-menu-item danger"
          onClick={handleSignOut}
        >
          {Icons.logOut}
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
