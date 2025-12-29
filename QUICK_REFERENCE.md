# CravvR - Quick Reference Guide

## File Organization

The main `index.html` file is organized into clearly marked sections for easy editing.

### How to Navigate

Use Ctrl+F (or Cmd+F on Mac) and search for these section markers:

```
=== ICONS ===              - All SVG icon components
=== MAIN APP COMPONENT === - Core app with state management
=== MOCK DATA ===          - Sample trucks and events
=== NAVIGATION ===         - Bottom navigation bar
=== MODAL COMPONENTS ===   - Filter and rating popups
=== AUTHENTICATION VIEWS === - Login/signup screens
=== OWNER VIEWS ===        - Owner dashboard and tools
=== CUSTOMER VIEWS ===     - Home, Discover, Bolt, Profile
=== TRUCK & EVENT VIEWS === - Details and listings
=== MAIN RENDER ===        - View rendering logic
```

## Component List

### Icons (Lines ~28-130)
- MapPin
- Heart  
- Filter
- Clock
- X
- ChevronLeft
- Calendar
- Search
- Moon
- Sun
- EyeOff

### Navigation (Line ~514)
- NavBar - 5 tabs: Explore, Discover, Bolt, Events, Profile

### Modals (Line ~602)
- FilterModal - Dietary and cuisine filters
- MenuRatingModal - Rate individual menu items

### Authentication Views (Line ~817)
- LoginSelectView - Choose customer or owner
- CustomerLoginView - Customer signup
- OwnerLoginView - Owner login

### Owner Views (Line ~1031)
- OwnerDashboardView - Stats and management
- EventCreationView - Create new events

### Customer Views (Line ~1381)
- HomeView - Browse all trucks with filters
- DiscoverView - Swipe through trucks
- BoltView - Random meal + event generator
- CustomerProfileView - Points, favorites, activity

### Truck & Event Views (Line ~1939)
- TruckDetailView - Full truck details, menu, reviews
- EventsView - List all events
- EventDetailView - Single event details

## State Variables

Key state managed in the main CravvR component:

```javascript
view                  // Current view name
userRole             // 'guest', 'customer', or 'owner'
isLoggedIn           // Boolean
customerName         // User's name
favorites            // Array of favorite truck IDs
discoverIndex        // Current truck in discover view
filters              // Active dietary/cuisine filters
darkMode             // Dark mode toggle
customerPoints       // Reward points
checkedInTrucks      // User check-ins
reviews              // User reviews
eventAttendance      // Event RSVPs
```

## Common Editing Tasks

### Adding a New Food Truck
1. Go to MOCK DATA section (search "=== MOCK DATA ===")
2. Add new object to `mockTrucks` array
3. Follow the same structure as existing trucks

### Changing Colors
1. Search for color classes like "purple-500", "pink-500"
2. Replace with desired Tailwind color
3. Update both light and dark mode variants

### Adding a New View
1. Create view component function in appropriate section
2. Add view name to `view` state comment
3. Add conditional render in MAIN RENDER section
4. Add navigation button if needed in NavBar

### Modifying the Navigation
1. Go to NAVIGATION section (search "=== NAVIGATION ===")
2. Edit NavBar component
3. Adjust button order or styling

## Tips

- **Dark Mode**: All views support dark mode via `darkMode` state
- **Responsive**: Uses Tailwind's responsive classes
- **Icons**: Import from icon section or add new SVG icons
- **Data**: Modify `mockTrucks` and `mockEvents` for different data

## File Structure in Folder

```
cravvr-project/
├── index.html              # Main file (this is what you edit)
├── README.md              # Project overview
├── QUICK_REFERENCE.md     # This guide
└── src/                   # Reference files (not used in runtime)
    ├── components/
    │   ├── icons.jsx
    │   ├── Navigation.jsx
    │   └── ...
    └── data/
        └── mockData.js
```

**Note**: The `src/` folder contains reference/example component files for organizational purposes, but the actual app runs entirely from `index.html`.
