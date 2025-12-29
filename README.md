# CravvR - Food Truck Discovery Platform

A comprehensive food truck discovery platform with swipe-to-discover functionality, event management, and AI-powered recommendations.

## 📁 Project Structure

```
cravvr-project/
├── index.html              # Main entry point
├── README.md              # This file
└── src/
    ├── components/
    │   ├── icons.jsx          # All SVG icon components
    │   ├── Navigation.jsx     # Bottom navigation bar
    │   ├── modals/
    │   │   ├── FilterModal.jsx       # Filtering modal
    │   │   └── MenuRatingModal.jsx   # Menu item rating modal
    │   └── views/
    │       ├── HomeView.jsx           # Main explore page
    │       ├── DiscoverView.jsx       # Swipe-style discovery
    │       ├── BoltView.jsx           # AI random generator
    │       ├── TruckDetailView.jsx    # Food truck details
    │       ├── EventsView.jsx         # Events listing
    │       ├── EventDetailView.jsx    # Single event details
    │       ├── EventCreationView.jsx  # Create new event (owners)
    │       ├── LoginViews.jsx         # All login-related views
    │       ├── OwnerViews.jsx         # Owner dashboard & management
    │       └── CustomerProfileView.jsx # Customer profile & stats
    └── data/
        └── mockData.js        # Mock data for trucks and events
```

## 🎨 Features

### For Customers:
- **Explore**: Browse all food trucks with filtering options
- **Discover**: Swipe through trucks Tinder-style (like/pass)
- **Bolt**: AI-powered random meal & event generator
- **Events**: Discover and RSVP to food truck events
- **Profile**: Track points, favorites, and check-ins
- **Reviews**: Rate trucks and individual menu items
- **Dark Mode**: Toggle between light and dark themes

### For Truck Owners:
- **Dashboard**: Manage your food truck business
- **Event Creation**: Create and promote events
- **Review Management**: View and hide reviews
- **Subscription Plans**: Free (1 event/month) or Pro (unlimited)

## 🚀 Running the Project

Simply open `index.html` in a web browser. No build process required!

The project uses:
- React 18 (via CDN)
- Tailwind CSS (via CDN)
- Babel Standalone (for JSX transformation)

## 📝 Editing Components

Each component is separated into its own file for easy editing:

1. **Adding new icons**: Edit `src/components/icons.jsx`
2. **Modifying navigation**: Edit `src/components/Navigation.jsx`
3. **Changing views**: Edit files in `src/components/views/`
4. **Updating modals**: Edit files in `src/components/modals/`
5. **Modifying data**: Edit `src/data/mockData.js`

## 🎯 Key Sections to Edit

### Main App State
All state management is in the main `index.html` file in the `CravvR` component.

### Styling
The project uses Tailwind CSS utility classes. Colors and themes can be adjusted by modifying the className attributes.

### Dark Mode
Dark mode styles use conditional rendering:
```jsx
className={darkMode ? 'bg-gray-800' : 'bg-white'}
```

## 🔄 Data Flow

1. `mockData.js` → Contains all truck and event data
2. `index.html` → Main app with state management
3. View components → Display data and handle user interactions
4. Navigation → Controls view switching

## 💡 Tips

- Search for specific features using view names (e.g., "BoltView", "DiscoverView")
- Color scheme uses purple/pink gradients
- All views are responsive and work on all screen sizes
- Dark mode is controlled by the `darkMode` state variable

## 🎨 Color Palette

- Primary: Purple (#a855f7) / Pink (#ec4899)
- Success: Green (#10b981)
- Warning: Amber (#f59e0b)
- Info: Blue (#3b82f6)
- Dark Mode: Gray-900 (#111827)
