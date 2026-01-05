# Operations Page Widget Design - Implementation Summary

## Design Decision: Resizable Right Sidebar Panel

After analyzing diving operational planning workflows, I've implemented a **resizable right sidebar panel** containing all operational widgets. This design provides:

### ✅ Advantages

1. **Non-intrusive**: Main operational content remains fully visible
2. **Always accessible**: Widgets stay visible while scrolling through operations
3. **Resizable**: Users can adjust panel width (20-40% of screen)
4. **Collapsible**: Can minimize to icon-only view when not needed
5. **Logical grouping**: Widgets organized by category (Time/Environment, Navigation/Traffic)
6. **Mobile responsive**: Hidden on small screens, available via sheet/modal

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Top Header Bar - Compact widgets, draggable]                  │
├───────────────────────────────────────┬─────────────────────────┤
│                                       │ ┌──────────────────────┐│
│  Main Operations Content              │ │ Operations Widget    ││
│  (75% default, resizable)             │ │ Panel                ││
│                                       │ │ (25% default,        ││
│  • Operations Calendar                │ │  resizable)          ││
│  • Active Dive Operations             │ │                      ││
│  • Dive Planning Tools                │ │ Location Selector    ││
│  • Crew Management                    │ │                      ││
│                                       │ │ Time & Environment:  ││
│                                       │ │ • Clock              ││
│                                       │ │ • Weather            ││
│                                       │ │ • Tides              ││
│                                       │ │ • Moon Phase         ││
│                                       │ │                      ││
│                                       │ │ Navigation:          ││
│                                       │ │ • Navigation Widget  ││
│                                       │ │ • AIS Ship Finder    ││
│                                       │ │                      ││
│                                       │ │ [Collapse/Expand]    ││
│                                       │ └──────────────────────┘│
│                                       │ [Resize Handle]         │
└───────────────────────────────────────┴─────────────────────────┘
```

## Widget Organization

### Group 1: Location & Settings (Top)
- **Location Selector**: Set operational location (GPS or manual)
- **Widget Settings**: Configure widget visibility

### Group 2: Time & Environment
- **Clock**: Always visible (critical for dive timing)
- **Weather**: Current conditions (if enabled)
- **Tides**: Tide times and levels (if enabled)
- **Moon Phase**: Current moon phase (if enabled)

### Group 3: Navigation & Traffic
- **Navigation Widget**: Full charts, waypoints, routes (always visible)
- **AIS Ship Finder**: Vessel traffic tracking (if enabled)

## User Experience Flow

1. **Arrive at Operations Page**: Widget panel open on right (25% width)
2. **View Operations**: Main content visible, widgets accessible
3. **Resize Panel**: Drag handle to adjust widget panel width
4. **Collapse Panel**: Click collapse button to minimize to icons
5. **Configure Location**: Click location selector to set operational location
6. **Plan Operations**: Use widgets to assess environmental conditions
7. **Monitor Vessels**: Check AIS for nearby vessel traffic
8. **Navigate**: Use navigation widget for waypoints and routes

## Ergonomics for Diving Operations

### Critical Information Hierarchy

1. **Immediate Decisions** (Top of panel):
   - Current location (must know where operations are)
   - Time (critical for dive windows and decompression)
   - Weather conditions (go/no-go decisions)

2. **Planning Information** (Middle):
   - Tides (dive window planning)
   - Moon phase (visibility planning)
   - Navigation data (dive site planning)

3. **Real-time Monitoring** (Bottom):
   - AIS vessel traffic (safety during operations)
   - Navigation waypoints (operation tracking)

### Logical Flow

For a typical dive operation planning session:

1. **Set Location** → All widgets update with location-specific data
2. **Check Weather** → Determine if conditions are suitable
3. **Review Tides** → Identify optimal dive windows
4. **Check Moon Phase** → Assess visibility conditions
5. **Plan Navigation** → Mark dive sites, create routes
6. **Monitor Vessels** → Check for traffic in operational area
7. **Execute Operations** → Use widgets for real-time monitoring

## Technical Implementation

- **Component**: `OperationsWidgetPanel` (new component)
- **Layout**: Resizable panels using `react-resizable-panels`
- **Responsive**: Desktop (sidebar), Mobile (hidden/sheet)
- **State Management**: Widget preferences synced with localStorage
- **Location Sync**: All widgets automatically use saved location

## Mobile Considerations

On smaller screens (< 1024px):
- Widget panel hidden by default
- Can be accessed via sheet/modal
- Or stacked below operations content
- Maintains all functionality in compact form
