# Smart Library Widget

## Overview

The Smart Library Widget provides access to educational resources across the Skuggle platform with different access levels based on user status.

## Features

### Resource Categories

1. **Textbooks** - Digital textbooks and course materials
2. **Video Lessons** - Educational videos and tutorials
3. **Practice Tests** - Practice questions and mock exams
4. **Documents** - Study guides and reference materials

## Access Levels

### Guest Users (Landing Page)
- **Location**: Navigation menu with "LIBRARY" label
- **Access**: Preview mode - clicking any resource redirects to sign up
- **Purpose**: Showcase library features to attract new users

### Registered Users (Without Subscription)
- **Location**: Top bar icon (BookOpen with no sparkle)
- **Access**: Limited access - prompts to upgrade when clicking resources
- **Purpose**: Encourage subscription upgrades

### Subscribed Users (With School Tenant)
- **Location**: Top bar icon (BookOpen with sparkle indicator)
- **Access**: Full access to all library resources
- **Purpose**: Primary library functionality for active schools

## Implementation Details

### Component Location
`src/shared/ui/SmartLibraryWidget.tsx`

### Props
```typescript
interface SmartLibraryWidgetProps {
  user?: AuthenticatedUser | null;
  isGuest?: boolean;
  compact?: boolean;
}
```

### Usage Examples

#### Guest Navigation (Public Layout)
```tsx
<SmartLibraryWidget isGuest />
```

#### Registered User (App Layout)
```tsx
<SmartLibraryWidget user={user} compact />
```

## Visual Indicators

- **Sparkle Icon**: Appears on the library icon for subscribed users with full access
- **Badge Labels**: 
  - "Sign up" for guest users
  - "Upgrade" for registered but non-subscribed users
  - "Full access" for subscribed users

## Future Enhancements

1. Implement actual navigation to library resource pages
2. Add resource count indicators
3. Integrate with backend library API
4. Add recent/recommended resources
5. Implement search functionality within the library widget
6. Add download tracking and analytics
7. Support for offline access to downloaded resources
