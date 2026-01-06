# Design System Documentation

## Overview

This document outlines the design system for the Professional Diver Training Platform - an enterprise-grade design system built on consistent tokens, components, and patterns.

## Design Tokens

### Spacing Scale

Based on a 4px base unit for consistent spacing throughout the application:

- `spacing-0`: 0px
- `spacing-1`: 4px
- `spacing-2`: 8px
- `spacing-3`: 12px
- `spacing-4`: 16px
- `spacing-5`: 20px
- `spacing-6`: 24px
- `spacing-8`: 32px
- `spacing-10`: 40px
- `spacing-12`: 48px
- `spacing-16`: 64px
- `spacing-20`: 80px
- `spacing-24`: 96px
- `spacing-32`: 128px

**Usage**: Always use spacing tokens instead of arbitrary values for consistency.

### Typography

#### Font Families

- **Sans Serif**: Inter (primary UI font)
- **Serif**: Georgia (used for content/reading)
- **Monospace**: Menlo (code and technical content)

#### Font Sizes

- `text-xs`: 12px (0.75rem)
- `text-sm`: 14px (0.875rem)
- `text-base`: 16px (1rem) - base size
- `text-lg`: 18px (1.125rem)
- `text-xl`: 20px (1.25rem)
- `text-2xl`: 24px (1.5rem)
- `text-3xl`: 30px (1.875rem)
- `text-4xl`: 36px (2.25rem)
- `text-5xl`: 48px (3rem)

#### Font Weights

- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

#### Line Heights

- `leading-none`: 1
- `leading-tight`: 1.25
- `leading-snug`: 1.375
- `leading-normal`: 1.5
- `leading-relaxed`: 1.625
- `leading-loose`: 2

### Colors

#### Primary Colors

Primary blue used for main actions and brand identity:

- `primary-50` through `primary-950`: Full color scale
- `primary`: Default primary color (hsl(214 100% 40%))
- `primary-foreground`: Text on primary backgrounds

#### Semantic Colors

Status and feedback colors:

- **Success**: `success-50` through `success-700` (Green)
- **Warning**: `warning-50` through `warning-700` (Yellow/Amber)
- **Error**: `error-50` through `error-700` (Red)
- **Info**: `info-50` through `info-700` (Blue)

#### Neutral Grays

- `gray-50` through `gray-950`: Full neutral scale
- `foreground`: Primary text color
- `muted-foreground`: Secondary text color
- `background`: Page background
- `card`: Card background

#### Usage Guidelines

- Use semantic colors for status indicators (success, warning, error, info)
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use muted colors for less important information
- Avoid using color alone to convey meaning - always include icons or text

### Shadows

Elevation system for depth and hierarchy:

- `shadow-xs`: Subtle elevation (1px)
- `shadow-sm`: Small elevation (4px)
- `shadow`: Default elevation (6px)
- `shadow-md`: Medium elevation (10px)
- `shadow-lg`: Large elevation (20px)
- `shadow-xl`: Extra large elevation (25px)
- `shadow-2xl`: Maximum elevation
- `shadow-inner`: Inset shadow

**Usage**:
- Cards: `shadow-sm` or `shadow`
- Modals/Dialogs: `shadow-lg` or `shadow-xl`
- Dropdowns: `shadow-md`
- Hover states: Increase shadow by one level

### Border Radius

Consistent rounded corners:

- `rounded-none`: 0
- `rounded-sm`: 2px
- `rounded`: 8px (default)
- `rounded-md`: 6px
- `rounded-lg`: 12px
- `rounded-xl`: 16px
- `rounded-2xl`: 24px
- `rounded-full`: Circular

**Usage**:
- Buttons: `rounded` or `rounded-md`
- Cards: `rounded-lg`
- Badges/Pills: `rounded-full`
- Inputs: `rounded-md`

### Transitions

Consistent animation timing:

- `transition-fast`: 150ms
- `transition-base`: 200ms (default)
- `transition-slow`: 300ms
- `transition-slower`: 500ms

**Usage**:
- Hover states: `transition-fast` or `transition-base`
- Modal/Dialog: `transition-slow`
- Complex animations: `transition-slower`

## Components

### Buttons

#### Variants

- `default`: Primary action button
- `destructive`: Delete/dangerous actions
- `outline`: Secondary actions
- `secondary`: Alternative secondary style
- `ghost`: Tertiary actions
- `link`: Text link button
- `success`: Success/confirmation actions
- `warning`: Warning actions
- `info`: Informational actions

#### Sizes

- `sm`: Small button (36px height)
- `default`: Default size (40px height)
- `lg`: Large button (44px height)
- `icon`: Icon-only button (40x40px)

#### Usage Guidelines

- Use primary buttons for the main action on a page
- Limit to one primary button per view
- Use destructive variant for delete/remove actions
- Buttons should have a minimum touch target of 44x44px on mobile

### Cards

Standardized card component with elevation support.

#### Elevation Levels

- `none`: No shadow
- `sm`: Small shadow (default)
- `md`: Medium shadow
- `lg`: Large shadow

#### Structure

- `CardHeader`: Top section with title/description
- `CardTitle`: Main heading
- `CardDescription`: Supporting text
- `CardContent`: Main content area
- `CardFooter`: Bottom action area

### Data Tables

Enterprise-grade data table with:

- Sorting (click column headers)
- Filtering (global search and column filters)
- Pagination (configurable page sizes)
- Column visibility toggles
- Bulk selection and actions
- Export options (CSV, Excel, PDF)
- Responsive mobile view

**Note**: Requires `@tanstack/react-table` package to be installed.

### Forms

#### Input States

- Default: Normal input state
- Focus: Visible ring with primary color
- Error: Red border and error message below
- Disabled: Reduced opacity, non-interactive
- Success: Green border (optional, for validated fields)

#### Validation

- Real-time validation feedback
- Field-level error messages
- Success indicators for completed fields
- Required field indicators (*)

#### Accessibility

- All inputs must have associated labels
- Error messages are announced to screen readers
- Keyboard navigation support
- Focus management in forms

### Loading States

#### Skeleton Loaders

- `SkeletonCard`: Card placeholder
- `SkeletonTable`: Table placeholder
- `SkeletonList`: List placeholder
- `LoadingSpinner`: Animated spinner

#### Usage

- Show skeletons for content that's loading
- Use spinners for actions/inline loading
- Provide loading text for clarity

### Empty States

Pre-built empty states for common scenarios:

- `EmptyState`: Generic empty state
- `ErrorState`: Error with retry
- `NotFoundState`: No results found
- `NoDataState`: No data available
- `OfflineState`: Network disconnected
- `ServerErrorState`: Server error
- `WarningState`: Warning message

All empty states include:
- Descriptive icon
- Clear heading
- Helpful description
- Action buttons (where applicable)

## Layout Patterns

### Page Structure

```
┌─────────────────────────────────┐
│  Sidebar Navigation             │
│                                 │
├─────────────────────────────────┤
│  Page Header                    │
│  ┌─────────────────────────┐   │
│  │ Title + Description     │   │
│  │ Actions                 │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  Content Area                   │
│  ┌─────────────────────────┐   │
│  │ Sections/Cards          │   │
│  │                         │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Dashboard Layout

1. **Page Header** (`PageHeader` component)
   - Title and description
   - Primary actions
   - Breadcrumbs (if applicable)

2. **Stat Cards** (`StatCard` component)
   - Grid layout (responsive: 1 col mobile, 2-3 cols desktop)
   - Consistent spacing and styling
   - Icons and trend indicators

3. **Content Sections** (`PageSection` component)
   - Consistent spacing
   - Optional titles and actions
   - Card wrapper for visual grouping

### Mobile Considerations

- Touch targets minimum 44x44px
- Simplified layouts on small screens
- Bottom navigation for key actions
- Swipe gestures where appropriate
- Responsive tables (card view on mobile)

## Accessibility

### WCAG Compliance

- **Level AA** minimum compliance
- Color contrast ratios:
  - Normal text: 4.5:1
  - Large text: 3:1
  - UI components: 3:1

### Keyboard Navigation

- All interactive elements keyboard accessible
- Logical tab order
- Skip links for main content
- Focus indicators clearly visible
- Keyboard shortcuts (Cmd/Ctrl + K for search)

### Screen Readers

- Semantic HTML structure
- ARIA labels for icons and actions
- ARIA live regions for dynamic content
- Proper heading hierarchy (h1 → h2 → h3)
- Descriptive alt text for images

### Focus Management

- Focus trap in modals
- Focus restoration after actions
- Visible focus indicators
- Focus visible states for keyboard users

## Icon Usage

### Icon Library

- **Lucide React**: Primary icon library
- Consistent size: 16px (sm), 20px (md), 24px (lg)
- Consistent stroke width: 2px

### Usage Guidelines

- Use icons to reinforce meaning, not replace text
- Maintain consistent sizing within context
- Provide text labels for icon-only buttons
- Use semantic icons (e.g., trash for delete)

## Best Practices

### Do's

✅ Use design tokens for spacing, colors, and typography
✅ Follow component APIs and props
✅ Maintain consistent spacing and alignment
✅ Use semantic HTML
✅ Ensure accessibility compliance
✅ Test on multiple screen sizes
✅ Provide loading and error states
✅ Use meaningful icons and labels

### Don'ts

❌ Don't use arbitrary spacing values
❌ Don't mix design patterns
❌ Don't override component styles excessively
❌ Don't ignore accessibility requirements
❌ Don't use color alone to convey meaning
❌ Don't create custom components when standard ones exist
❌ Don't hardcode colors - use tokens

## Resources

- Design tokens: `client/src/lib/design-tokens.ts`
- Component library: `client/src/components/ui/`
- CSS variables: `client/src/index.css`
- Tailwind config: `tailwind.config.ts`

## Dependencies

The design system relies on:

- Tailwind CSS
- Radix UI (via Shadcn/ui)
- Lucide React (icons)
- @tanstack/react-table (for DataTable component)
- date-fns (for date formatting)

To install missing dependencies:

```bash
npm install @tanstack/react-table
```

