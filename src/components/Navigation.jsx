import { MapPin, Heart, Calendar } from './icons.jsx';

export const NavBar = ({ view, setView, darkMode, userRole, customerName }) => (
  <div className={`fixed bottom-0 left-0 right-0 border-t ${
    darkMode 
      ? 'bg-gray-900 border-gray-800' 
      : 'bg-white border-gray-200'
  } safe-area-inset-bottom z-50`}>
    <div className="flex justify-around items-center h-16 max-w-7xl mx-auto px-4">
      <button
        onClick={() => setView('home')}
        className={`flex flex-col items-center justify-center flex-1 transition-colors ${
          view === 'home' 
            ? (darkMode ? 'text-purple-400' : 'text-purple-500')
            : (darkMode ? 'text-gray-400' : 'text-gray-600')
        }`}
      >
        <MapPin size={24} />
        <span className="text-xs mt-1">Explore</span>
      </button>
      
      <button
        onClick={() => setView('discover')}
        className={`flex flex-col items-center justify-center flex-1 transition-colors ${
          view === 'discover' 
            ? (darkMode ? 'text-purple-400' : 'text-purple-500')
            : (darkMode ? 'text-gray-400' : 'text-gray-600')
        }`}
      >
        <Heart size={24} />
        <span className="text-xs mt-1">Discover</span>
      </button>
      
      <button
        onClick={() => setView('bolt')}
        className={`flex flex-col items-center justify-center flex-1 transition-colors ${
          view === 'bolt' 
            ? (darkMode ? 'text-purple-400' : 'text-purple-500')
            : (darkMode ? 'text-gray-400' : 'text-gray-600')
        }`}
      >
        <span className="text-2xl">⚡</span>
        <span className="text-xs mt-1">Bolt</span>
      </button>
      
      <button
        onClick={() => setView('events')}
        className={`flex flex-col items-center justify-center flex-1 transition-colors ${
          view === 'events' 
            ? (darkMode ? 'text-purple-400' : 'text-purple-500')
            : (darkMode ? 'text-gray-400' : 'text-gray-600')
        }`}
      >
        <Calendar size={24} />
        <span className="text-xs mt-1">Events</span>
      </button>

      <button
        onClick={() => {
          if (userRole === 'customer') {
            setView('customer-profile');
          } else {
            setView('login-select');
          }
        }}
        className={`flex flex-col items-center justify-center flex-1 transition-colors ${
          view === 'customer-profile' || view === 'login-select'
            ? (darkMode ? 'text-purple-400' : 'text-purple-500')
            : (darkMode ? 'text-gray-400' : 'text-gray-600')
        }`}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-purple-400' : 'bg-purple-500'
        }`}>
          <span className="text-white text-xs font-bold">
            {userRole === 'customer' ? customerName.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        <span className="text-xs mt-1">
          {userRole === 'customer' ? 'Profile' : 'Login'}
        </span>
      </button>
    </div>
  </div>
);
